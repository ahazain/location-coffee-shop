const fs = require("fs");
const path = require("path");
const prisma = require("./src/prisma/prisma-client");

async function main() {
  const geojsonPath = path.join(__dirname, "src/prisma/seeder/data-coffeeshop.geojson");
  console.log("Reading GeoJSON from:", geojsonPath);
  
  if (!fs.existsSync(geojsonPath)) {
    throw new Error("File not found!");
  }
  
  const rawData = fs.readFileSync(geojsonPath, "utf-8");
  const geojson = JSON.parse(rawData);
  const features = geojson.features || [];
  
  console.log(`Found ${features.length} features in GeoJSON.`);
  
  await prisma.$transaction(async (tx) => {
    // Clear existing
    await tx.$executeRawUnsafe(`TRUNCATE TABLE existing_coffee_shop CASCADE`);
    
    // Insert new
    for (const f of features) {
      const name = f.properties?.name || "Kedai Kopi Tanpa Nama";
      const [x, y] = f.geometry.coordinates;
      
      await tx.$executeRawUnsafe(`
        INSERT INTO existing_coffee_shop (nama, latitude, longitude, geom, created_at, updated_at)
        VALUES (
          $1,
          ST_Y(ST_Transform(ST_SetSRID(ST_Point($2, $3), 32749), 4326)),
          ST_X(ST_Transform(ST_SetSRID(ST_Point($2, $3), 32749), 4326)),
          ST_SetSRID(ST_Point($2, $3), 32749),
          NOW(),
          NOW()
        )
      `, name, x, y);
    }
  });
  
  const count = await prisma.existingCoffeeShop.count();
  console.log("DB count after import:", count);
  
  const samples = await prisma.existingCoffeeShop.findMany({
    take: 2,
    select: {
      nama: true,
      latitude: true,
      longitude: true
    }
  });
  console.log("Samples:", JSON.stringify(samples, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
