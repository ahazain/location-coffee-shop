const path = require("path");
const fs = require("fs");
const prisma = require("../prisma-client");

async function main() {
  const geojsonPath = path.join(__dirname, "batas_wilayah.geojson");
  if (!fs.existsSync(geojsonPath)) {
    console.error("File batas_wilayah.geojson tidak ditemukan di " + geojsonPath);
    process.exit(1);
  }

  console.log("Membaca file GeoJSON...");
  const rawData = fs.readFileSync(geojsonPath, "utf-8");
  const geojson = JSON.parse(rawData);

  console.log(`Ditemukan ${geojson.features.length} fitur batas wilayah.`);

  let updatedCount = 0;
  
  for (const feature of geojson.features) {
    const kecamatan = feature.properties.WADMKC;
    const kelurahan = feature.properties.WADMKD;
    
    if (!kecamatan || !kelurahan) {
      console.log(`Skip fitur karena WADMKC atau WADMKD tidak ditemukan.`);
      continue;
    }

    const geomStr = JSON.stringify(feature.geometry);

    console.log(`Memproses wilayah: Kecamatan ${kecamatan}, Kelurahan/Desa ${kelurahan}...`);

    try {
      // Update grid yang centroid-nya berada di dalam polygon ini
      const result = await prisma.$executeRawUnsafe(
        `UPDATE grid
         SET kecamatan = $1, kelurahan = $2
         WHERE ST_Intersects(ST_SetSRID(ST_GeomFromGeoJSON($3), 32749), ST_Centroid(geom))`,
        kecamatan,
        kelurahan,
        geomStr
      );
      updatedCount += result;
      console.log(`  -> Berhasil mengupdate ${result} grid.`);
    } catch (err) {
      console.error(`  -> Gagal memproses wilayah ${kelurahan}:`, err.message);
    }
  }

  // Tampilkan total grid yang tidak terupdate untuk analisa
  const nullGrids = await prisma.grid.count({
    where: {
      OR: [
        { kecamatan: null },
        { kelurahan: null }
      ]
    }
  });

  console.log(`Selesai! Total grid yang terupdate: ${updatedCount}`);
  console.log(`Grid yang masih bernilai null kecamatan/kelurahannya: ${nullGrids}`);
}

main()
  .catch((err) => {
    console.error("Terjadi kesalahan:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
