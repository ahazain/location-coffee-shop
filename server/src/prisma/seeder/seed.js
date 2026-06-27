const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

const bcrypt = require("bcryptjs");
const prisma = require("../prisma-client");

const adminUsers = [
  {
    nama: "Admin",
    email: "admin@spkkopi.com",
    password: "admin12345",
    role: "admin",
  },
];

const kriteriaData = [
  {
    kode_kriteria: "zona_fungsional_kota",
    nama_kriteria: "Zona Fungsional Kota",
    deskripsi:
      "Kriteria yang menggambarkan fungsi kawasan kota berdasarkan layanan, aktivitas, dan hunian.",
    urutan: 1,
  },
  {
    kode_kriteria: "permintaan_pasar",
    nama_kriteria: "Permintaan Pasar",
    deskripsi:
      "Kriteria yang menggambarkan potensi permintaan pasar berdasarkan pusat kegiatan, pendidikan, kantor, jasa keuangan, dan bisnis.",
    urutan: 2,
  },
  {
    kode_kriteria: "kondisi_ekonomi",
    nama_kriteria: "Kondisi Ekonomi",
    deskripsi:
      "Kriteria yang menggambarkan kondisi ekonomi wilayah melalui intensitas cahaya malam dan kepadatan populasi.",
    urutan: 3,
  },
  {
    kode_kriteria: "aksesibilitas_transportasi",
    nama_kriteria: "Aksesibilitas Transportasi",
    deskripsi:
      "Kriteria yang menggambarkan kemudahan akses lokasi berdasarkan jalan utama, simpul transportasi, dan simpang jalan.",
    urutan: 4,
  },
  {
    kode_kriteria: "persaingan",
    nama_kriteria: "Persaingan",
    deskripsi:
      "Kriteria yang menggambarkan tingkat persaingan berdasarkan keberadaan coffee shop eksisting.",
    urutan: 5,
  },
  {
    kode_kriteria: "pembatas_lahan",
    nama_kriteria: "Pembatas Lahan",
    deskripsi:
      "Kriteria yang menggambarkan area pembatas atau area yang tidak layak untuk rekomendasi lokasi.",
    urutan: 6,
  },
];

const indikatorData = [
  // 1. Zona Fungsional Kota
  {
    kode_kriteria: "zona_fungsional_kota",
    kode_indikator: "kepadatan_layanan_makan_non_coffee",
    nama_indikator: "Kepadatan Layanan Makan Non-Coffee",
    satuan: "unit/km2",
    jenis_indikator: "benefit",
    tipe_nilai: "kepadatan",
    sumber_data: "Hasil preprocessing QGIS",
    metode_pengolahan:
      "Menghitung kepadatan layanan makan non-coffee pada setiap grid.",
    deskripsi:
      "Semakin tinggi kepadatan layanan makan non-coffee, semakin menunjukkan kawasan aktif secara komersial.",
    urutan: 1,
  },
  {
    kode_kriteria: "zona_fungsional_kota",
    kode_indikator: "kepadatan_layanan_olahraga_rekreasi",
    nama_indikator: "Kepadatan Layanan Olahraga dan Rekreasi",
    satuan: "unit/km2",
    jenis_indikator: "benefit",
    tipe_nilai: "kepadatan",
    sumber_data: "Hasil preprocessing QGIS",
    metode_pengolahan:
      "Menghitung kepadatan fasilitas olahraga dan rekreasi pada setiap grid.",
    deskripsi:
      "Semakin tinggi kepadatan layanan olahraga dan rekreasi, semakin tinggi potensi aktivitas masyarakat.",
    urutan: 2,
  },
  {
    kode_kriteria: "zona_fungsional_kota",
    kode_indikator: "kepadatan_hunian",
    nama_indikator: "Kepadatan Hunian",
    satuan: "unit/km2",
    jenis_indikator: "benefit",
    tipe_nilai: "kepadatan",
    sumber_data: "Hasil preprocessing QGIS",
    metode_pengolahan:
      "Menghitung kepadatan hunian atau area permukiman pada setiap grid.",
    deskripsi:
      "Semakin tinggi kepadatan hunian, semakin besar potensi konsumen sekitar.",
    urutan: 3,
  },

  // 2. Permintaan Pasar
  {
    kode_kriteria: "permintaan_pasar",
    kode_indikator: "kedekatan_pusat_belanja",
    nama_indikator: "Kedekatan Pusat Belanja",
    satuan: "meter",
    jenis_indikator: "cost",
    tipe_nilai: "jarak",
    sumber_data: "Hasil preprocessing QGIS",
    metode_pengolahan: "Menghitung jarak terdekat dari grid ke pusat belanja.",
    deskripsi:
      "Semakin dekat dengan pusat belanja, semakin tinggi potensi permintaan pasar.",
    urutan: 1,
  },
  {
    kode_kriteria: "permintaan_pasar",
    kode_indikator: "kepadatan_kampus_fasilitas_pendidikan",
    nama_indikator: "Kepadatan Kampus dan Fasilitas Pendidikan",
    satuan: "unit/km2",
    jenis_indikator: "benefit",
    tipe_nilai: "kepadatan",
    sumber_data: "Hasil preprocessing QGIS",
    metode_pengolahan:
      "Menghitung kepadatan kampus dan fasilitas pendidikan pada setiap grid.",
    deskripsi:
      "Semakin tinggi kepadatan kampus dan fasilitas pendidikan, semakin besar potensi pasar pelajar dan mahasiswa.",
    urutan: 2,
  },
  {
    kode_kriteria: "permintaan_pasar",
    kode_indikator: "kepadatan_kantor_jasa_keuangan_bisnis",
    nama_indikator: "Kepadatan Kantor, Jasa Keuangan, dan Bisnis",
    satuan: "unit/km2",
    jenis_indikator: "benefit",
    tipe_nilai: "kepadatan",
    sumber_data: "Hasil preprocessing QGIS",
    metode_pengolahan:
      "Menghitung kepadatan kantor, jasa keuangan, dan bisnis pada setiap grid.",
    deskripsi:
      "Semakin tinggi kepadatan kantor dan aktivitas bisnis, semakin besar potensi konsumen pekerja.",
    urutan: 3,
  },

  // 3. Kondisi Ekonomi
  {
    kode_kriteria: "kondisi_ekonomi",
    kode_indikator: "intensitas_cahaya_malam",
    nama_indikator: "Intensitas Cahaya Malam",
    satuan: "indeks",
    jenis_indikator: "benefit",
    tipe_nilai: "rata_rata",
    sumber_data: "Raster cahaya malam hasil preprocessing QGIS",
    metode_pengolahan:
      "Menggunakan zonal statistics untuk menghitung rata-rata intensitas cahaya malam pada setiap grid.",
    deskripsi:
      "Semakin tinggi intensitas cahaya malam, semakin tinggi indikasi aktivitas ekonomi wilayah.",
    urutan: 1,
  },
  {
    kode_kriteria: "kondisi_ekonomi",
    kode_indikator: "kepadatan_populasi",
    nama_indikator: "Kepadatan Populasi",
    satuan: "jiwa/km2",
    jenis_indikator: "benefit",
    tipe_nilai: "kepadatan",
    sumber_data: "Data populasi hasil preprocessing QGIS",
    metode_pengolahan:
      "Menghitung atau menggabungkan data populasi ke dalam grid analisis.",
    deskripsi:
      "Semakin tinggi kepadatan populasi, semakin besar potensi pasar.",
    urutan: 2,
  },

  // 4. Aksesibilitas Transportasi
  {
    kode_kriteria: "aksesibilitas_transportasi",
    kode_indikator: "jarak_jalan_utama",
    nama_indikator: "Jarak ke Jalan Utama",
    satuan: "meter",
    jenis_indikator: "cost",
    tipe_nilai: "jarak",
    sumber_data: "Jaringan jalan hasil preprocessing QGIS",
    metode_pengolahan: "Menghitung jarak terdekat dari grid ke jalan utama.",
    deskripsi:
      "Semakin dekat dengan jalan utama, semakin mudah lokasi dijangkau.",
    urutan: 1,
  },
  {
    kode_kriteria: "aksesibilitas_transportasi",
    kode_indikator: "kedekatan_simpul_transportasi",
    nama_indikator: "Kedekatan Simpul Transportasi",
    satuan: "meter",
    jenis_indikator: "cost",
    tipe_nilai: "jarak",
    sumber_data: "Data simpul transportasi hasil preprocessing QGIS",
    metode_pengolahan:
      "Menghitung jarak terdekat dari grid ke simpul transportasi.",
    deskripsi:
      "Semakin dekat dengan simpul transportasi, semakin tinggi aksesibilitas lokasi.",
    urutan: 2,
  },
  {
    kode_kriteria: "aksesibilitas_transportasi",
    kode_indikator: "kepadatan_simpang_jalan",
    nama_indikator: "Kepadatan Simpang Jalan",
    satuan: "unit/km2",
    jenis_indikator: "benefit",
    tipe_nilai: "kepadatan",
    sumber_data: "Jaringan jalan hasil preprocessing QGIS",
    metode_pengolahan:
      "Menghitung jumlah atau kepadatan simpang jalan pada setiap grid.",
    deskripsi:
      "Semakin tinggi kepadatan simpang jalan, semakin tinggi konektivitas kawasan.",
    urutan: 3,
  },

  // 5. Persaingan
  {
    kode_kriteria: "persaingan",
    kode_indikator: "kepadatan_coffee_shop_existing",
    nama_indikator: "Kepadatan Coffee Shop Existing",
    satuan: "unit/km2",
    jenis_indikator: "cost",
    tipe_nilai: "kepadatan",
    sumber_data: "Data coffee shop eksisting dan hasil preprocessing QGIS",
    metode_pengolahan:
      "Menghitung kepadatan coffee shop eksisting pada setiap grid.",
    deskripsi:
      "Semakin tinggi kepadatan coffee shop eksisting, semakin tinggi tingkat persaingan.",
    urutan: 1,
  },
  {
    kode_kriteria: "persaingan",
    kode_indikator: "jarak_coffee_shop_existing_terdekat",
    nama_indikator: "Jarak ke Coffee Shop Existing Terdekat",
    satuan: "meter",
    jenis_indikator: "benefit",
    tipe_nilai: "jarak",
    sumber_data: "Data coffee shop eksisting dan hasil preprocessing QGIS",
    metode_pengolahan:
      "Menghitung jarak terdekat dari grid ke coffee shop eksisting.",
    deskripsi:
      "Semakin jauh dari coffee shop eksisting, semakin rendah tekanan persaingan langsung.",
    urutan: 2,
  },

  // 6. Pembatas Lahan
  {
    kode_kriteria: "pembatas_lahan",
    kode_indikator: "sawah",
    nama_indikator: "Sawah",
    satuan: "biner",
    jenis_indikator: "constraint",
    tipe_nilai: "pembatas_lahan",
    sumber_data: "Polygon sawah hasil preprocessing QGIS",
    metode_pengolahan:
      "Overlay area sawah dengan grid untuk menentukan grid yang terkena pembatas lahan.",
    deskripsi:
      "Grid yang berada pada area sawah dapat dianggap sebagai area pembatas sesuai aturan penelitian.",
    urutan: 1,
  },
  {
    kode_kriteria: "pembatas_lahan",
    kode_indikator: "sempadan_jalan",
    nama_indikator: "Sempadan Jalan",
    satuan: "biner",
    jenis_indikator: "constraint",
    tipe_nilai: "pembatas_lahan",
    sumber_data: "Buffer sempadan jalan hasil preprocessing QGIS",
    metode_pengolahan:
      "Overlay area sempadan jalan dengan grid untuk menentukan grid yang terkena pembatas.",
    deskripsi:
      "Grid yang masuk area sempadan jalan dapat menjadi area pembatas lokasi usaha.",
    urutan: 2,
  },
  {
    kode_kriteria: "pembatas_lahan",
    kode_indikator: "sempadan_sungai",
    nama_indikator: "Sempadan Sungai",
    satuan: "biner",
    jenis_indikator: "constraint",
    tipe_nilai: "pembatas_lahan",
    sumber_data: "Buffer sempadan sungai hasil preprocessing QGIS",
    metode_pengolahan:
      "Overlay area sempadan sungai dengan grid untuk menentukan grid yang terkena pembatas.",
    deskripsi:
      "Grid yang masuk area sempadan sungai dapat menjadi area pembatas lokasi usaha.",
    urutan: 3,
  },
];

async function seedUsers() {
  for (const user of adminUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: {
        email: user.email,
      },
      update: {
        nama: user.nama,
        role: user.role,
        password: hashedPassword,
      },
      create: {
        nama: user.nama,
        email: user.email,
        password: hashedPassword,
        role: user.role,
      },
    });
  }

  console.log("Admin user seeded.");
}

async function seedKriteria() {
  for (const item of kriteriaData) {
    await prisma.kriteria.upsert({
      where: {
        kode_kriteria: item.kode_kriteria,
      },
      update: {
        nama_kriteria: item.nama_kriteria,
        deskripsi: item.deskripsi,
        urutan: item.urutan,
        is_active: true,
      },
      create: {
        kode_kriteria: item.kode_kriteria,
        nama_kriteria: item.nama_kriteria,
        deskripsi: item.deskripsi,
        urutan: item.urutan,
        is_active: true,
      },
    });
  }

  console.log("Kriteria seeded.");
}

async function seedIndikator() {
  for (const item of indikatorData) {
    const kriteria = await prisma.kriteria.findUnique({
      where: {
        kode_kriteria: item.kode_kriteria,
      },
    });

    if (!kriteria) {
      throw new Error(
        `Kriteria dengan kode ${item.kode_kriteria} tidak ditemukan.`,
      );
    }

    await prisma.indikator.upsert({
      where: {
        kode_indikator: item.kode_indikator,
      },
      update: {
        id_kriteria: kriteria.id_kriteria,
        nama_indikator: item.nama_indikator,
        satuan: item.satuan,
        jenis_indikator: item.jenis_indikator,
        tipe_nilai: item.tipe_nilai,
        sumber_data: item.sumber_data,
        metode_pengolahan: item.metode_pengolahan,
        deskripsi: item.deskripsi,
        urutan: item.urutan,
        is_active: true,
      },
      create: {
        id_kriteria: kriteria.id_kriteria,
        kode_indikator: item.kode_indikator,
        nama_indikator: item.nama_indikator,
        satuan: item.satuan,
        jenis_indikator: item.jenis_indikator,
        tipe_nilai: item.tipe_nilai,
        sumber_data: item.sumber_data,
        metode_pengolahan: item.metode_pengolahan,
        deskripsi: item.deskripsi,
        urutan: item.urutan,
        is_active: true,
      },
    });
  }

  console.log("Indikator seeded.");
}

async function resetSeedData() {
  console.log("Resetting seed data and ID sequence...");

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`
      TRUNCATE TABLE
        ahp_konsistensi,
        bobot_indikator,
        bobot_kriteria,
        ahp_indikator_matrix,
        ahp_kriteria_matrix,
        simulasi_bobot_indikator,
        simulasi,
        hasil_wlc,
        raster_layers,
        analysis_run,
        aturan_fuzzy,
        indikator,
        kriteria,
        users
      RESTART IDENTITY CASCADE;
    `);
  });

  console.log("Seed data and ID sequence reset completed.");
}

async function main() {
  console.log("Start seeding master data...");

  await resetSeedData();

  await seedUsers();
  await seedKriteria();
  await seedIndikator();

  console.log("Seeding completed.");
}
main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
