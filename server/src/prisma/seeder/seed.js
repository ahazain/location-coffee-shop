const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

const bcrypt = require("bcryptjs");
const prisma = require("../prisma-client");
const AHPService = require("../../services/ahp-service");

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
    id_kriteria: 1,
    nama_kriteria: "Zona Fungsional Kota",
    deskripsi:
      "Kriteria yang menggambarkan fungsi kawasan kota berdasarkan layanan, aktivitas, dan hunian.",
  },
  {
    id_kriteria: 2,
    nama_kriteria: "Permintaan Pasar",
    deskripsi:
      "Kriteria yang menggambarkan potensi permintaan pasar berdasarkan pusat kegiatan, pendidikan, kantor, jasa keuangan, dan bisnis.",
  },
  {
    id_kriteria: 3,
    nama_kriteria: "Kondisi Ekonomi",
    deskripsi:
      "Kriteria yang menggambarkan kondisi ekonomi wilayah melalui intensitas cahaya malam dan kepadatan populasi.",
  },
  {
    id_kriteria: 4,
    nama_kriteria: "Aksesibilitas Transportasi",
    deskripsi:
      "Kriteria yang menggambarkan kemudahan akses lokasi berdasarkan jalan utama, simpul transportasi, dan simpang jalan.",
  },
  {
    id_kriteria: 5,
    nama_kriteria: "Persaingan",
    deskripsi:
      "Kriteria yang menggambarkan tingkat persaingan berdasarkan keberadaan coffee shop eksisting.",
  },
  {
    id_kriteria: 6,
    nama_kriteria: "Pembatas Lahan",
    deskripsi:
      "Kriteria yang menggambarkan area pembatas atau area yang tidak layak untuk rekomendasi lokasi.",
  },
];

const indikatorData = [
  // 1. Zona Fungsional Kota
  {
    id_indikator: 1,
    id_kriteria: 1,
    nama_indikator: "Kepadatan layanan makan non-cafe",
    satuan: "indeks kepadatan relatif (raw)",
    tipe_nilai: "KEPADATAN",
    deskripsi:
      "Semakin tinggi kepadatan layanan makan non-coffee, semakin menunjukkan kawasan aktif secara komersial.",
  },
  {
    id_indikator: 2,
    id_kriteria: 1,
    nama_indikator: "Kepadatan layanan olahraga dan rekreasi",
    satuan: "indeks kepadatan relatif (raw)",
    tipe_nilai: "KEPADATAN",
    deskripsi:
      "Semakin tinggi kepadatan layanan olahraga dan rekreasi, semakin tinggi potensi aktivitas masyarakat.",
  },
  {
    id_indikator: 3,
    id_kriteria: 1,
    nama_indikator: "Kepadatan kawasan hunian",
    satuan: "indeks kepadatan relatif (raw)",
    tipe_nilai: "KEPADATAN",
    deskripsi:
      "Semakin tinggi kepadatan hunian, semakin besar potensi konsumen sekitar.",
  },

  // 2. Permintaan Pasar
  {
    id_indikator: 4,
    id_kriteria: 2,
    nama_indikator: "Kedekatan Pusat Belanja",
    satuan: "meter",
    tipe_nilai: "JARAK",
    deskripsi:
      "Semakin dekat dengan pusat belanja, semakin tinggi potensi permintaan pasar.",
  },
  {
    id_indikator: 5,
    id_kriteria: 2,
    nama_indikator: "Kepadatan kampus dan fasilitas pendidikan",
    satuan: "indeks kepadatan relatif (raw)",
    tipe_nilai: "KEPADATAN",
    deskripsi:
      "Semakin tinggi kepadatan kampus dan fasilitas pendidikan, semakin besar potensi pasar pelajar dan mahasiswa.",
  },
  {
    id_indikator: 6,
    id_kriteria: 2,
    nama_indikator: "Kepadatan kantor, bank, jasa keuangan, dan bisnis",
    satuan: "indeks kepadatan relatif (raw)",
    tipe_nilai: "KEPADATAN",
    deskripsi:
      "Semakin tinggi kepadatan kantor dan aktivitas bisnis, semakin besar potensi konsumen pekerja.",
  },

  // 3. Kondisi Ekonomi
  {
    id_indikator: 7,
    id_kriteria: 3,
    nama_indikator: "Intensitas Cahaya Malam",
    satuan: "indeks",
    tipe_nilai: "INTENSITAS",
    deskripsi:
      "Semakin tinggi intensitas cahaya malam, semakin tinggi indikasi aktivitas ekonomi wilayah.",
  },
  {
    id_indikator: 8,
    id_kriteria: 3,
    nama_indikator: "Kepadatan Populasi",
    satuan: "jiwa/m2",
    tipe_nilai: "KEPADATAN",
    deskripsi:
      "Semakin tinggi kepadatan populasi, semakin besar potensi pasar.",
  },

  // 4. Aksesibilitas Transportasi
  {
    id_indikator: 9,
    id_kriteria: 4,
    nama_indikator: "Jarak ke Jalan Utama",
    satuan: "meter",
    tipe_nilai: "JARAK",
    deskripsi:
      "Semakin dekat dengan jalan utama, semakin mudah lokasi dijangkau.",
  },
  {
    id_indikator: 10,
    id_kriteria: 4,
    nama_indikator: "Kedekatan Simpul Transportasi",
    satuan: "meter",
    tipe_nilai: "JARAK",
    deskripsi:
      "Semakin dekat dengan simpul transportasi, semakin tinggi aksesibilitas lokasi.",
  },
  {
    id_indikator: 11,
    id_kriteria: 4,
    nama_indikator: "Kepadatan simpang jalan",
    satuan: "indeks kepadatan relatif (raw)",
    tipe_nilai: "KEPADATAN",
    deskripsi:
      "Semakin tinggi kepadatan simpang jalan, semakin tinggi konektivitas kawasan.",
  },

  // 5. Persaingan
  {
    id_indikator: 12,
    id_kriteria: 5,
    nama_indikator: "Kepadatan coffee shop existing",
    satuan: "indeks kepadatan relatif (raw)",
    tipe_nilai: "KEPADATAN",
    deskripsi:
      "Semakin tinggi kepadatan coffee shop eksisting, semakin tinggi tingkat persaingan.",
  },
  {
    id_indikator: 13,
    id_kriteria: 5,
    nama_indikator: "Jarak ke Coffee Shop Existing Terdekat",
    satuan: "meter",
    tipe_nilai: "JARAK",
    deskripsi:
      "Semakin jauh dari coffee shop eksisting, semakin rendah tekanan persaingan langsung.",
  },

  // 6. Pembatas Lahan
  {
    id_indikator: 14,
    id_kriteria: 6,
    nama_indikator: "Sawah",
    satuan: "biner",
    tipe_nilai: "MASK",
    deskripsi:
      "Grid yang berada pada area sawah dapat dianggap sebagai area pembatas sesuai aturan penelitian.",
  },
  {
    id_indikator: 15,
    id_kriteria: 6,
    nama_indikator: "Sungai",
    satuan: "biner",
    tipe_nilai: "MASK",
    deskripsi:
      "Grid yang masuk area sungai dapat menjadi area pembatas lokasi usaha.",
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
        id_kriteria: item.id_kriteria,
      },
      update: {
        nama_kriteria: item.nama_kriteria,
        deskripsi: item.deskripsi,
      },
      create: {
        id_kriteria: item.id_kriteria,
        nama_kriteria: item.nama_kriteria,
        deskripsi: item.deskripsi,
      },
    });
  }

  console.log("Kriteria seeded.");
}

async function seedIndikator() {
  for (const item of indikatorData) {
    await prisma.indikator.upsert({
      where: {
        id_indikator: item.id_indikator,
      },
      update: {
        id_kriteria: item.id_kriteria,
        nama_indikator: item.nama_indikator,
        satuan: item.satuan,
        tipe_nilai: item.tipe_nilai,
        deskripsi: item.deskripsi,
      },
      create: {
        id_indikator: item.id_indikator,
        id_kriteria: item.id_kriteria,
        nama_indikator: item.nama_indikator,
        satuan: item.satuan,
        tipe_nilai: item.tipe_nilai,
        deskripsi: item.deskripsi,
      },
    });
  }

  console.log("Indikator seeded.");
}

// Field `is_active` dihapus dari model Pakar pada skema baru, jadi
// seeder tidak lagi mengirim/menyaring berdasarkan field tersebut.
async function seedPakar() {
  console.log("Seeding Pakar...");

  const pakarData = [
    {
      nama_pakar: "Danur",
      institusi: "Omah Kulos",
      jabatan: "Owner",
    },
    {
      nama_pakar: "Muhammad Safi",
      institusi: "Nuansa",
      jabatan: "Manager",
    },
    {
      nama_pakar: "Mede Agung Ariawan",
      institusi: "Wijaya",
      jabatan: "Owner",
    },
  ];

  for (const item of pakarData) {
    await prisma.pakar.create({
      data: item,
    });
  }

  console.log("Pakar seeded.");
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
        hasil_wlc,
        raster_layers,
        aturan_fuzzy,
        indikator,
        kriteria,
        pakar,
        users,
        existing_coffee_shop,
        grid
      RESTART IDENTITY CASCADE;
    `);
  });

  // Hapus semua file fisik GeoTIFF di storage agar sinkron dengan database yang kosong
  console.log("Cleaning up physical GeoTIFF files from storage...");
  const storageDirs = [
    path.join(__dirname, "../../../storage/geotiff/raw"),
    path.join(__dirname, "../../../storage/geotiff/fuzzy"),
    path.join(__dirname, "../../../storage/geotiff/final_score"),
  ];

  for (const dir of storageDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.lstatSync(filePath).isFile()) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.warn(
              `  [WARNING] Gagal menghapus file ${file}: ${err.message}. Pastikan file tidak sedang dibuka di QGIS.`,
            );
          }
        }
      }
    }
  }

  console.log("Seed data, ID sequence, and storage cleanup completed.");
}

async function importLocalRasters() {
  console.log("Checking local QGIS rasters to auto-import...");

  const GeotiffHelper = require("../../helpers/geotiff-helper");
  const RasterDbUtil = require("../../utils/raster-db-util");

  const localRasters = [
    {
      id_indikator: 1,
      source:
        "C:/Penelitian Pertama Saya_SKRIPSI/Data spasial/2. align raster/FINAL-layananmakan.tif",
    },
    {
      id_indikator: 2,
      source:
        "C:/Penelitian Pertama Saya_SKRIPSI/Data spasial/2. align raster/FINAL-olahraga dan rekreasi.tif",
    },
    {
      id_indikator: 3,
      source:
        "C:/Penelitian Pertama Saya_SKRIPSI/Data spasial/2. align raster/FINAL-hunian.tif",
    },
    {
      id_indikator: 4,
      source:
        "C:/Penelitian Pertama Saya_SKRIPSI/Data spasial/2. align raster/FINAL-kedekatan pusat belanja.tif",
    },
    {
      id_indikator: 5,
      source:
        "C:/Penelitian Pertama Saya_SKRIPSI/Data spasial/2. align raster/FINAL-fasilitas pendidikan.tif",
    },
    {
      id_indikator: 6,
      source:
        "C:/Penelitian Pertama Saya_SKRIPSI/Data spasial/2. align raster/FINAL-kantor.tif",
    },
    {
      id_indikator: 7,
      source:
        "C:/Penelitian Pertama Saya_SKRIPSI/Data spasial/2. align raster/FINAL-INL.tif",
    },
    {
      id_indikator: 8,
      source:
        "C:/Penelitian Pertama Saya_SKRIPSI/Data spasial/2. align raster/FINAL-kepadatan populasi.tif",
    },
    {
      id_indikator: 9,
      source:
        "C:/Penelitian Pertama Saya_SKRIPSI/Data spasial/2. align raster/FINAL-jarak ke jalan.tif",
    },
    {
      id_indikator: 10,
      source:
        "C:/Penelitian Pertama Saya_SKRIPSI/Data spasial/2. align raster/FINAL-jarak ke simpul.tif",
    },
    {
      id_indikator: 11,
      source:
        "C:/Penelitian Pertama Saya_SKRIPSI/Data spasial/2. align raster/FINAL-kepadatan simpang.tif",
    },
    {
      id_indikator: 12,
      source:
        "C:/Penelitian Pertama Saya_SKRIPSI/Data spasial/2. align raster/FINAL-coffeeshop.tif",
    },
    {
      id_indikator: 13,
      source:
        "C:/Penelitian Pertama Saya_SKRIPSI/Data spasial/2. align raster/FINAL-jarak ke coffeeshop.tif",
    },
    {
      id_indikator: 14,
      source:
        "C:/Penelitian Pertama Saya_SKRIPSI/Data spasial/2. align raster/SAWAH.tif",
    },
    {
      id_indikator: 15,
      source:
        "C:/Penelitian Pertama Saya_SKRIPSI/Data spasial/2. align raster/SUNGAI.tif",
    },
  ];

  const uploadDir = path.join(process.cwd(), "storage", "geotiff", "raw");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  for (const item of localRasters) {
    if (!fs.existsSync(item.source)) {
      console.log(
        `  [-] File not found for indicator ${item.id_indikator}: ${item.source}`,
      );
      continue;
    }

    console.log(
      `  [+] Importing ${path.basename(item.source)} for indicator ${item.id_indikator}...`,
    );

    const ext = path.extname(item.source).toLowerCase();
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const baseName = path
      .basename(item.source, ext)
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `${timestamp}_${random}_${baseName}${ext}`;
    const targetPath = path.join(uploadDir, fileName);

    // Copy file fisik ke storage/geotiff/raw
    fs.copyFileSync(item.source, targetPath);

    // Ekstrak metadata dan simpan ke database
    try {
      const metadata = await GeotiffHelper.readMetadata(targetPath);
      const storedPath = RasterDbUtil.normalizeStoredPath(targetPath);

      // `kode_layer` wajib & unik pada skema baru, generate deterministik
      // per indikator+tipe agar mudah dilacak, ditambah suffix random
      // pendek untuk menjamin keunikan antar-run seed.
      const kodeLayer = `RAW-IND${item.id_indikator}-${crypto
        .randomBytes(4)
        .toString("hex")}`;

      await prisma.rasterLayer.create({
        data: {
          id_indikator: item.id_indikator,
          kode_layer: kodeLayer,
          tipe_raster: "RAW",
          file_path: storedPath,
          crs: metadata.crs,
          min_value: metadata.min_value,
          max_value: metadata.max_value,
          mean_value: metadata.mean_value,
          nodata_value: metadata.nodata_value,
        },
      });
      console.log(
        `      Success: Imported ${fileName} (kode_layer=${kodeLayer})`,
      );
    } catch (err) {
      console.error(`      Error importing ${item.source}:`, err.message);
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
    }
  }
}

async function seedAHP() {
  console.log("Seeding AHP bobot default untuk 3 pakar dengan matriks berbeda...");

  // Matriks kriteria per pakar (5x5, konsisten CR < 0.1)
  const matriksKriteria = [
    [
      // Pakar 1
      [1, 0.2, 2, 1, 3],
      [5, 1, 6, 5, 8],
      [0.5, 0.1667, 1, 0.5, 2],
      [1, 0.2, 2, 1, 3],
      [0.3333, 0.125, 0.5, 0.3333, 1],
    ],
    [
      // Pakar 2
      [1, 0.25, 2, 1, 3],
      [4, 1, 5, 4, 7],
      [0.5, 0.2, 1, 0.5, 2],
      [1, 0.25, 2, 1, 3],
      [0.3333, 0.1428, 0.5, 0.3333, 1],
    ],
    [
      // Pakar 3
      [1, 0.1667, 2, 1, 3],
      [6, 1, 7, 6, 9],
      [0.5, 0.1428, 1, 0.5, 2],
      [1, 0.1667, 2, 1, 3],
      [0.3333, 0.1111, 0.5, 0.3333, 1],
    ],
  ];

  // Matriks indikator per kriteria per pakar
  const matriksIndikatorPakar = [
    // Pakar 1
    [
      { id_kriteria: 1, item_ids: [1, 2, 3], matrix: [[1, 2, 3], [0.5, 1, 2], [0.333, 0.5, 1]] },
      { id_kriteria: 2, item_ids: [4, 5, 6], matrix: [[1, 0.1429, 2], [7, 1, 8], [0.5, 0.125, 1]] },
      { id_kriteria: 3, item_ids: [7, 8], matrix: [[1, 2], [0.5, 1]] },
      { id_kriteria: 4, item_ids: [9, 10, 11], matrix: [[1, 2, 3], [0.5, 1, 2], [0.333, 0.5, 1]] },
      { id_kriteria: 5, item_ids: [12, 13], matrix: [[1, 0.5], [2, 1]] },
    ],
    // Pakar 2
    [
      { id_kriteria: 1, item_ids: [1, 2, 3], matrix: [[1, 3, 4], [0.3333, 1, 2], [0.25, 0.5, 1]] },
      { id_kriteria: 2, item_ids: [4, 5, 6], matrix: [[1, 0.2, 3], [5, 1, 6], [0.3333, 0.1667, 1]] },
      { id_kriteria: 3, item_ids: [7, 8], matrix: [[1, 3], [0.3333, 1]] },
      { id_kriteria: 4, item_ids: [9, 10, 11], matrix: [[1, 3, 4], [0.3333, 1, 2], [0.25, 0.5, 1]] },
      { id_kriteria: 5, item_ids: [12, 13], matrix: [[1, 0.3333], [3, 1]] },
    ],
    // Pakar 3
    [
      { id_kriteria: 1, item_ids: [1, 2, 3], matrix: [[1, 1.5, 2], [0.6667, 1, 1.5], [0.5, 0.6667, 1]] },
      { id_kriteria: 2, item_ids: [4, 5, 6], matrix: [[1, 0.1111, 1.5], [9, 1, 9], [0.6667, 0.1111, 1]] },
      { id_kriteria: 3, item_ids: [7, 8], matrix: [[1, 1.5], [0.6667, 1]] },
      { id_kriteria: 4, item_ids: [9, 10, 11], matrix: [[1, 1.5, 2], [0.6667, 1, 1.5], [0.5, 0.6667, 1]] },
      { id_kriteria: 5, item_ids: [12, 13], matrix: [[1, 0.6667], [1.5, 1]] },
    ],
  ];

  const pakarList = await prisma.pakar.findMany({
    orderBy: { id_pakar: "asc" },
  });

  for (let i = 0; i < pakarList.length; i++) {
    const pakar = pakarList[i];
    const matKriteria = matriksKriteria[Math.min(i, matriksKriteria.length - 1)];

    try {
      await AHPService.saveKriteriaAHP({
        id_pakar: pakar.id_pakar,
        matrix: matKriteria,
        item_ids: [1, 2, 3, 4, 5],
      });
      console.log(
        `  [OK] AHP Kriteria Pakar ${pakar.id_pakar} (${pakar.nama_pakar}) disimpan.`,
      );
    } catch (e) {
      console.warn(
        `  [WARN] AHP Kriteria Pakar ${pakar.id_pakar}: ${e.message}`,
      );
    }

    const indMatriksList = matriksIndikatorPakar[Math.min(i, matriksIndikatorPakar.length - 1)];
    for (const indKriteria of indMatriksList) {
      try {
        await AHPService.saveIndikatorAHP({
          id_pakar: pakar.id_pakar,
          id_kriteria: indKriteria.id_kriteria,
          matrix: indKriteria.matrix,
          item_ids: indKriteria.item_ids,
        });
        console.log(
          `  [OK] AHP Indikator K${indKriteria.id_kriteria} Pakar ${pakar.id_pakar} disimpan.`,
        );
      } catch (e) {
        console.warn(
          `  [WARN] AHP Indikator K${indKriteria.id_kriteria} Pakar ${pakar.id_pakar}: ${e.message}`,
        );
      }
    }
  }

  console.log("AHP bobot default selesai di-seed.");
}

async function seedExistingCoffeeShops() {
  console.log("Seeding existing coffee shops from JSON...");
  const jsonPath = path.join(__dirname, "existing_coffee_shops.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error(
      `existing_coffee_shops.json tidak ditemukan di ${jsonPath}`,
    );
  }

  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const shops = JSON.parse(rawData);

  for (const shop of shops) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO existing_coffee_shop (nama, latitude, longitude, geom, created_at, updated_at)
       VALUES ($1, $2, $3, ST_SetSRID(ST_Point($4, $5), 32749), NOW(), NOW())`,
      shop.nama,
      shop.latitude,
      shop.longitude,
      shop.x_32749,
      shop.y_32749,
    );
  }
  console.log(`Seeded ${shops.length} existing coffee shop points.`);
}

async function calculateRasterMidrange(rawRaster) {
  try {
    const rawAbsPath = path.isAbsolute(rawRaster.file_path)
      ? rawRaster.file_path
      : path.join(process.cwd(), rawRaster.file_path);

    const GeotiffHelper = require("../../helpers/geotiff-helper");
    const { noDataValue, pixelValues } =
      await GeotiffHelper.readPixelsForFuzzy(rawAbsPath);

    const validValues = pixelValues.filter(
      (v) =>
        v !== null &&
        v !== undefined &&
        !Number.isNaN(v) &&
        Number.isFinite(v) &&
        v > 0 &&
        (noDataValue === null || v !== noDataValue),
    );

    if (validValues.length > 0) {
      validValues.sort((a, b) => a - b);
      const minVal = validValues[0];
      const maxVal = validValues[validValues.length - 1];
      return (minVal + maxVal) / 2;
    }
  } catch (err) {
    console.error(
      `Gagal menghitung midrange untuk indikator ${rawRaster.id_indikator}:`,
      err.message,
    );
  }
  return 0;
}

async function seedAturanFuzzy() {
  console.log("Seeding default fuzzy rules...");
  const indicators = await prisma.indikator.findMany({
    where: {
      NOT: { tipe_nilai: "MASK" },
    },
  });

  const costIndicatorIds = [4, 9, 10];
  const nearIndicatorIds = [12, 13];
  // Konfigurasi jangkauan/radius khusus untuk indikator jarak
  const customRanges = {
    4: { nilai_min: 0, nilai_max: 400 }, // Jarak ke pusat belanja
    9: { nilai_min: 0, nilai_max: 150 }, // Jarak ke jalan umum
    10: { nilai_min: 0, nilai_max: 800 }, // Jarak ke simpul transportasi
  };

  for (const ind of indicators) {
    let fungsi_fuzzy = "LINEAR";
    let arah = costIndicatorIds.includes(ind.id_indikator)
      ? "DECREASING"
      : "INCREASING";
    let autoMidpoint = null;
    let autoSpread = null;

    if (nearIndicatorIds.includes(ind.id_indikator)) {
      fungsi_fuzzy = "NEAR";
      arah = "NEAR";
      autoSpread = 0.2;

      const rawRaster = await prisma.rasterLayer.findFirst({
        where: {
          id_indikator: ind.id_indikator,
          tipe_raster: "RAW",
        },
      });
      if (rawRaster) {
        autoMidpoint = await calculateRasterMidrange(rawRaster);
      }
    }

    const range = customRanges[ind.id_indikator] || {
      nilai_min: null,
      nilai_max: null,
    };

    await prisma.aturanFuzzy.upsert({
      where: { id_indikator: ind.id_indikator },
      update: {
        fungsi_fuzzy,
        arah,
        nilai_min: range.nilai_min,
        nilai_max: range.nilai_max,
        midpoint: autoMidpoint,
        spread: autoSpread,
      },
      create: {
        id_indikator: ind.id_indikator,
        fungsi_fuzzy,
        arah,
        nilai_min: range.nilai_min,
        nilai_max: range.nilai_max,
        midpoint: autoMidpoint,
        spread: autoSpread,
      },
    });
  }
  console.log("Default fuzzy rules seeded.");
}

async function main() {
  console.log("Start seeding master data...");

  await resetSeedData();

  await seedUsers();
  await seedKriteria();
  await seedIndikator();

  // Reset database sequence IDs setelah insert manual ID
  console.log("Resetting postgres ID sequences...");
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('kriteria', 'id_kriteria'), COALESCE(MAX(id_kriteria), 1)) FROM kriteria;`,
  );
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('indikator', 'id_indikator'), COALESCE(MAX(id_indikator), 1)) FROM indikator;`,
  );
  console.log("Postgres sequence IDs reset successfully.");

  await seedPakar();

  try {
    await seedExistingCoffeeShops();
  } catch (error) {
    console.error("Seed existing coffee shops failed:", error.message);
  }

  // Impor file GeoTIFF lokal secara otomatis
  try {
    await importLocalRasters();
  } catch (error) {
    console.error("Auto-import rasters failed:", error.message);
  }

  // Seed bobot AHP default untuk pakar
  try {
    await seedAHP();
  } catch (error) {
    console.error("Seed AHP failed:", error.message);
  }

  try {
    await seedAturanFuzzy();
  } catch (error) {
    console.error("Seed fuzzy rules failed:", error.message);
  }

  // Hitung normalisasi fuzzy untuk semua indikator secara otomatis setelah seed
  console.log("Calculating fuzzy normalizations for all indicators...");
  try {
    const FuzzyService = require("../../services/fuzzy-service");
    const fuzzyResult = await FuzzyService.calculateAll();
    console.log(`Fuzzy calculation completed: ${fuzzyResult.total_berhasil} success, ${fuzzyResult.total_gagal} failed.`);
  } catch (error) {
    console.error("Fuzzy calculation failed:", error.message);
  }

  // Hitung WLC consensus secara otomatis setelah seed
  console.log("Calculating WLC consensus scores and classifications...");
  try {
    const WlcService = require("../../services/wlc-service");
    const wlcResult = await WlcService.calculateWlcConsensus();
    console.log(`WLC calculation completed successfully. Seeded ${wlcResult.totalGrids} grids.`);
  } catch (error) {
    console.error("WLC calculation failed:", error.message);
  }

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
