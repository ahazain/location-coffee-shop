const http = require('http');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('='.repeat(80));
  console.log('                    STATUS RASTER FUZZY PER INDIKATOR');
  console.log('='.repeat(80));
  console.log('\nNo | Indikator              | Fuzzy? | Min  | Max  | Mean');
  console.log('-'.repeat(75));
  
  const indikatorNames = {
    1: 'Layanan Makan Non-Coffee',
    2: 'Olahraga & Rekreasi',
    3: 'Kepadatan Hunian',
    4: 'Kedekatan Pusat Belanja',
    5: 'Kepadatan Pendidikan',
    6: 'Kepadatan Kantor/Bisnis',
    7: 'Intensitas Cahaya Malam',
    8: 'Kepadatan Populasi',
    9: 'Jarak ke Jalan Utama',
    10: 'Kedekatan Simpul Trans',
    11: 'Kepadatan Simpang Jalan',
    12: 'Kepadatan Coffee Shop',
    13: 'Jarak Coffee Terdekat'
  };
  
  for (let i = 1; i <= 13; i++) {
    try {
      const res = await httpGet(`http://localhost:3001/geotiff/indikator/${i}`);
      const rasters = res.data?.rasters || [];
      const fuzzy = rasters.find(r => r.tipe_raster === 'fuzzy');
      const raw = rasters.find(r => r.tipe_raster === 'raw');
      
      if (fuzzy && raw) {
        const fm = fuzzy.metadata;
        const rm = raw.metadata;
        console.log(
          `${String(i).padStart(2)} | ${(indikatorNames[i]||'').substring(0,24).padEnd(24)} | ✅   | ${fm.min_value?.toFixed(2).padStart(5)} | ${fm.max_value?.toFixed(2).padStart(5)} | ${fm.mean_value?.toFixed(4).padStart(8)}`
        );
      } else {
        console.log(`${String(i).padStart(2)} | ${(indikatorNames[i]||'').substring(0,24).padEnd(24)} | ❌   | -     | -     | -`);
      }
    } catch (e) {
      console.log(`${String(i).padStart(2)} | ${(indikatorNames[i]||'').substring(0,24).padEnd(24)} | ERR  | ${e.message}`);
    }
  }
}

main();
