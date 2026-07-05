const prisma = require("./src/prisma/prisma-client");
const GeotiffHelper = require("./src/helpers/geotiff-helper");
const path = require("path");
const fs = require("fs");

async function main() {
  const activeIndicators = await prisma.indikator.findMany();
  const rawRastersData = [];

  for (const ind of activeIndicators) {
    const rawRaster = await prisma.rasterLayer.findFirst({
      where: { id_indikator: ind.id_indikator, tipe_raster: "raw" }
    });
    if (rawRaster) {
      const rawAbsPath = path.join(process.cwd(), rawRaster.file_path);
      const rawPixels = await GeotiffHelper.readPixelsForFuzzy(rawAbsPath);
      const rawMetadata = await GeotiffHelper.readMetadataOnly(rawAbsPath);
      rawRastersData.push({
        id_indikator: ind.id_indikator,
        nama: ind.nama_indikator,
        pixelValues: rawPixels.pixelValues,
        width: rawPixels.width,
        height: rawPixels.height,
        noDataValue: rawPixels.noDataValue,
        min_x: Number(rawMetadata.extent.min_x),
        max_y: Number(rawMetadata.extent.max_y),
        res_x: Number(rawMetadata.resolution_x),
        res_y: Number(rawMetadata.resolution_y),
      });
    }
  }

  const refRaster = rawRastersData[0];
  const refWidth = refRaster.width;
  const refHeight = refRaster.height;
  const refMinX = refRaster.min_x;
  const refMaxY = refRaster.max_y;
  const refResX = refRaster.res_x;
  const refResY = refRaster.res_y;

  const sampleRasterAt = (rd, x, y) => {
    const inside =
      x >= rd.min_x &&
      x <= rd.min_x + rd.width * rd.res_x &&
      y <= rd.max_y &&
      y >= rd.max_y - rd.height * rd.res_y;

    if (inside) {
      const colIdx = Math.floor((x - rd.min_x) / rd.res_x);
      const rowIdx = Math.floor((rd.max_y - y) / rd.res_y);
      if (colIdx >= 0 && colIdx < rd.width && rowIdx >= 0 && rowIdx < rd.height) {
        const px = rd.pixelValues[rowIdx * rd.width + colIdx];
        if (px !== null && px !== rd.noDataValue && !Number.isNaN(px) && Number.isFinite(px)) {
          return px;
        }
      }
    }
    return null;
  };

  console.log(`Checking ${refWidth}x${refHeight} = ${refWidth*refHeight} grid points...`);
  
  const stats = {};
  for (const rd of rawRastersData) {
    stats[rd.id_indikator] = { nama: rd.nama, validCount: 0, nullCount: 0 };
  }

  for (let r = 0; r < refHeight; r++) {
    for (let c = 0; c < refWidth; c++) {
      const x = refMinX + (c + 0.5) * refResX;
      const y = refMaxY - (r + 0.5) * refResY;

      for (const rd of rawRastersData) {
        const val = sampleRasterAt(rd, x, y);
        if (val !== null) {
          stats[rd.id_indikator].validCount++;
        } else {
          stats[rd.id_indikator].nullCount++;
        }
      }
    }
  }

  console.log("\n--- Raster Validity Statistics per Indicator ---");
  for (const id in stats) {
    console.log(`Indikator ${id} (${stats[id].nama.substring(0, 30)}): Valid = ${stats[id].validCount}, Null = ${stats[id].nullCount}`);
  }

  await prisma.$disconnect();
}

main();
