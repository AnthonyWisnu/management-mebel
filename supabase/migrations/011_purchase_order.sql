-- ============================================================
-- MIGRATION 011: Purchase Order (Pesanan / Pengingat)
-- ============================================================

-- ── Tabel: purchase_order ────────────────────────────────────
CREATE TABLE purchase_order (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  no_po         text          UNIQUE NOT NULL,
  tanggal_po    date          NOT NULL DEFAULT CURRENT_DATE,
  batas_waktu   date          NOT NULL,
  pelanggan_id  uuid          NOT NULL REFERENCES pelanggan(id),
  status        text          NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'dalam_proses', 'selesai', 'dibatalkan')),
  total_estimasi numeric(14,2) NOT NULL DEFAULT 0,
  catatan       text,
  dibuat_oleh   uuid          REFERENCES profiles(id),
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  deleted_at    timestamptz
);

CREATE INDEX idx_po_pelanggan   ON purchase_order(pelanggan_id);
CREATE INDEX idx_po_status      ON purchase_order(status);
CREATE INDEX idx_po_batas_waktu ON purchase_order(batas_waktu);

CREATE TRIGGER set_purchase_order_updated_at
  BEFORE UPDATE ON purchase_order
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Tabel: purchase_order_item ───────────────────────────────
CREATE TABLE purchase_order_item (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id        uuid          NOT NULL REFERENCES purchase_order(id) ON DELETE CASCADE,
  deskripsi    text          NOT NULL,
  qty          numeric(10,2) NOT NULL DEFAULT 1,
  harga_satuan numeric(12,2) NOT NULL DEFAULT 0,
  subtotal     numeric(14,2) GENERATED ALWAYS AS (qty * harga_satuan) STORED,
  catatan      text,
  created_at   timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_po_item_po ON purchase_order_item(po_id);

-- ── Trigger: auto-update total_estimasi di header ────────────
CREATE OR REPLACE FUNCTION update_po_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchase_order
  SET total_estimasi = (
    SELECT COALESCE(SUM(subtotal), 0)
    FROM purchase_order_item
    WHERE po_id = COALESCE(NEW.po_id, OLD.po_id)
  )
  WHERE id = COALESCE(NEW.po_id, OLD.po_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_po_total_after_item
  AFTER INSERT OR UPDATE OR DELETE ON purchase_order_item
  FOR EACH ROW EXECUTE FUNCTION update_po_total();

-- ── Sequence: nomor PO otomatis ──────────────────────────────
-- Format: PO-YYYY-NNNN (misal PO-2026-0001)
CREATE SEQUENCE po_nomor_seq START 1;

CREATE OR REPLACE FUNCTION generate_no_po()
RETURNS text AS $$
  SELECT 'PO-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('po_nomor_seq')::text, 4, '0');
$$ LANGUAGE sql;

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE purchase_order      ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_item ENABLE ROW LEVEL SECURITY;

-- Admin: full access; Pegawai: read-only (tidak lihat yang dibatalkan)
CREATE POLICY "po_select" ON purchase_order FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND (
      get_user_role() = 'admin' OR
      (get_user_role() = 'pegawai' AND status != 'dibatalkan')
    )
  );

CREATE POLICY "po_insert" ON purchase_order FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "po_update" ON purchase_order FOR UPDATE TO authenticated
  USING  (get_user_role() = 'admin' AND deleted_at IS NULL)
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "po_item_select" ON purchase_order_item FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchase_order po
      WHERE po.id = po_id AND po.deleted_at IS NULL
    )
  );

CREATE POLICY "po_item_insert" ON purchase_order_item FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "po_item_update" ON purchase_order_item FOR UPDATE TO authenticated
  USING  (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "po_item_delete" ON purchase_order_item FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');
