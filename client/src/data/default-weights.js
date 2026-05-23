// Fallback tampilan jika service AHP belum dipanggil.
// Pada sistem ini bobot default utama dihitung dari data kuesioner AHP responden berpengalaman di weightService.
export const defaultCriteriaWeights = {
  aglomerasi_aktivitas: 18.32,
  hunian_pekerja: 16.98,
  aksesibilitas: 25.69,
  pusat_aktivitas: 18.32,
  vitalitas_ekonomi_populasi: 14.99,
  persaingan: 5.71,
};

export const defaultLocalIndicatorWeights = {
  aglomerasi_aktivitas: {
    kepadatan_makan: 60,
    kepadatan_olahraga: 40,
  },
  hunian_pekerja: {
    hunian_komersial: 48,
    kepadatan_kantor: 52,
  },
  aksesibilitas: {
    jarak_jalan: 43.67,
    jarak_transportasi: 33.67,
    kepadatan_simpang: 22.67,
  },
  pusat_aktivitas: {
    jarak_pusat_komersial: 52,
    kepadatan_pendidikan: 48,
  },
  vitalitas_ekonomi_populasi: {
    cahaya_malam: 46,
    kepadatan_populasi: 54,
  },
  persaingan: {
    kepadatan_pesaing: 50,
    jarak_pesaing: 50,
  },
};
