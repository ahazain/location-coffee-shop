const https = require('https');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('='.repeat(80));
  console.log('                    STATUS RASTER FUZZY PER INDIKATOR');
  console.log('='.repeat(80));
  console.log('\nIndikator          | Fuzzy Raster | Min  | Max  | Mean     | Aturan Fuzzy');
  console.log('-'.repeat(80));
  
  const indikatorNames = {
    1: 'Layanan Makan',
    2: 'Olahraga',
    3: 'Hunian',
    4: 'Pusat Belanja',
    5: 'Pendidikan',
    6: 'Kantor/Bisnis',
    7: 'Cahaya Malam',
    8: 'Populasi',
    9: 'Jalan Utama',
    10: 'Simpul Trans',
    11: 'Simpang Jalan',
    12: 'Kepadatan Coffee',
    13: 'Jarak Coffee Terdekat'
  };
  
  for (let i = 1; i <= 13; i++) {
    try {
      const res = await httpGet(`http://localhost:3001/geotiff/indikator/${i}`);
      const rasters = res.data.rasters;
      const fuzzy = rasters.find(r => r.tipe_raster === 'fuzzy');
      
      if (fuzzy) {
        const m = fuzzy.metadata;
        console.log(
          `${i.toString().padEnd(2)}. ${(indikatorNames[i]||'').padEnd(16)} | ✅ Ada       | ${m.min_value.toFixed(2).padStart(5)} | ${m.max_value.toFixed(2).padStart(5)} | ${m.mean_value.toFixed(4).padStart(8)} | -`
        );
      } else {
        console.log(`${i.toString().padEnd(2)}. ${(indikatorNames[i]||'').padEnd(16)} | ❌ TIDAK ADA | -     | -     | -        | -`);
      }
    } catch (e) {
      console.log(`${i.toString().padEnd(2)}. ${(indikatorNames[i]||'').padEnd(16)} | ❌ ERROR`);
    }
  }
}

main();
