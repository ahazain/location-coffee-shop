/*
  Warnings:

  - Made the column `id_pakar` on table `ahp_indikator_matrix` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_pakar` on table `ahp_kriteria_matrix` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ahp_indikator_matrix" ALTER COLUMN "id_pakar" SET NOT NULL;

-- AlterTable
ALTER TABLE "ahp_kriteria_matrix" ALTER COLUMN "id_pakar" SET NOT NULL;

-- AlterTable
ALTER TABLE "pakar" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "existing_coffee_shop" (
    "id_shop" SERIAL NOT NULL,
    "osm_id" VARCHAR(50),
    "nama" VARCHAR(150),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "geom" geometry(Point,32749) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "existing_coffee_shop_pkey" PRIMARY KEY ("id_shop")
);

-- CreateIndex
CREATE INDEX "bobot_indikator_id_indikator_idx" ON "bobot_indikator"("id_indikator");

-- CreateIndex
CREATE INDEX "bobot_kriteria_id_kriteria_idx" ON "bobot_kriteria"("id_kriteria");

-- RenameIndex
ALTER INDEX "ahp_indikator_matrix_id_pakar_id_kriteria_id_indikator_1_id_ind" RENAME TO "ahp_indikator_matrix_id_pakar_id_kriteria_id_indikator_1_id_key";
