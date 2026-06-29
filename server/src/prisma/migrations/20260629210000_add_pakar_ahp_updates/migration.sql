-- ============================================================
-- Migration: add_pakar_ahp_updates
-- Menambahkan tabel pakar, relasi id_pakar ke tabel AHP,
-- constraint unique baru, dan kolom nilai_indikator di hasil_wlc
-- ============================================================

-- 1. Buat tabel pakar
CREATE TABLE "pakar" (
    "id_pakar"   SERIAL       NOT NULL,
    "nama_pakar" VARCHAR(100) NOT NULL,
    "institusi"  VARCHAR(100),
    "jabatan"    VARCHAR(100),
    "is_active"  BOOLEAN      NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pakar_pkey" PRIMARY KEY ("id_pakar")
);

-- 2. Tambah kolom id_pakar (nullable) ke ahp_kriteria_matrix
ALTER TABLE "ahp_kriteria_matrix" ADD COLUMN IF NOT EXISTS "id_pakar" INTEGER;

-- 3. Tambah kolom id_pakar (nullable) ke ahp_indikator_matrix
ALTER TABLE "ahp_indikator_matrix" ADD COLUMN IF NOT EXISTS "id_pakar" INTEGER;

-- 4. Tambah kolom id_pakar (nullable) ke bobot_kriteria
ALTER TABLE "bobot_kriteria" ADD COLUMN IF NOT EXISTS "id_pakar" INTEGER;

-- 5. Tambah kolom id_pakar (nullable) ke bobot_indikator
ALTER TABLE "bobot_indikator" ADD COLUMN IF NOT EXISTS "id_pakar" INTEGER;

-- 6. Tambah kolom id_pakar (nullable) ke ahp_konsistensi
ALTER TABLE "ahp_konsistensi" ADD COLUMN IF NOT EXISTS "id_pakar" INTEGER;

-- 7. Tambah kolom nilai_indikator (JSON) ke hasil_wlc jika belum ada
ALTER TABLE "hasil_wlc" ADD COLUMN IF NOT EXISTS "nilai_indikator" JSONB;

-- 8. Foreign key: ahp_kriteria_matrix -> pakar
ALTER TABLE "ahp_kriteria_matrix"
    ADD CONSTRAINT "ahp_kriteria_matrix_id_pakar_fkey"
    FOREIGN KEY ("id_pakar") REFERENCES "pakar"("id_pakar") ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. Foreign key: ahp_indikator_matrix -> pakar
ALTER TABLE "ahp_indikator_matrix"
    ADD CONSTRAINT "ahp_indikator_matrix_id_pakar_fkey"
    FOREIGN KEY ("id_pakar") REFERENCES "pakar"("id_pakar") ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. Foreign key: bobot_kriteria -> pakar
ALTER TABLE "bobot_kriteria"
    ADD CONSTRAINT "bobot_kriteria_id_pakar_fkey"
    FOREIGN KEY ("id_pakar") REFERENCES "pakar"("id_pakar") ON DELETE CASCADE ON UPDATE CASCADE;

-- 11. Foreign key: bobot_indikator -> pakar
ALTER TABLE "bobot_indikator"
    ADD CONSTRAINT "bobot_indikator_id_pakar_fkey"
    FOREIGN KEY ("id_pakar") REFERENCES "pakar"("id_pakar") ON DELETE CASCADE ON UPDATE CASCADE;

-- 12. Foreign key: ahp_konsistensi -> pakar
ALTER TABLE "ahp_konsistensi"
    ADD CONSTRAINT "ahp_konsistensi_id_pakar_fkey"
    FOREIGN KEY ("id_pakar") REFERENCES "pakar"("id_pakar") ON DELETE CASCADE ON UPDATE CASCADE;

-- 13. Hapus index unique lama (hanya id_kriteria / id_indikator tanpa id_pakar)
DROP INDEX IF EXISTS "bobot_kriteria_id_kriteria_key";
DROP INDEX IF EXISTS "bobot_indikator_id_indikator_key";
DROP INDEX IF EXISTS "ahp_kriteria_matrix_id_kriteria_1_id_kriteria_2_key";
-- Nama index di bawah mungkin terpotong oleh PostgreSQL (max 63 char)
DROP INDEX IF EXISTS "ahp_indikator_matrix_id_kriteria_id_indikator_1_id_indikator_2_key";
DROP INDEX IF EXISTS "ahp_indikator_matrix_id_kriteria_id_indikator_1_id_indikato_key";

-- 14. Unique constraints baru (termasuk id_pakar)
ALTER TABLE "ahp_kriteria_matrix"
    DROP CONSTRAINT IF EXISTS "ahp_kriteria_matrix_id_pakar_id_kriteria_1_id_kriteria_2_key";
ALTER TABLE "ahp_kriteria_matrix"
    ADD CONSTRAINT "ahp_kriteria_matrix_id_pakar_id_kriteria_1_id_kriteria_2_key"
    UNIQUE ("id_pakar", "id_kriteria_1", "id_kriteria_2");

ALTER TABLE "ahp_indikator_matrix"
    DROP CONSTRAINT IF EXISTS "ahp_indikator_matrix_id_pakar_id_kriteria_id_indikator_1_id_indikator_2_key";
ALTER TABLE "ahp_indikator_matrix"
    ADD CONSTRAINT "ahp_indikator_matrix_id_pakar_id_kriteria_id_indikator_1_id_indikator_2_key"
    UNIQUE ("id_pakar", "id_kriteria", "id_indikator_1", "id_indikator_2");

ALTER TABLE "bobot_kriteria"
    DROP CONSTRAINT IF EXISTS "bobot_kriteria_id_pakar_id_kriteria_key";
ALTER TABLE "bobot_kriteria"
    ADD CONSTRAINT "bobot_kriteria_id_pakar_id_kriteria_key"
    UNIQUE ("id_pakar", "id_kriteria");

ALTER TABLE "bobot_indikator"
    DROP CONSTRAINT IF EXISTS "bobot_indikator_id_pakar_id_indikator_key";
ALTER TABLE "bobot_indikator"
    ADD CONSTRAINT "bobot_indikator_id_pakar_id_indikator_key"
    UNIQUE ("id_pakar", "id_indikator");

-- 14. Index baru untuk pakar
CREATE INDEX IF NOT EXISTS "ahp_kriteria_matrix_id_pakar_idx" ON "ahp_kriteria_matrix"("id_pakar");
CREATE INDEX IF NOT EXISTS "ahp_indikator_matrix_id_pakar_idx" ON "ahp_indikator_matrix"("id_pakar");
CREATE INDEX IF NOT EXISTS "bobot_kriteria_id_pakar_idx" ON "bobot_kriteria"("id_pakar");
CREATE INDEX IF NOT EXISTS "bobot_indikator_id_pakar_idx" ON "bobot_indikator"("id_pakar");
CREATE INDEX IF NOT EXISTS "ahp_konsistensi_id_pakar_idx" ON "ahp_konsistensi"("id_pakar");
