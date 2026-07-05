const fs = require('fs');
const data = JSON.parse(fs.readFileSync('wlc_grids.json', 'utf8'));

const topGrids = ['GRID-735', 'GRID-457', 'GRID-790'];

topGrids.forEach(targetCode => {
  const f = data.data.features.find(feat => feat.properties.gridCode === targetCode);
  if (!f) return;
  
  const p = f.properties;
  const s = p.indicatorScores;
  
  console.log('='.repeat(80));
  console.log(`${p.gridCode} | ${p.kecamatan}, ${p.kelurahan}`);
  console.log(`Skor WLC: ${p.scoreDefault.toFixed(6)} | Kelas: ${p.suitabilityClass}`);
  console.log('-'.repeat(80));
  console.log('CONSTRAINT (harus 0 untuk tidak constrained):');
  console.log(`  Sawah: ${s.sawah === 1 ? '❌ TERKENA' : '✅ AMAN'}`);
  console.log(`  Sempadan Sungai: ${s.sempadan_sungai === 1 ? '❌ TERKENA' : '✅ AMAN'}`);
  console.log('-'.repeat(80));
  console.log('NILAI FUZZY (0-1):');
  
  const fuzzyFields = Object.entries(s)
    .filter(([k]) => k.startsWith('fuzzy_') && !k.includes('_raw') && k !== 'fuzzy_sawah' && k !== 'fuzzy_sempadan_sungai')
    .sort((a, b) => b[1] - a[1]);
  
  fuzzyFields.forEach(([key, val]) => {
    const displayName = key.replace('fuzzy_', 'fuzzy_');
    const bar = '█'.repeat(Math.round(val * 10)) + '░'.repeat(10 - Math.round(val * 10));
    console.log(`  ${displayName.padEnd(50)} | ${val.toFixed(4)} | ${bar}`);
  });
  
  console.log('');
});
