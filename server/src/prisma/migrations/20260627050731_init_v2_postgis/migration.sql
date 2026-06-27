-- Enable PostGIS extension (required for geometry type)
CREATE EXTENSION IF NOT EXISTS postgis;

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
CREATE TABLE "grid" (
    "id_grid" SERIAL NOT NULL,
    "kode_grid" VARCHAR(50) NOT NULL,
    "kecamatan" VARCHAR(100),
    "kelurahan" VARCHAR(100),
    "luas_grid" DECIMAL(15,6),
    "geom" geometry(Polygon,32749) NOT NULL,
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
CREATE TABLE "raster_layers" (
    "id_raster_layer" SERIAL NOT NULL,
    "id_indikator" INTEGER,
    "id_analysis_run" INTEGER,
    "tipe_raster" VARCHAR(30) NOT NULL,
    "file_path" TEXT NOT NULL,
    "original_filename" TEXT,
    "crs" VARCHAR(50),
    "resolution_x" DOUBLE PRECISION,
    "resolution_y" DOUBLE PRECISION,
    "width" INTEGER,
    "height" INTEGER,
    "band_count" INTEGER,
    "extent" JSONB,
    "min_value" DOUBLE PRECISION,
    "max_value" DOUBLE PRECISION,
    "mean_value" DOUBLE PRECISION,
    "std_value" DOUBLE PRECISION,
    "nodata_value" DOUBLE PRECISION,
    "jumlah_pixel" INTEGER,
    "jumlah_pixel_valid" INTEGER,
    "jumlah_pixel_nodata" INTEGER,
    "versi" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raster_layers_pkey" PRIMARY KEY ("id_raster_layer")
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
CREATE TABLE "analysis_run" (
    "id_analysis_run" SERIAL NOT NULL,
    "tipe_run" VARCHAR(30) NOT NULL DEFAULT 'default',
    "id_simulasi" INTEGER,
    "nama_run" VARCHAR(150),
    "status" VARCHAR(30) NOT NULL DEFAULT 'success',
    "keterangan" TEXT,
    "versi" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_run_pkey" PRIMARY KEY ("id_analysis_run")
);

-- CreateTable
CREATE TABLE "hasil_wlc" (
    "id_hasil" SERIAL NOT NULL,
    "id_analysis_run" INTEGER NOT NULL,
    "id_grid" INTEGER NOT NULL,
    "skor_wlc" DECIMAL(10,6) NOT NULL,
    "kelas_kesesuaian" VARCHAR(50) NOT NULL,
    "ranking" INTEGER,
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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "grid_kode_grid_key" ON "grid"("kode_grid");

-- CreateIndex
CREATE UNIQUE INDEX "kriteria_kode_kriteria_key" ON "kriteria"("kode_kriteria");

-- CreateIndex
CREATE UNIQUE INDEX "indikator_kode_indikator_key" ON "indikator"("kode_indikator");

-- CreateIndex
CREATE INDEX "indikator_id_kriteria_idx" ON "indikator"("id_kriteria");

-- CreateIndex
CREATE INDEX "raster_layers_id_indikator_idx" ON "raster_layers"("id_indikator");

-- CreateIndex
CREATE INDEX "raster_layers_id_analysis_run_idx" ON "raster_layers"("id_analysis_run");

-- CreateIndex
CREATE INDEX "raster_layers_tipe_raster_idx" ON "raster_layers"("tipe_raster");

-- CreateIndex
CREATE INDEX "raster_layers_is_active_idx" ON "raster_layers"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "raster_layers_id_indikator_tipe_raster_versi_key" ON "raster_layers"("id_indikator", "tipe_raster", "versi");

-- CreateIndex
CREATE UNIQUE INDEX "aturan_fuzzy_id_indikator_key" ON "aturan_fuzzy"("id_indikator");

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
CREATE INDEX "analysis_run_id_simulasi_idx" ON "analysis_run"("id_simulasi");

-- CreateIndex
CREATE INDEX "analysis_run_tipe_run_idx" ON "analysis_run"("tipe_run");

-- CreateIndex
CREATE INDEX "analysis_run_is_active_idx" ON "analysis_run"("is_active");

-- CreateIndex
CREATE INDEX "hasil_wlc_id_grid_idx" ON "hasil_wlc"("id_grid");

-- CreateIndex
CREATE INDEX "hasil_wlc_skor_wlc_idx" ON "hasil_wlc"("skor_wlc");

-- CreateIndex
CREATE UNIQUE INDEX "hasil_wlc_id_analysis_run_id_grid_key" ON "hasil_wlc"("id_analysis_run", "id_grid");

-- CreateIndex
CREATE INDEX "simulasi_bobot_indikator_id_indikator_idx" ON "simulasi_bobot_indikator"("id_indikator");

-- CreateIndex
CREATE UNIQUE INDEX "simulasi_bobot_indikator_id_simulasi_id_indikator_key" ON "simulasi_bobot_indikator"("id_simulasi", "id_indikator");

-- AddForeignKey
ALTER TABLE "indikator" ADD CONSTRAINT "indikator_id_kriteria_fkey" FOREIGN KEY ("id_kriteria") REFERENCES "kriteria"("id_kriteria") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raster_layers" ADD CONSTRAINT "raster_layers_id_indikator_fkey" FOREIGN KEY ("id_indikator") REFERENCES "indikator"("id_indikator") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raster_layers" ADD CONSTRAINT "raster_layers_id_analysis_run_fkey" FOREIGN KEY ("id_analysis_run") REFERENCES "analysis_run"("id_analysis_run") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aturan_fuzzy" ADD CONSTRAINT "aturan_fuzzy_id_indikator_fkey" FOREIGN KEY ("id_indikator") REFERENCES "indikator"("id_indikator") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "analysis_run" ADD CONSTRAINT "analysis_run_id_simulasi_fkey" FOREIGN KEY ("id_simulasi") REFERENCES "simulasi"("id_simulasi") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hasil_wlc" ADD CONSTRAINT "hasil_wlc_id_analysis_run_fkey" FOREIGN KEY ("id_analysis_run") REFERENCES "analysis_run"("id_analysis_run") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hasil_wlc" ADD CONSTRAINT "hasil_wlc_id_grid_fkey" FOREIGN KEY ("id_grid") REFERENCES "grid"("id_grid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulasi_bobot_indikator" ADD CONSTRAINT "simulasi_bobot_indikator_id_simulasi_fkey" FOREIGN KEY ("id_simulasi") REFERENCES "simulasi"("id_simulasi") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulasi_bobot_indikator" ADD CONSTRAINT "simulasi_bobot_indikator_id_indikator_fkey" FOREIGN KEY ("id_indikator") REFERENCES "indikator"("id_indikator") ON DELETE CASCADE ON UPDATE CASCADE;
