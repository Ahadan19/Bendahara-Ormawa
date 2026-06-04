-- ============================================================
-- SISTEM KEUANGAN ORMAWA — Initial Database Schema
-- Platform: Supabase (PostgreSQL 15+)
-- Migration: 00001_initial_schema
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ────────────────────────────────────────────────────────────

-- UUID generation (sudah aktif di Supabase secara default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- 2. ENUM TYPES
-- ────────────────────────────────────────────────────────────

-- Tipe transaksi keuangan
CREATE TYPE tipe_transaksi AS ENUM ('pemasukan', 'pengeluaran');

-- Status langganan ormawa
CREATE TYPE status_langganan_enum AS ENUM ('aktif', 'trial', 'nonaktif', 'kadaluarsa');

-- ────────────────────────────────────────────────────────────
-- 3. HELPER: Trigger function untuk auto-update updated_at
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABEL UTAMA
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 4. TABEL: ormawa
--    Pusat data tiap organisasi kemahasiswaan (tenant)
-- ────────────────────────────────────────────────────────────

CREATE TABLE ormawa (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_ormawa                 TEXT NOT NULL,
  email                       TEXT NOT NULL UNIQUE,
  status_langganan            status_langganan_enum NOT NULL DEFAULT 'trial',
  tanggal_berakhir_langganan  TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE TRIGGER set_ormawa_updated_at
  BEFORE UPDATE ON ormawa
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Index untuk pencarian nama ormawa
CREATE INDEX idx_ormawa_nama ON ormawa (nama_ormawa);

COMMENT ON TABLE ormawa IS 'Data organisasi kemahasiswaan — setiap baris adalah satu tenant';
COMMENT ON COLUMN ormawa.status_langganan IS 'Status berlangganan platform: aktif, trial, nonaktif, kadaluarsa';

-- ────────────────────────────────────────────────────────────
-- 5. TABEL: anggota
--    Data mahasiswa yang terdaftar di tiap ormawa
-- ────────────────────────────────────────────────────────────

CREATE TABLE anggota (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ormawa_id        UUID NOT NULL REFERENCES ormawa(id) ON DELETE CASCADE,
  nim              TEXT NOT NULL,
  nama_lengkap     TEXT NOT NULL,
  kelas_angkatan   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- NIM harus unik per ormawa (mahasiswa bisa di >1 ormawa)
  CONSTRAINT uq_anggota_nim_per_ormawa UNIQUE (ormawa_id, nim)
);

-- Auto-update updated_at
CREATE TRIGGER set_anggota_updated_at
  BEFORE UPDATE ON anggota
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Indexes untuk query yang sering digunakan
CREATE INDEX idx_anggota_ormawa ON anggota (ormawa_id);
CREATE INDEX idx_anggota_nim ON anggota (nim);

COMMENT ON TABLE anggota IS 'Data mahasiswa per ormawa — NIM unik dalam satu organisasi';
COMMENT ON COLUMN anggota.nim IS 'Nomor Induk Mahasiswa, digunakan untuk tracking tunggakan';
COMMENT ON COLUMN anggota.kelas_angkatan IS 'Contoh: TI-2A / Angkatan 2023';

-- ────────────────────────────────────────────────────────────
-- 6. TABEL: transaksi
--    Pencatatan pemasukan & pengeluaran keuangan ormawa
-- ────────────────────────────────────────────────────────────

CREATE TABLE transaksi (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ormawa_id           UUID NOT NULL REFERENCES ormawa(id) ON DELETE CASCADE,
  tipe                tipe_transaksi NOT NULL,
  nominal             NUMERIC(15, 2) NOT NULL CHECK (nominal > 0),
  keterangan          TEXT,
  kategori            TEXT NOT NULL,
  tanggal_transaksi   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bukti_nota_url      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE TRIGGER set_transaksi_updated_at
  BEFORE UPDATE ON transaksi
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Indexes untuk query laporan keuangan
CREATE INDEX idx_transaksi_ormawa ON transaksi (ormawa_id);
CREATE INDEX idx_transaksi_tipe ON transaksi (ormawa_id, tipe);
CREATE INDEX idx_transaksi_tanggal ON transaksi (ormawa_id, tanggal_transaksi DESC);
CREATE INDEX idx_transaksi_kategori ON transaksi (ormawa_id, kategori);

COMMENT ON TABLE transaksi IS 'Catatan keuangan ormawa — pemasukan dan pengeluaran';
COMMENT ON COLUMN transaksi.nominal IS 'Jumlah uang, harus positif (tipe menentukan arah)';
COMMENT ON COLUMN transaksi.kategori IS 'Contoh: Kas Bulanan, Konsumsi, Atribut, Dana Sponsor';
COMMENT ON COLUMN transaksi.bukti_nota_url IS 'URL file bukti nota di Supabase Storage (opsional)';

-- ────────────────────────────────────────────────────────────
-- 7. TABEL: tagihan_iuran
--    Kewajiban pembayaran yang dibuat oleh bendahara
-- ────────────────────────────────────────────────────────────

CREATE TABLE tagihan_iuran (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ormawa_id         UUID NOT NULL REFERENCES ormawa(id) ON DELETE CASCADE,
  nama_iuran        TEXT NOT NULL,
  nominal_tagihan   NUMERIC(15, 2) NOT NULL CHECK (nominal_tagihan > 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE TRIGGER set_tagihan_updated_at
  BEFORE UPDATE ON tagihan_iuran
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Index
CREATE INDEX idx_tagihan_ormawa ON tagihan_iuran (ormawa_id);

COMMENT ON TABLE tagihan_iuran IS 'Daftar tagihan iuran yang dibuat bendahara untuk anggota';
COMMENT ON COLUMN tagihan_iuran.nama_iuran IS 'Contoh: Kas Semester Ganjil, Iuran Makrab, Dana KKN';

-- ────────────────────────────────────────────────────────────
-- 8. TABEL: status_pembayaran_anggota
--    Pivot table: menghubungkan anggota ↔ tagihan
--    Digunakan untuk melihat siapa yang sudah/belum bayar
-- ────────────────────────────────────────────────────────────

CREATE TABLE status_pembayaran_anggota (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anggota_id    UUID NOT NULL REFERENCES anggota(id) ON DELETE CASCADE,
  tagihan_id    UUID NOT NULL REFERENCES tagihan_iuran(id) ON DELETE CASCADE,
  lunas         BOOLEAN NOT NULL DEFAULT FALSE,
  tanggal_bayar TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Satu anggota hanya punya satu record per tagihan
  CONSTRAINT uq_pembayaran_anggota_tagihan UNIQUE (anggota_id, tagihan_id)
);

-- Auto-update updated_at
CREATE TRIGGER set_pembayaran_updated_at
  BEFORE UPDATE ON status_pembayaran_anggota
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Indexes untuk query tunggakan
CREATE INDEX idx_pembayaran_anggota ON status_pembayaran_anggota (anggota_id);
CREATE INDEX idx_pembayaran_tagihan ON status_pembayaran_anggota (tagihan_id);
CREATE INDEX idx_pembayaran_lunas ON status_pembayaran_anggota (tagihan_id, lunas);

COMMENT ON TABLE status_pembayaran_anggota IS 'Status bayar per anggota per tagihan — untuk tracking tunggakan';

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Memastikan data tidak bocor antar-ormawa (multi-tenant)
-- ============================================================

-- Aktifkan RLS di semua tabel
ALTER TABLE ormawa ENABLE ROW LEVEL SECURITY;
ALTER TABLE anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE tagihan_iuran ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_pembayaran_anggota ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- RLS POLICIES
-- Catatan: Policy ini menggunakan Supabase auth.uid() dan
-- mengasumsikan ada mapping user → ormawa (akan dikembangkan
-- saat fitur auth diimplementasi). Untuk saat ini, policy
-- dasar disiapkan sebagai kerangka.
-- ────────────────────────────────────────────────────────────

-- Policy: Ormawa — user hanya bisa akses ormawa mereka sendiri
-- (Akan di-update setelah tabel user_ormawa dibuat)
CREATE POLICY "ormawa_select_own"
  ON ormawa FOR SELECT
  USING (true);  -- TODO: restrict setelah auth siap

CREATE POLICY "ormawa_insert_own"
  ON ormawa FOR INSERT
  WITH CHECK (true);  -- TODO: restrict setelah auth siap

CREATE POLICY "ormawa_update_own"
  ON ormawa FOR UPDATE
  USING (true);  -- TODO: restrict setelah auth siap

-- Policy: Anggota — hanya bisa diakses sesuai ormawa_id user
CREATE POLICY "anggota_tenant_isolation"
  ON anggota FOR ALL
  USING (true)   -- TODO: USING (ormawa_id IN (SELECT ormawa_id FROM user_ormawa WHERE user_id = auth.uid()))
  WITH CHECK (true);

-- Policy: Transaksi — isolasi per tenant
CREATE POLICY "transaksi_tenant_isolation"
  ON transaksi FOR ALL
  USING (true)   -- TODO: restrict setelah auth siap
  WITH CHECK (true);

-- Policy: Tagihan — isolasi per tenant
CREATE POLICY "tagihan_tenant_isolation"
  ON tagihan_iuran FOR ALL
  USING (true)   -- TODO: restrict setelah auth siap
  WITH CHECK (true);

-- Policy: Status Pembayaran — isolasi via join ke anggota → ormawa
CREATE POLICY "pembayaran_tenant_isolation"
  ON status_pembayaran_anggota FOR ALL
  USING (true)   -- TODO: restrict via anggota.ormawa_id setelah auth siap
  WITH CHECK (true);

-- ============================================================
-- VIEWS (Opsional — helper untuk query umum)
-- ============================================================

-- View: Ringkasan tunggakan per anggota
CREATE OR REPLACE VIEW v_tunggakan_anggota AS
SELECT
  a.id AS anggota_id,
  a.ormawa_id,
  a.nim,
  a.nama_lengkap,
  a.kelas_angkatan,
  t.id AS tagihan_id,
  t.nama_iuran,
  t.nominal_tagihan,
  COALESCE(sp.lunas, FALSE) AS lunas,
  sp.tanggal_bayar
FROM anggota a
CROSS JOIN tagihan_iuran t
LEFT JOIN status_pembayaran_anggota sp
  ON sp.anggota_id = a.id AND sp.tagihan_id = t.id
WHERE a.ormawa_id = t.ormawa_id;

COMMENT ON VIEW v_tunggakan_anggota IS 'Menampilkan status pembayaran semua anggota untuk semua tagihan di ormawa mereka';

-- View: Ringkasan saldo per ormawa
CREATE OR REPLACE VIEW v_saldo_ormawa AS
SELECT
  ormawa_id,
  COALESCE(SUM(CASE WHEN tipe = 'pemasukan' THEN nominal ELSE 0 END), 0) AS total_pemasukan,
  COALESCE(SUM(CASE WHEN tipe = 'pengeluaran' THEN nominal ELSE 0 END), 0) AS total_pengeluaran,
  COALESCE(SUM(CASE WHEN tipe = 'pemasukan' THEN nominal ELSE -nominal END), 0) AS saldo
FROM transaksi
GROUP BY ormawa_id;

COMMENT ON VIEW v_saldo_ormawa IS 'Ringkasan total pemasukan, pengeluaran, dan saldo per ormawa';

-- ============================================================
-- SELESAI
-- ============================================================
