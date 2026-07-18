const prisma = require('./prisma-client');

async function main() {
  // 1. Get Pakars
  const pakars = await prisma.pakar.findMany({
    orderBy: { id_pakar: 'asc' }
  });
  console.log('=== PAKARS ===');
  console.log(pakars);

  // 2. Get Kriteria Weights
  const kriteria = await prisma.kriteria.findMany({
    where: { NOT: { id_kriteria: 6 } }, // exclude constraint
    orderBy: { id_kriteria: 'asc' }
  });

  const bobotKriteria = await prisma.bobotKriteria.findMany({
    include: {
      pakar: true,
      kriteria: true
    },
    orderBy: [{ id_kriteria: 'asc' }, { id_pakar: 'asc' }]
  });

  console.log('\n=== CRITERIA WEIGHTS ===');
  console.log('Kriteria | Omah Kulos | Nuansa | Wijaya');
  console.log('---|---|---|---');
  for (const crit of kriteria) {
    const weights = pakars.map(p => {
      const match = bobotKriteria.find(b => b.id_pakar === p.id_pakar && b.id_kriteria === crit.id_kriteria);
      return match ? Number(match.bobot_kriteria).toFixed(6) : '-';
    });
    console.log(`${crit.nama_kriteria} | ${weights.join(' | ')}`);
  }

  // 3. Get Indicator Weights
  const indikator = await prisma.indikator.findMany({
    where: { NOT: { id_kriteria: 6 } }, // exclude constraint
    orderBy: { id_indikator: 'asc' }
  });

  const bobotIndikator = await prisma.bobotIndikator.findMany({
    include: {
      pakar: true,
      indikator: true
    },
    orderBy: [{ id_indikator: 'asc' }, { id_pakar: 'asc' }]
  });

  console.log('\n=== LOCAL INDICATOR WEIGHTS ===');
  console.log('Indikator | Omah Kulos | Nuansa | Wijaya');
  console.log('---|---|---|---');
  for (const ind of indikator) {
    const weights = pakars.map(p => {
      const match = bobotIndikator.find(b => b.id_pakar === p.id_pakar && b.id_indikator === ind.id_indikator);
      return match ? Number(match.bobot_lokal).toFixed(6) : '-';
    });
    console.log(`${ind.nama_indikator} | ${weights.join(' | ')}`);
  }

  console.log('\n=== GLOBAL INDICATOR WEIGHTS & AVERAGE ===');
  console.log('Indikator | Omah Kulos (Global) | Nuansa (Global) | Wijaya (Global) | Rata-rata');
  console.log('---|---|---|---|---');
  for (const ind of indikator) {
    const weights = pakars.map(p => {
      const match = bobotIndikator.find(b => b.id_pakar === p.id_pakar && b.id_indikator === ind.id_indikator);
      return match ? Number(match.bobot_akhir) : 0;
    });
    const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
    console.log(`${ind.nama_indikator} | ${weights.map(w => w.toFixed(6)).join(' | ')} | ${avg.toFixed(6)}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
