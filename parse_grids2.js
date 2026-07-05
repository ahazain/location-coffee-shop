const fs = require('fs');
const data = JSON.parse(fs.readFileSync('wlc_grids.json', 'utf8'));

console.log('='.repeat(80));
console.log('                    ANALISIS HASIL WLC TERKINI');
console.log('='.repeat(80));

const features = data.data.features;

console.log(`\nTotal Grid: ${features.length}`);

// Count by class
const classes = {};
features.forEach(f => {
  const c = f.properties.suitabilityClass;
  classes[c] = (classes[c] || 0) + 1;
});

console.log('\nDistribusi Kelas Kesesuaian:');
Object.entries(classes).forEach(([cls, count]) => {
  const pct = (count / features.length * 100).toFixed(1);
  console.log(`  ${cls}: ${count} grid (${pct}%)`);
});

// Score distribution
const scores = features.map(f => f.properties.scoreDefault).filter(s => s > 0).sort((a, b) => b - a);

console.log('\nTop 10 Skor Tertinggi:');
console.log('Rank | Kode Grid   | Kecamatan    | Kelurahan     | Skor WLC');
console.log('-'.repeat(70));

const sortedByScore = [...features].sort((a, b) => b.properties.scoreDefault - a.properties.scoreDefault);

sortedByScore.slice(0, 10).forEach((f, i) => {
  const p = f.properties;
  console.log(
    `${String(i+1).padStart(4)} | ${(p.gridCode||'-').padEnd(12)} | ${(p.kecamatan||'-').padEnd(12)} | ${(p.kelurahan||'-').padEnd(12)} | ${p.scoreDefault.toFixed(6)}`
  );
});

// Score ranges
console.log('\nDistribusi Skor:');
const ranges = [
  [0.9, 1.0, '0.900 - 1.000'],
  [0.8, 0.9, '0.800 - 0.899'],
  [0.7, 0.8, '0.700 - 0.799'],
  [0.6, 0.7, '0.600 - 0.699'],
  [0.5, 0.6, '0.500 - 0.599'],
  [0.4, 0.5, '0.400 - 0.499'],
  [0.3, 0.4, '0.300 - 0.399'],
  [0.2, 0.3, '0.200 - 0.299'],
  [0.1, 0.2, '0.100 - 0.199'],
  [0.0, 0.1, '0.000 - 0.099'],
  [-9999, 0, 'NO DATA (skor = -9999 / constraint)']
];

ranges.forEach(([min, max, label]) => {
  let count;
  if (max === 0) {
    count = features.filter(f => f.properties.scoreDefault < 0.1).length;
  } else {
    count = features.filter(f => f.properties.scoreDefault >= min && f.properties.scoreDefault < max).length;
  }
  if (count > 0) {
    console.log(`  ${label}: ${count} grid`);
  }
});

