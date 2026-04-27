-- ============================================================
-- MIGRATION 008: Audit Log
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id              bigserial     PRIMARY KEY,
  tabel           text          NOT NULL,
  record_id       uuid          NOT NULL,
  aksi            text          NOT NULL CHECK (aksi IN ('INSERT', 'UPDATE', 'DELETE')),
  dilakukan_oleh  uuid          REFERENCES profiles(id) ON DELETE SET NULL,
  dilakukan_pada  timestamptz   NOT NULL DEFAULT now(),
  data_lama       jsonb,
  data_baru       jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_log_record ON audit_log(tabel, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_waktu  ON audit_log(dilakukan_pada DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user   ON audit_log(dilakukan_oleh);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_admin_read" ON audit_log
  FOR SELECT USING (get_user_role() = 'admin');

-- ── Fungsi trigger audit ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_record_id uuid;
  v_old_data  jsonb;
  v_new_data  jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id;
    v_old_data  := to_jsonb(OLD);
    v_new_data  := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_record_id := NEW.id;
    v_old_data  := NULL;
    v_new_data  := to_jsonb(NEW);
  ELSE
    v_record_id := NEW.id;
    v_old_data  := to_jsonb(OLD);
    v_new_data  := to_jsonb(NEW);
  END IF;

  INSERT INTO audit_log(tabel, record_id, aksi, dilakukan_oleh, data_lama, data_baru)
  VALUES (TG_TABLE_NAME, v_record_id, TG_OP, auth.uid(), v_old_data, v_new_data);

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── Pasang trigger ke tabel transaksi & penggajian ───────────────────────────

DROP TRIGGER IF EXISTS audit_penjualan  ON penjualan;
DROP TRIGGER IF EXISTS audit_pembelian  ON pembelian;
DROP TRIGGER IF EXISTS audit_penggajian ON penggajian;

CREATE TRIGGER audit_penjualan
  AFTER INSERT OR UPDATE OR DELETE ON penjualan
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER audit_pembelian
  AFTER INSERT OR UPDATE OR DELETE ON pembelian
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER audit_penggajian
  AFTER INSERT OR UPDATE OR DELETE ON penggajian
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
