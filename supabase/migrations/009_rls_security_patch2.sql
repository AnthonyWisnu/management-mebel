-- ============================================================
-- MIGRATION 009: RLS Security Patch #2
-- ============================================================
-- Perbaikan 2 celah keamanan:
--   1. penggajian: SELECT/INSERT/UPDATE dibatasi hanya untuk admin
--   2. absensi: INSERT/UPDATE dibatasi hanya untuk admin

-- ── penggajian: batasi semua operasi ke admin ─────────────────

DROP POLICY IF EXISTS "penggajian_select"  ON penggajian;
DROP POLICY IF EXISTS "penggajian_insert"  ON penggajian;
DROP POLICY IF EXISTS "penggajian_update"  ON penggajian;

CREATE POLICY "penggajian_select"
  ON penggajian FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "penggajian_insert"
  ON penggajian FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "penggajian_update"
  ON penggajian FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ── absensi: INSERT dan UPDATE hanya admin ────────────────────

DROP POLICY IF EXISTS "absensi_insert" ON absensi;
DROP POLICY IF EXISTS "absensi_update" ON absensi;

CREATE POLICY "absensi_insert"
  ON absensi FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "absensi_update"
  ON absensi FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL AND get_user_role() = 'admin')
  WITH CHECK (deleted_at IS NULL OR get_user_role() = 'admin');
