const fs = require('fs');
const data = JSON.parse(fs.readFileSync('wlc_grids.json', 'utf8'));

console.log('=' .repeat(80));
console.log('                    GRID DENGAN KELAS "SESUAI"');
console.log('=' .repeat(80));

const sesuai = data.data.features.filter(f => f.properties.suitabilityClass === 'Sesuai')
  .sort((a, b) => b.properties.scoreDefault - a.properties.scoreDefault);

console.log(`\nTotal: ${sesuai.length} grid\n`);
console.log('No  | Kode Grid | Kecamatan    | Kelurahan     | Skor WLC | Rank');
console.log('-'.repeat(75));

sesuai.forEach((f, i) => {
  const p = f.properties;
  console.log(
    `${String(i+1).padStart(2)} | ${p.gridCode.padEnd(10)} | ${(p.kecamatan||'-').padEnd(12)} | ${(p.kelurahan||'-').padEnd(12)} | ${p.scoreDefault.toFixed(4)}  | ${p.rank || '-'}`
  );
});

console.log('\n' + '='.repeat(80));
console.log('DETAIL INDIKATOR FUZZY (Sample 3 Grid Teratas)');
console.log('='.repeat(80));

sesuai.slice(0, 3).forEach((f, i) => {
  const p = f.properties;
  const s = p.indicatorScores;
  console.log(`\n--- ${p.gridCode} (Skor: ${p.scoreDefault.toFixed(4)}) ---`);
  console.log(`  Sawah: ${s.sawah === 1 ? '❌ TERKENA' : '✅ AMAN'}`);
  console.log(`  Sempadan Sungai: ${s.sempadan_sungai === 1 ? '❌ TERKENA' : '✅ AMAN'}`);
  console.log('  Fuzzy Scores:');
  console.log(`    - fuzzy_kepadatan_layanan_makan_non_coffee: ${(s.fuzzy_kepadatan_layanan_makan_non_coffee||0).toFixed(4)}`);
  console.log(`    - fuzzy_kepadatan_layanan_olahraga_rekreasi: ${(s.fuzzy_kepadatan_layanan_olahraga_rekreasi||0).toFixed(4)}`);
  console.log(`    - fuzzy_kepadatan_hunian: ${(s.fuzzy_kepadatan_hunian||0).toFixed(4)}`);
  console.log(`    - fuzzy_kedekatan_pusat_belanja: ${(s.fuzzy_kedekatan_pusat_belanja||0).toFixed(4)}`);
  console.log(`    - fuzzy_kepadatan_kampus_fasilitas_pendidikan: ${(s.fuzzy_kepadatan_kampus_fasilitas_pendidikan||0).toFixed(4)}`);
  console.log(`    - fuzzy_kepadatan_kantor_jasa_keuangan_bisnis: ${(s.fuzzy_kepadatan_kantor_jasa_keuangan_bisnis||0).toFixed(4)}`);
  console.log(`    - fuzzy_intensitas_cahaya_malam: ${(s.fuzzy_intensitas_cahaya_malam||0).toFixed(4)}`);
  console.log(`    - fuzzy_kepadatan_populasi: ${(s.fuzzy_kepadatan_populasi||0).toFixed(4)}`);
  console.log(`    - fuzzy_jarak_jalan_utama: ${(s.fuzzy_jarak_jalan_utama||0).toFixed(4)}`);
  console.log(`    - fuzzy_kedekatan_simpul_transportasi: ${(s.fuzzy_kedekatan_simpul_transportasi||0).toFixed(4)}`);
  console.log(`    - fuzzy_kepadatan_simpang_jalan: ${(s.fuzzy_kepadatan_simpang_jalan||0).toFixed(4)}`);
  console.log(`    - fuzzy_kepadatan_coffee_shop_existing: ${(s.fuzzy_kepadatan_coffee_shop_existing||0).toFixed(4)}`);
  console.log(`    - fuzzy_jarak_coffee_shop_existing_terdekat: ${(s.fuzzy_jarak_coffee_shop_existing_terdekat||0).toFixed(4)}`);
});
