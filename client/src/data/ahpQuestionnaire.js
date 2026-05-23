export const respondentProfiles = [
  {
    id: "R1",
    name: "Responden 1",
    coffeeShop: "Omah Kulos",
    role: "Pemilik / pengelola",
    experience: "> 2 tahun",
    hasBranch: true,
    note: "Masuk kelompok responden berpengalaman untuk bobot default sistem.",
  },
  {
    id: "R2",
    name: "Responden 2",
    coffeeShop: "Cafe Nuansa",
    role: "Pemilik / manajer",
    experience: "> 2 tahun",
    hasBranch: true,
    note: "Masuk kelompok responden berpengalaman untuk bobot default sistem.",
  },
  {
    id: "R3",
    name: "Responden 3",
    coffeeShop: "Cafe Wijaya",
    role: "Pemilik / manajer",
    experience: "> 2 tahun",
    hasBranch: true,
    note: "Masuk kelompok responden berpengalaman untuk bobot default sistem.",
  },
];

export const respondentPrioritySnapshots = [
  {
    respondentId: "R1",
    criteriaWeights: {
      aglomerasi_aktivitas: 18,
      hunian_pekerja: 17,
      aksesibilitas: 27,
      pusat_aktivitas: 18,
      vitalitas_ekonomi_populasi: 15,
      persaingan: 5,
    },
    localIndicatorWeights: {
      aglomerasi_aktivitas: {
        kepadatan_makan: 58,
        kepadatan_olahraga: 42,
      },
      hunian_pekerja: {
        hunian_komersial: 48,
        kepadatan_kantor: 52,
      },
      aksesibilitas: {
        jarak_jalan: 45,
        jarak_transportasi: 32,
        kepadatan_simpang: 23,
      },
      pusat_aktivitas: {
        jarak_pusat_komersial: 54,
        kepadatan_pendidikan: 46,
      },
      vitalitas_ekonomi_populasi: {
        cahaya_malam: 46,
        kepadatan_populasi: 54,
      },
      persaingan: {
        kepadatan_pesaing: 52,
        jarak_pesaing: 48,
      },
    },
  },
  {
    respondentId: "R2",
    criteriaWeights: {
      aglomerasi_aktivitas: 20,
      hunian_pekerja: 16,
      aksesibilitas: 24,
      pusat_aktivitas: 19,
      vitalitas_ekonomi_populasi: 14,
      persaingan: 7,
    },
    localIndicatorWeights: {
      aglomerasi_aktivitas: {
        kepadatan_makan: 62,
        kepadatan_olahraga: 38,
      },
      hunian_pekerja: {
        hunian_komersial: 50,
        kepadatan_kantor: 50,
      },
      aksesibilitas: {
        jarak_jalan: 42,
        jarak_transportasi: 35,
        kepadatan_simpang: 23,
      },
      pusat_aktivitas: {
        jarak_pusat_komersial: 50,
        kepadatan_pendidikan: 50,
      },
      vitalitas_ekonomi_populasi: {
        cahaya_malam: 48,
        kepadatan_populasi: 52,
      },
      persaingan: {
        kepadatan_pesaing: 50,
        jarak_pesaing: 50,
      },
    },
  },
  {
    respondentId: "R3",
    criteriaWeights: {
      aglomerasi_aktivitas: 17,
      hunian_pekerja: 18,
      aksesibilitas: 26,
      pusat_aktivitas: 18,
      vitalitas_ekonomi_populasi: 16,
      persaingan: 5,
    },
    localIndicatorWeights: {
      aglomerasi_aktivitas: {
        kepadatan_makan: 60,
        kepadatan_olahraga: 40,
      },
      hunian_pekerja: {
        hunian_komersial: 46,
        kepadatan_kantor: 54,
      },
      aksesibilitas: {
        jarak_jalan: 44,
        jarak_transportasi: 34,
        kepadatan_simpang: 22,
      },
      pusat_aktivitas: {
        jarak_pusat_komersial: 52,
        kepadatan_pendidikan: 48,
      },
      vitalitas_ekonomi_populasi: {
        cahaya_malam: 44,
        kepadatan_populasi: 56,
      },
      persaingan: {
        kepadatan_pesaing: 48,
        jarak_pesaing: 52,
      },
    },
  },
];
