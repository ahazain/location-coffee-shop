const prisma = require("./src/prisma/prisma-client");

async function main() {
  console.log("=== MEMULAI PENCARIAN GRID SAMPEL VALIDASI (JS-FILTER) ===");

  // Fetch all grid data, WLC scores, indicator values, and coffee shop count using a simple SQL query
  const rawData = await prisma.$queryRawUnsafe(`
    SELECT 
      g.kode_grid,
      g.kecamatan,
      g.kelurahan,
      h.skor_wlc::float as skor_wlc,
      h.kelas_kesesuaian,
      h.nilai_indikator,
      (SELECT COUNT(*)::int FROM existing_coffee_shop c WHERE ST_Contains(g.geom, c.geom)) as jumlah_coffee_shop
    FROM grid g
    INNER JOIN hasil_wlc h ON g.id_grid = h.id_grid
  `);

  console.log(`Total data grid terbaca: ${rawData.length}\n`);

  // --- SAMPEL 1: Grid dengan kepadatan coffee shop eksisting tinggi ---
  console.log("--- 1. GRID DENGAN KEPADATAN COFFEE SHOP EKSISTING TINGGI ---");
  const sampel1 = rawData
    .filter(g => g.jumlah_coffee_shop > 0)
    .sort((a, b) => {
      if (b.jumlah_coffee_shop !== a.jumlah_coffee_shop) {
        return b.jumlah_coffee_shop - a.jumlah_coffee_shop;
      }
      const densityA = a.nilai_indikator?.kepadatan_coffee_shop_existing ?? 0;
      const densityB = b.nilai_indikator?.kepadatan_coffee_shop_existing ?? 0;
      return densityB - densityA;
    })
    .slice(0, 3);
  printGrids(sampel1);

  // --- SAMPEL 2: Grid tanpa coffee shop eksisting namun memiliki indikator pendukung lain yang kuat ---
  console.log("--- 2. GRID TANPA COFFEE SHOP EKSISTING, INDIKATOR PENDUKUNG LAIN KUAT ---");
  const sampel2 = rawData
    .filter(g => g.jumlah_coffee_shop === 0 && (g.nilai_indikator?.sawah ?? 0) === 0 && (g.nilai_indikator?.sempadan_sungai ?? 0) === 0)
    .sort((a, b) => b.skor_wlc - a.skor_wlc)
    .slice(0, 3);
  printGrids(sampel2);

  // --- SAMPEL 3: Grid tanpa coffee shop eksisting dan indikator pendukung lain juga lemah ---
  console.log("--- 3. GRID TANPA COFFEE SHOP EKSISTING, INDIKATOR PENDUKUNG LAIN LEMAH ---");
  const sampel3 = rawData
    .filter(g => g.jumlah_coffee_shop === 0 && (g.nilai_indikator?.sawah ?? 0) === 0 && (g.nilai_indikator?.sempadan_sungai ?? 0) === 0 && g.skor_wlc > 0)
    .sort((a, b) => a.skor_wlc - b.skor_wlc)
    .slice(0, 3);
  printGrids(sampel3);

  // --- SAMPEL 4: Grid yang berada pada area pembatas (constraint aktif) ---
  console.log("--- 4. GRID YANG BERADA PADA AREA PEMBATAS (CONSTRAINT AKTIF) ---");
  const sampel4 = rawData
    .filter(g => (g.nilai_indikator?.sawah ?? 0) > 0 || (g.nilai_indikator?.sempadan_sungai ?? 0) > 0)
    .sort((a, b) => b.jumlah_coffee_shop - a.jumlah_coffee_shop)
    .slice(0, 3);
  printGrids(sampel4);
}

function printGrids(grids) {
  if (grids.length === 0) {
    console.log("Tidak ada data ditemukan.\n");
    return;
  }
  grids.forEach((g) => {
    console.log(`Kode Grid         : ${g.kode_grid}`);
    console.log(`Kecamatan/Kelurahan: ${g.kecamatan || "-"}/${g.kelurahan || "-"}`);
    console.log(`Skor WLC          : ${g.skor_wlc}`);
    console.log(`Kelas Kesesuaian  : ${g.kelas_kesesuaian}`);
    console.log(`Jumlah Kopi Eksis : ${g.jumlah_coffee_shop}`);
    console.log(`Indikator Utama   :`);
    console.log(`  - Sawah          : ${g.nilai_indikator?.sawah ?? 0}`);
    console.log(`  - Sempadan Sungai: ${g.nilai_indikator?.sempadan_sungai ?? 0}`);
    console.log(`  - Hunian         : ${g.nilai_indikator?.kepadatan_hunian ?? 0}`);
    console.log(`  - Populasi       : ${g.nilai_indikator?.kepadatan_populasi ?? 0}`);
    console.log(`  - Jarak Jalan    : ${g.nilai_indikator?.jarak_jalan_utama ?? 0}`);
    if (g.nilai_indikator?.kepadatan_coffee_shop_existing !== undefined) {
      console.log(`  - Kepadatan Kopi : ${g.nilai_indikator.kepadatan_coffee_shop_existing}`);
    }
    console.log("----------------------------------------");
  });
  console.log("\n");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
