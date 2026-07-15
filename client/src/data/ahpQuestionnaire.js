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
      "1": 14,
      "2": 57,
      "3": 9,
      "4": 14,
      "5": 5,
    },
    localIndicatorWeights: {
      "1": {
        kepadatan_makan: 54,
        kepadatan_olahraga: 30,
        hunian_komersial: 16,
      },
      "2": {
        jarak_pusat_komersial: 14,
        kepadatan_pendidikan: 78,
        kepadatan_kantor: 8,
      },
      "3": {
        cahaya_malam: 67,
        kepadatan_populasi: 33,
      },
      "4": {
        jarak_jalan: 54,
        jarak_transportasi: 30,
        kepadatan_simpang: 16,
      },
      "5": {
        kepadatan_pesaing: 33,
        jarak_pesaing: 67,
      },
    },
  },
  {
    respondentId: "R2",
    criteriaWeights: {
      "1": 16,
      "2": 53,
      "3": 10,
      "4": 16,
      "5": 6,
    },
    localIndicatorWeights: {
      "1": {
        kepadatan_makan: 62,
        kepadatan_olahraga: 24,
        hunian_komersial: 14,
      },
      "2": {
        jarak_pusat_komersial: 20,
        kepadatan_pendidikan: 71,
        kepadatan_kantor: 9,
      },
      "3": {
        cahaya_malam: 75,
        kepadatan_populasi: 25,
      },
      "4": {
        jarak_jalan: 62,
        jarak_transportasi: 24,
        kepadatan_simpang: 14,
      },
      "5": {
        kepadatan_pesaing: 25,
        jarak_pesaing: 75,
      },
    },
  },
  {
    respondentId: "R3",
    criteriaWeights: {
      "1": 13,
      "2": 61,
      "3": 8,
      "4": 13,
      "5": 5,
    },
    localIndicatorWeights: {
      "1": {
        kepadatan_makan: 46,
        kepadatan_olahraga: 32,
        hunian_komersial: 22,
      },
      "2": {
        jarak_pusat_komersial: 11,
        kepadatan_pendidikan: 81,
        kepadatan_kantor: 8,
      },
      "3": {
        cahaya_malam: 60,
        kepadatan_populasi: 40,
      },
      "4": {
        jarak_jalan: 46,
        jarak_transportasi: 32,
        kepadatan_simpang: 22,
      },
      "5": {
        kepadatan_pesaing: 40,
        jarak_pesaing: 60,
      },
    },
  },
];
