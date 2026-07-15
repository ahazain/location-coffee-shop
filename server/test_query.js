const prisma = require("./src/prisma/prisma-client");

async function main() {
  const result = await prisma.$queryRawUnsafe(`
    SELECT 
      g.kode_grid, 
      COUNT(c.id_shop)::int as count 
    FROM grid g 
    LEFT JOIN existing_coffee_shop c ON ST_Contains(g.geom, c.geom) 
    WHERE g.kode_grid IN ('GRID-516', 'GRID-758', 'GRID-520', 'GRID-487') 
    GROUP BY g.kode_grid
  `);
  console.log("COUNTS:", JSON.stringify(result));
}

main().catch(console.error).finally(() => prisma.$disconnect());
