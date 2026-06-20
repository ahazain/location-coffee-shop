/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id_user" SERIAL NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "upload_dataset" (
    "id_upload" SERIAL NOT NULL,
    "nama_file" VARCHAR(200) NOT NULL,
    "jenis_upload" VARCHAR(50) NOT NULL,
    "jumlah_feature" INTEGER,
    "status" VARCHAR(50),
    "catatan" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_dataset_pkey" PRIMARY KEY ("id_upload")
);

-- CreateTable
CREATE TABLE "grid" (
    "id_grid" SERIAL NOT NULL,
    "kode_grid" VARCHAR(50) NOT NULL,
    "kecamatan" VARCHAR(100),
    "kelurahan" VARCHAR(100),
    "luas_grid" DECIMAL(15,6),
    "geom" geometry(Polygon,4326) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grid_pkey" PRIMARY KEY ("id_grid")
);

-- CreateTable
CREATE TABLE "kriteria" (
    "id_kriteria" SERIAL NOT NULL,
    "kode_kriteria" VARCHAR(50),
    "nama_kriteria" VARCHAR(100) NOT NULL,
    "deskripsi" TEXT,
    "urutan" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kriteria_pkey" PRIMARY KEY ("id_kriteria")
);

-- CreateTable
CREATE TABLE "indikator" (
    "id_indikator" SERIAL NOT NULL,
    "id_kriteria" INTEGER NOT NULL,
    "kode_indikator" VARCHAR(50),
    "nama_indikator" VARCHAR(150) NOT NULL,
    "satuan" VARCHAR(50),
    "jenis_indikator" VARCHAR(50),
    "tipe_nilai" VARCHAR(50),
    "sumber_data" TEXT,
    "metode_pengolahan" TEXT,
    "deskripsi" TEXT,
    "urutan" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indikator_pkey" PRIMARY KEY ("id_indikator")
);

-- CreateTable
CREATE TABLE "nilai_indikator" (
    "id_nilai" SERIAL NOT NULL,
    "id_upload" INTEGER,
    "id_grid" INTEGER NOT NULL,
    "id_indikator" INTEGER NOT NULL,
    "nilai_asli" DECIMAL(18,6) NOT NULL,
    "sumber_data" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nilai_indikator_pkey" PRIMARY KEY ("id_nilai")
);

-- CreateTable
CREATE TABLE "statistik_indikator" (
    "id_statistik" SERIAL NOT NULL,
    "id_indikator" INTEGER NOT NULL,
    "nilai_min" DECIMAL(18,6),
    "nilai_max" DECIMAL(18,6),
    "nilai_mean" DECIMAL(18,6),
    "nilai_median" DECIMAL(18,6),
    "nilai_std" DECIMAL(18,6),
    "jumlah_data" INTEGER,
    "tanggal_hitung" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "statistik_indikator_pkey" PRIMARY KEY ("id_statistik")
);

-- CreateTable
CREATE TABLE "aturan_fuzzy" (
    "id_aturan" SERIAL NOT NULL,
    "id_indikator" INTEGER NOT NULL,
    "fungsi_fuzzy" VARCHAR(50) NOT NULL,
    "arah" VARCHAR(20) NOT NULL,
    "nilai_min" DECIMAL(18,6),
    "nilai_max" DECIMAL(18,6),
    "midpoint" DECIMAL(18,6),
    "spread" DECIMAL(18,6),
    "nilai_a" DECIMAL(18,6),
    "nilai_b" DECIMAL(18,6),
    "nilai_c" DECIMAL(18,6),
    "nilai_d" DECIMAL(18,6),
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aturan_fuzzy_pkey" PRIMARY KEY ("id_aturan")
);

-- CreateTable
CREATE TABLE "nilai_fuzzy" (
    "id_fuzzy" SERIAL NOT NULL,
    "id_grid" INTEGER NOT NULL,
    "id_indikator" INTEGER NOT NULL,
    "nilai_fuzzy" DECIMAL(10,6) NOT NULL,
    "tanggal_hitung" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nilai_fuzzy_pkey" PRIMARY KEY ("id_fuzzy")
);

-- CreateTable
CREATE TABLE "ahp_kriteria_matrix" (
    "id_matrix" SERIAL NOT NULL,
    "id_kriteria_1" INTEGER NOT NULL,
    "id_kriteria_2" INTEGER NOT NULL,
    "nilai_perbandingan" DECIMAL(18,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ahp_kriteria_matrix_pkey" PRIMARY KEY ("id_matrix")
);

-- CreateTable
CREATE TABLE "bobot_kriteria" (
    "id_bobot_kriteria" SERIAL NOT NULL,
    "id_kriteria" INTEGER NOT NULL,
    "bobot_kriteria" DECIMAL(10,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bobot_kriteria_pkey" PRIMARY KEY ("id_bobot_kriteria")
);

-- CreateTable
CREATE TABLE "ahp_indikator_matrix" (
    "id_matrix" SERIAL NOT NULL,
    "id_kriteria" INTEGER NOT NULL,
    "id_indikator_1" INTEGER NOT NULL,
    "id_indikator_2" INTEGER NOT NULL,
    "nilai_perbandingan" DECIMAL(18,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ahp_indikator_matrix_pkey" PRIMARY KEY ("id_matrix")
);

-- CreateTable
CREATE TABLE "bobot_indikator" (
    "id_bobot_indikator" SERIAL NOT NULL,
    "id_indikator" INTEGER NOT NULL,
    "bobot_lokal" DECIMAL(10,6) NOT NULL,
    "bobot_akhir" DECIMAL(10,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bobot_indikator_pkey" PRIMARY KEY ("id_bobot_indikator")
);

-- CreateTable
CREATE TABLE "ahp_konsistensi" (
    "id_konsistensi" SERIAL NOT NULL,
    "tipe" VARCHAR(30) NOT NULL,
    "id_kriteria" INTEGER,
    "lambda_max" DECIMAL(18,6),
    "consistency_index" DECIMAL(18,6),
    "consistency_ratio" DECIMAL(18,6),
    "status_konsistensi" VARCHAR(30),
    "tanggal_hitung" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ahp_konsistensi_pkey" PRIMARY KEY ("id_konsistensi")
);

-- CreateTable
CREATE TABLE "constraint_grid" (
    "id_constraint" SERIAL NOT NULL,
    "id_grid" INTEGER NOT NULL,
    "nilai_constraint" INTEGER NOT NULL,
    "jenis_constraint" VARCHAR(100),
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "constraint_grid_pkey" PRIMARY KEY ("id_constraint")
);

-- CreateTable
CREATE TABLE "hasil_wlc" (
    "id_hasil" SERIAL NOT NULL,
    "id_grid" INTEGER NOT NULL,
    "skor_wlc" DECIMAL(10,6) NOT NULL,
    "kelas_kesesuaian" VARCHAR(50) NOT NULL,
    "tanggal_hitung" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hasil_wlc_pkey" PRIMARY KEY ("id_hasil")
);

-- CreateTable
CREATE TABLE "simulasi" (
    "id_simulasi" SERIAL NOT NULL,
    "nama_simulasi" VARCHAR(100),
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulasi_pkey" PRIMARY KEY ("id_simulasi")
);

-- CreateTable
CREATE TABLE "simulasi_bobot_indikator" (
    "id_simulasi_bobot" SERIAL NOT NULL,
    "id_simulasi" INTEGER NOT NULL,
    "id_indikator" INTEGER NOT NULL,
    "bobot_simulasi" DECIMAL(10,6) NOT NULL,

    CONSTRAINT "simulasi_bobot_indikator_pkey" PRIMARY KEY ("id_simulasi_bobot")
);

-- CreateTable
CREATE TABLE "hasil_wlc_simulasi" (
    "id_hasil_simulasi" SERIAL NOT NULL,
    "id_simulasi" INTEGER NOT NULL,
    "id_grid" INTEGER NOT NULL,
    "skor_wlc" DECIMAL(10,6) NOT NULL,
    "kelas_kesesuaian" VARCHAR(50) NOT NULL,
    "tanggal_hitung" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hasil_wlc_simulasi_pkey" PRIMARY KEY ("id_hasil_simulasi")
);

-- CreateTable
CREATE TABLE "coffee_shop_eksisting" (
    "id_coffee_shop" SERIAL NOT NULL,
    "nama" VARCHAR(150),
    "alamat" TEXT,
    "kecamatan" VARCHAR(100),
    "kelurahan" VARCHAR(100),
    "sumber_data" VARCHAR(100),
    "geom" geometry(Point,4326) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coffee_shop_eksisting_pkey" PRIMARY KEY ("id_coffee_shop")
);

-- CreateTable
CREATE TABLE "validasi_spasial" (
    "id_validasi" SERIAL NOT NULL,
    "id_grid" INTEGER NOT NULL,
    "kepadatan_kedai" DECIMAL(18,6),
    "nilai_constraint" INTEGER,
    "skor_wlc" DECIMAL(10,6),
    "kelas_kesesuaian" VARCHAR(50),
    "keterangan" TEXT,
    "tanggal_validasi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validasi_spasial_pkey" PRIMARY KEY ("id_validasi")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "grid_kode_grid_key" ON "grid"("kode_grid");

-- CreateIndex
CREATE UNIQUE INDEX "kriteria_kode_kriteria_key" ON "kriteria"("kode_kriteria");

-- CreateIndex
CREATE UNIQUE INDEX "indikator_kode_indikator_key" ON "indikator"("kode_indikator");

-- CreateIndex
CREATE INDEX "nilai_indikator_id_upload_idx" ON "nilai_indikator"("id_upload");

-- CreateIndex
CREATE INDEX "nilai_indikator_id_indikator_idx" ON "nilai_indikator"("id_indikator");

-- CreateIndex
CREATE UNIQUE INDEX "nilai_indikator_id_grid_id_indikator_key" ON "nilai_indikator"("id_grid", "id_indikator");

-- CreateIndex
CREATE UNIQUE INDEX "statistik_indikator_id_indikator_key" ON "statistik_indikator"("id_indikator");

-- CreateIndex
CREATE UNIQUE INDEX "aturan_fuzzy_id_indikator_key" ON "aturan_fuzzy"("id_indikator");

-- CreateIndex
CREATE INDEX "nilai_fuzzy_id_indikator_idx" ON "nilai_fuzzy"("id_indikator");

-- CreateIndex
CREATE UNIQUE INDEX "nilai_fuzzy_id_grid_id_indikator_key" ON "nilai_fuzzy"("id_grid", "id_indikator");

-- CreateIndex
CREATE INDEX "ahp_kriteria_matrix_id_kriteria_2_idx" ON "ahp_kriteria_matrix"("id_kriteria_2");

-- CreateIndex
CREATE UNIQUE INDEX "ahp_kriteria_matrix_id_kriteria_1_id_kriteria_2_key" ON "ahp_kriteria_matrix"("id_kriteria_1", "id_kriteria_2");

-- CreateIndex
CREATE UNIQUE INDEX "bobot_kriteria_id_kriteria_key" ON "bobot_kriteria"("id_kriteria");

-- CreateIndex
CREATE INDEX "ahp_indikator_matrix_id_indikator_1_idx" ON "ahp_indikator_matrix"("id_indikator_1");

-- CreateIndex
CREATE INDEX "ahp_indikator_matrix_id_indikator_2_idx" ON "ahp_indikator_matrix"("id_indikator_2");

-- CreateIndex
CREATE UNIQUE INDEX "ahp_indikator_matrix_id_kriteria_id_indikator_1_id_indikato_key" ON "ahp_indikator_matrix"("id_kriteria", "id_indikator_1", "id_indikator_2");

-- CreateIndex
CREATE UNIQUE INDEX "bobot_indikator_id_indikator_key" ON "bobot_indikator"("id_indikator");

-- CreateIndex
CREATE INDEX "ahp_konsistensi_id_kriteria_idx" ON "ahp_konsistensi"("id_kriteria");

-- CreateIndex
CREATE UNIQUE INDEX "constraint_grid_id_grid_key" ON "constraint_grid"("id_grid");

-- CreateIndex
CREATE UNIQUE INDEX "hasil_wlc_id_grid_key" ON "hasil_wlc"("id_grid");

-- CreateIndex
CREATE INDEX "simulasi_bobot_indikator_id_indikator_idx" ON "simulasi_bobot_indikator"("id_indikator");

-- CreateIndex
CREATE UNIQUE INDEX "simulasi_bobot_indikator_id_simulasi_id_indikator_key" ON "simulasi_bobot_indikator"("id_simulasi", "id_indikator");

-- CreateIndex
CREATE INDEX "hasil_wlc_simulasi_id_grid_idx" ON "hasil_wlc_simulasi"("id_grid");

-- CreateIndex
CREATE UNIQUE INDEX "hasil_wlc_simulasi_id_simulasi_id_grid_key" ON "hasil_wlc_simulasi"("id_simulasi", "id_grid");

-- CreateIndex
CREATE INDEX "validasi_spasial_id_grid_idx" ON "validasi_spasial"("id_grid");

-- AddForeignKey
ALTER TABLE "indikator" ADD CONSTRAINT "indikator_id_kriteria_fkey" FOREIGN KEY ("id_kriteria") REFERENCES "kriteria"("id_kriteria") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_indikator" ADD CONSTRAINT "nilai_indikator_id_upload_fkey" FOREIGN KEY ("id_upload") REFERENCES "upload_dataset"("id_upload") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_indikator" ADD CONSTRAINT "nilai_indikator_id_grid_fkey" FOREIGN KEY ("id_grid") REFERENCES "grid"("id_grid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_indikator" ADD CONSTRAINT "nilai_indikator_id_indikator_fkey" FOREIGN KEY ("id_indikator") REFERENCES "indikator"("id_indikator") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statistik_indikator" ADD CONSTRAINT "statistik_indikator_id_indikator_fkey" FOREIGN KEY ("id_indikator") REFERENCES "indikator"("id_indikator") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aturan_fuzzy" ADD CONSTRAINT "aturan_fuzzy_id_indikator_fkey" FOREIGN KEY ("id_indikator") REFERENCES "indikator"("id_indikator") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_fuzzy" ADD CONSTRAINT "nilai_fuzzy_id_grid_fkey" FOREIGN KEY ("id_grid") REFERENCES "grid"("id_grid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai_fuzzy" ADD CONSTRAINT "nilai_fuzzy_id_indikator_fkey" FOREIGN KEY ("id_indikator") REFERENCES "indikator"("id_indikator") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ahp_kriteria_matrix" ADD CONSTRAINT "ahp_kriteria_matrix_id_kriteria_1_fkey" FOREIGN KEY ("id_kriteria_1") REFERENCES "kriteria"("id_kriteria") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ahp_kriteria_matrix" ADD CONSTRAINT "ahp_kriteria_matrix_id_kriteria_2_fkey" FOREIGN KEY ("id_kriteria_2") REFERENCES "kriteria"("id_kriteria") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bobot_kriteria" ADD CONSTRAINT "bobot_kriteria_id_kriteria_fkey" FOREIGN KEY ("id_kriteria") REFERENCES "kriteria"("id_kriteria") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ahp_indikator_matrix" ADD CONSTRAINT "ahp_indikator_matrix_id_kriteria_fkey" FOREIGN KEY ("id_kriteria") REFERENCES "kriteria"("id_kriteria") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ahp_indikator_matrix" ADD CONSTRAINT "ahp_indikator_matrix_id_indikator_1_fkey" FOREIGN KEY ("id_indikator_1") REFERENCES "indikator"("id_indikator") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ahp_indikator_matrix" ADD CONSTRAINT "ahp_indikator_matrix_id_indikator_2_fkey" FOREIGN KEY ("id_indikator_2") REFERENCES "indikator"("id_indikator") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bobot_indikator" ADD CONSTRAINT "bobot_indikator_id_indikator_fkey" FOREIGN KEY ("id_indikator") REFERENCES "indikator"("id_indikator") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ahp_konsistensi" ADD CONSTRAINT "ahp_konsistensi_id_kriteria_fkey" FOREIGN KEY ("id_kriteria") REFERENCES "kriteria"("id_kriteria") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constraint_grid" ADD CONSTRAINT "constraint_grid_id_grid_fkey" FOREIGN KEY ("id_grid") REFERENCES "grid"("id_grid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hasil_wlc" ADD CONSTRAINT "hasil_wlc_id_grid_fkey" FOREIGN KEY ("id_grid") REFERENCES "grid"("id_grid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulasi_bobot_indikator" ADD CONSTRAINT "simulasi_bobot_indikator_id_simulasi_fkey" FOREIGN KEY ("id_simulasi") REFERENCES "simulasi"("id_simulasi") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulasi_bobot_indikator" ADD CONSTRAINT "simulasi_bobot_indikator_id_indikator_fkey" FOREIGN KEY ("id_indikator") REFERENCES "indikator"("id_indikator") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hasil_wlc_simulasi" ADD CONSTRAINT "hasil_wlc_simulasi_id_simulasi_fkey" FOREIGN KEY ("id_simulasi") REFERENCES "simulasi"("id_simulasi") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hasil_wlc_simulasi" ADD CONSTRAINT "hasil_wlc_simulasi_id_grid_fkey" FOREIGN KEY ("id_grid") REFERENCES "grid"("id_grid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validasi_spasial" ADD CONSTRAINT "validasi_spasial_id_grid_fkey" FOREIGN KEY ("id_grid") REFERENCES "grid"("id_grid") ON DELETE CASCADE ON UPDATE CASCADE;
