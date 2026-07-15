/*
  Warnings:

  - You are about to drop the column `keterangan` on the `aturan_fuzzy` table. All the data in the column will be lost.
  - You are about to drop the column `nilai_a` on the `aturan_fuzzy` table. All the data in the column will be lost.
  - You are about to drop the column `nilai_b` on the `aturan_fuzzy` table. All the data in the column will be lost.
  - You are about to drop the column `nilai_c` on the `aturan_fuzzy` table. All the data in the column will be lost.
  - You are about to drop the column `nilai_d` on the `aturan_fuzzy` table. All the data in the column will be lost.
  - You are about to drop the column `osm_id` on the `existing_coffee_shop` table. All the data in the column will be lost.
  - You are about to drop the column `luas_grid` on the `grid` table. All the data in the column will be lost.
  - You are about to drop the column `id_analysis_run` on the `hasil_wlc` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `indikator` table. All the data in the column will be lost.
  - You are about to drop the column `jenis_indikator` on the `indikator` table. All the data in the column will be lost.
  - You are about to drop the column `kode_indikator` on the `indikator` table. All the data in the column will be lost.
  - You are about to drop the column `metode_pengolahan` on the `indikator` table. All the data in the column will be lost.
  - You are about to drop the column `sumber_data` on the `indikator` table. All the data in the column will be lost.
  - You are about to drop the column `urutan` on the `indikator` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `kriteria` table. All the data in the column will be lost.
  - You are about to drop the column `kode_kriteria` on the `kriteria` table. All the data in the column will be lost.
  - You are about to drop the column `urutan` on the `kriteria` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `pakar` table. All the data in the column will be lost.
  - You are about to drop the column `band_count` on the `raster_layers` table. All the data in the column will be lost.
  - You are about to drop the column `extent` on the `raster_layers` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `raster_layers` table. All the data in the column will be lost.
  - You are about to drop the column `id_analysis_run` on the `raster_layers` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `raster_layers` table. All the data in the column will be lost.
  - You are about to drop the column `jumlah_pixel` on the `raster_layers` table. All the data in the column will be lost.
  - You are about to drop the column `jumlah_pixel_nodata` on the `raster_layers` table. All the data in the column will be lost.
  - You are about to drop the column `jumlah_pixel_valid` on the `raster_layers` table. All the data in the column will be lost.
  - You are about to drop the column `original_filename` on the `raster_layers` table. All the data in the column will be lost.
  - You are about to drop the column `resolution_x` on the `raster_layers` table. All the data in the column will be lost.
  - You are about to drop the column `resolution_y` on the `raster_layers` table. All the data in the column will be lost.
  - You are about to drop the column `std_value` on the `raster_layers` table. All the data in the column will be lost.
  - You are about to drop the column `versi` on the `raster_layers` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `raster_layers` table. All the data in the column will be lost.
  - You are about to drop the `analysis_run` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `simulasi` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `simulasi_bobot_indikator` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[id_grid]` on the table `hasil_wlc` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kode_layer]` on the table `raster_layers` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `tipe` on the `ahp_konsistensi` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `status_konsistensi` to the `ahp_konsistensi` table without a default value. This is not possible if the table is not empty.
  - Made the column `id_pakar` on table `ahp_konsistensi` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `fungsi_fuzzy` on the `aturan_fuzzy` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `arah` on the `aturan_fuzzy` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `id_pakar` on table `bobot_indikator` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_pakar` on table `bobot_kriteria` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `kelas_kesesuaian` on the `hasil_wlc` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `tipe_nilai` to the `indikator` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kode_layer` to the `raster_layers` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `tipe_raster` on the `raster_layers` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TipeRaster" AS ENUM ('raw', 'fuzzy', 'final_score');

-- CreateEnum
CREATE TYPE "FungsiFuzzy" AS ENUM ('linear', 'near');

-- CreateEnum
CREATE TYPE "ArahFuzzy" AS ENUM ('increasing', 'decreasing', 'near');

-- CreateEnum
CREATE TYPE "TipeNilaiIndikator" AS ENUM ('kepadatan', 'jarak', 'mask');

-- CreateEnum
CREATE TYPE "TipeKonsistensiAhp" AS ENUM ('kriteria', 'indikator');

-- CreateEnum
CREATE TYPE "KelasKesesuaian" AS ENUM ('kurang_sesuai', 'cukup_sesuai', 'sesuai');

-- CreateEnum
CREATE TYPE "StatusKonsistensiAhp" AS ENUM ('konsisten', 'tidak_konsisten');

-- DropForeignKey
ALTER TABLE "analysis_run" DROP CONSTRAINT "analysis_run_id_simulasi_fkey";

-- DropForeignKey
ALTER TABLE "hasil_wlc" DROP CONSTRAINT "hasil_wlc_id_analysis_run_fkey";

-- DropForeignKey
ALTER TABLE "raster_layers" DROP CONSTRAINT "raster_layers_id_analysis_run_fkey";

-- DropForeignKey
ALTER TABLE "simulasi_bobot_indikator" DROP CONSTRAINT "simulasi_bobot_indikator_id_indikator_fkey";

-- DropForeignKey
ALTER TABLE "simulasi_bobot_indikator" DROP CONSTRAINT "simulasi_bobot_indikator_id_simulasi_fkey";

-- DropIndex
DROP INDEX "hasil_wlc_id_analysis_run_id_grid_key";

-- DropIndex
DROP INDEX "hasil_wlc_id_grid_idx";

-- DropIndex
DROP INDEX "indikator_kode_indikator_key";

-- DropIndex
DROP INDEX "kriteria_kode_kriteria_key";

-- DropIndex
DROP INDEX "raster_layers_id_analysis_run_idx";

-- DropIndex
DROP INDEX "raster_layers_id_indikator_tipe_raster_versi_key";

-- DropIndex
DROP INDEX "raster_layers_is_active_idx";

-- AlterTable
ALTER TABLE "ahp_konsistensi" DROP COLUMN "tipe",
ADD COLUMN     "tipe" "TipeKonsistensiAhp" NOT NULL,
DROP COLUMN "status_konsistensi",
ADD COLUMN     "status_konsistensi" "StatusKonsistensiAhp" NOT NULL,
ALTER COLUMN "id_pakar" SET NOT NULL;

-- AlterTable
ALTER TABLE "aturan_fuzzy" DROP COLUMN "keterangan",
DROP COLUMN "nilai_a",
DROP COLUMN "nilai_b",
DROP COLUMN "nilai_c",
DROP COLUMN "nilai_d",
DROP COLUMN "fungsi_fuzzy",
ADD COLUMN     "fungsi_fuzzy" "FungsiFuzzy" NOT NULL,
DROP COLUMN "arah",
ADD COLUMN     "arah" "ArahFuzzy" NOT NULL;

-- AlterTable
ALTER TABLE "bobot_indikator" ALTER COLUMN "id_pakar" SET NOT NULL;

-- AlterTable
ALTER TABLE "bobot_kriteria" ALTER COLUMN "id_pakar" SET NOT NULL;

-- AlterTable
ALTER TABLE "existing_coffee_shop" DROP COLUMN "osm_id";

-- AlterTable
ALTER TABLE "grid" DROP COLUMN "luas_grid";

-- AlterTable
ALTER TABLE "hasil_wlc" DROP COLUMN "id_analysis_run",
DROP COLUMN "kelas_kesesuaian",
ADD COLUMN     "kelas_kesesuaian" "KelasKesesuaian" NOT NULL;

-- AlterTable
ALTER TABLE "indikator" DROP COLUMN "is_active",
DROP COLUMN "jenis_indikator",
DROP COLUMN "kode_indikator",
DROP COLUMN "metode_pengolahan",
DROP COLUMN "sumber_data",
DROP COLUMN "urutan",
DROP COLUMN "tipe_nilai",
ADD COLUMN     "tipe_nilai" "TipeNilaiIndikator" NOT NULL;

-- AlterTable
ALTER TABLE "kriteria" DROP COLUMN "is_active",
DROP COLUMN "kode_kriteria",
DROP COLUMN "urutan";

-- AlterTable
ALTER TABLE "pakar" DROP COLUMN "is_active";

-- AlterTable
ALTER TABLE "raster_layers" DROP COLUMN "band_count",
DROP COLUMN "extent",
DROP COLUMN "height",
DROP COLUMN "id_analysis_run",
DROP COLUMN "is_active",
DROP COLUMN "jumlah_pixel",
DROP COLUMN "jumlah_pixel_nodata",
DROP COLUMN "jumlah_pixel_valid",
DROP COLUMN "original_filename",
DROP COLUMN "resolution_x",
DROP COLUMN "resolution_y",
DROP COLUMN "std_value",
DROP COLUMN "versi",
DROP COLUMN "width",
ADD COLUMN     "kode_layer" VARCHAR(100) NOT NULL,
DROP COLUMN "tipe_raster",
ADD COLUMN     "tipe_raster" "TipeRaster" NOT NULL;

-- DropTable
DROP TABLE "analysis_run";

-- DropTable
DROP TABLE "simulasi";

-- DropTable
DROP TABLE "simulasi_bobot_indikator";

-- CreateIndex
CREATE INDEX "ahp_indikator_matrix_id_kriteria_idx" ON "ahp_indikator_matrix"("id_kriteria");

-- CreateIndex
CREATE INDEX "ahp_konsistensi_tipe_idx" ON "ahp_konsistensi"("tipe");

-- CreateIndex
CREATE INDEX "ahp_kriteria_matrix_id_kriteria_1_idx" ON "ahp_kriteria_matrix"("id_kriteria_1");

-- CreateIndex
CREATE UNIQUE INDEX "hasil_wlc_id_grid_key" ON "hasil_wlc"("id_grid");

-- CreateIndex
CREATE INDEX "hasil_wlc_ranking_idx" ON "hasil_wlc"("ranking");

-- CreateIndex
CREATE UNIQUE INDEX "raster_layers_kode_layer_key" ON "raster_layers"("kode_layer");

-- CreateIndex
CREATE INDEX "raster_layers_tipe_raster_idx" ON "raster_layers"("tipe_raster");
