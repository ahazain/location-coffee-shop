export const uploadLayerOptions = [
  {
    id: "coffee-existing",
    label: "Titik kedai kopi existing / pesaing",
    category: "POI kompetitor",
    uploadMode: "Tambah data baru",
    backendAction: "append",
    acceptedFormats: "GeoJSON FeatureCollection (.geojson / .json)",
    acceptedExtensions: [".geojson", ".json"],
    allowedGeometry: "Point / MultiPoint",
    gridRequirement: "Titik baru akan dihitung ulang menjadi kepadatan dan jarak pesaing pada grid utama 465 m × 465 m.",
    affectedIndicators: ["kepadatan_pesaing", "jarak_pesaing"],
    description:
      "Dipakai ketika ada kedai kopi existing baru. Data tidak mengganti seluruh layer, tetapi menambah titik baru ke database existing.",
  },
  {
    id: "poi-food",
    label: "POI layanan makan non-cafe",
    category: "POI aktivitas konsumsi",
    uploadMode: "Tambah / ganti data POI",
    backendAction: "replace_version",
    acceptedFormats: "GeoJSON FeatureCollection (.geojson / .json)",
    acceptedExtensions: [".geojson", ".json"],
    allowedGeometry: "Point / MultiPoint",
    gridRequirement: "POI akan direkap kembali menjadi kepadatan layanan makan non-cafe per grid.",
    affectedIndicators: ["kepadatan_makan"],
    description:
      "Dipakai bila admin memperbarui layanan makan non-cafe sebagai sumber aglomerasi aktivitas.",
  },
  {
    id: "poi-recreation",
    label: "POI olahraga dan rekreasi",
    category: "POI aktivitas santai",
    uploadMode: "Tambah / ganti data POI",
    backendAction: "replace_version",
    acceptedFormats: "GeoJSON FeatureCollection (.geojson / .json)",
    acceptedExtensions: [".geojson", ".json"],
    allowedGeometry: "Point / MultiPoint",
    gridRequirement: "POI akan direkap kembali menjadi kepadatan fasilitas olahraga dan rekreasi per grid.",
    affectedIndicators: ["kepadatan_olahraga"],
    description:
      "Dipakai bila ada pembaruan titik olahraga dan rekreasi yang memengaruhi aglomerasi aktivitas.",
  },
  {
    id: "housing-office",
    label: "Hunian, kantor, bank, jasa keuangan, dan bisnis",
    category: "Pasar hunian dan pekerja",
    uploadMode: "Ganti versi layer",
    backendAction: "replace_version",
    acceptedFormats: "GeoJSON FeatureCollection (.geojson / .json)",
    acceptedExtensions: [".geojson", ".json"],
    allowedGeometry: "Point / Polygon / MultiPolygon",
    gridRequirement: "Objek hunian dan area kerja akan direkap ke indikator hunian serta kepadatan kantor/bisnis per grid.",
    affectedIndicators: ["hunian_komersial", "kepadatan_kantor"],
    description:
      "Dipakai untuk memperbarui indikator kawasan hunian dan aktivitas kerja/bisnis.",
  },
  {
    id: "accessibility-road",
    label: "Jaringan jalan utama",
    category: "Aksesibilitas",
    uploadMode: "Ganti versi layer",
    backendAction: "replace_version",
    acceptedFormats: "GeoJSON FeatureCollection (.geojson / .json)",
    acceptedExtensions: [".geojson", ".json"],
    allowedGeometry: "LineString / MultiLineString",
    gridRequirement: "Jarak setiap grid ke jalan utama dihitung ulang dari layer jalan terbaru.",
    affectedIndicators: ["jarak_jalan"],
    description:
      "Dipakai bila admin memperbarui jaringan jalan utama kategori primary, secondary, atau tertiary.",
  },
  {
    id: "accessibility-intersection",
    label: "Titik simpang jalan",
    category: "Aksesibilitas",
    uploadMode: "Ganti versi layer",
    backendAction: "replace_version",
    acceptedFormats: "GeoJSON FeatureCollection (.geojson / .json)",
    acceptedExtensions: [".geojson", ".json"],
    allowedGeometry: "Point / MultiPoint",
    gridRequirement: "Titik simpang akan direkap kembali menjadi kepadatan simpang per grid.",
    affectedIndicators: ["kepadatan_simpang"],
    description:
      "Dipakai untuk memperbarui indikator konektivitas simpang jalan.",
  },
  {
    id: "transport-node",
    label: "Simpul transportasi",
    category: "Aksesibilitas",
    uploadMode: "Ganti versi layer",
    backendAction: "replace_version",
    acceptedFormats: "GeoJSON FeatureCollection (.geojson / .json)",
    acceptedExtensions: [".geojson", ".json"],
    allowedGeometry: "Point / MultiPoint",
    gridRequirement: "Jarak setiap grid ke simpul transportasi dihitung ulang dari titik terbaru.",
    affectedIndicators: ["jarak_transportasi"],
    description:
      "Dipakai untuk memperbarui halte, terminal, stasiun, atau titik naik turun transportasi.",
  },
  {
    id: "commercial-education",
    label: "Pusat komersial, kampus, dan fasilitas pendidikan",
    category: "Pusat aktivitas",
    uploadMode: "Ganti versi layer",
    backendAction: "replace_version",
    acceptedFormats: "GeoJSON FeatureCollection (.geojson / .json)",
    acceptedExtensions: [".geojson", ".json"],
    allowedGeometry: "Point / Polygon / MultiPolygon",
    gridRequirement: "Pusat komersial dihitung sebagai jarak, sedangkan kampus/fasilitas pendidikan direkap sebagai kepadatan.",
    affectedIndicators: ["jarak_pusat_komersial", "kepadatan_pendidikan"],
    description:
      "Dipakai untuk pembaruan pusat aktivitas yang dapat menarik pergerakan pengunjung.",
  },
  {
    id: "vitality-population",
    label: "Grid cahaya malam dan kepadatan populasi",
    category: "Vitalitas ekonomi dan populasi",
    uploadMode: "Ganti versi grid",
    backendAction: "replace_version",
    acceptedFormats: "GeoJSON grid FeatureCollection (.geojson / .json)",
    acceptedExtensions: [".geojson", ".json"],
    allowedGeometry: "Polygon / MultiPolygon",
    gridRequirement: "GeoJSON harus sudah mengikuti grid utama dan membawa nilai cahaya malam/populasi pada atribut fitur.",
    affectedIndicators: ["cahaya_malam", "kepadatan_populasi"],
    description:
      "Dipakai saat nilai cahaya malam atau populasi diperbarui pada grid wilayah studi.",
  },
  {
    id: "constraint-mask",
    label: "Constraint area layak / tidak layak",
    category: "Pembatas area",
    uploadMode: "Ganti versi mask",
    backendAction: "replace_mask",
    acceptedFormats: "GeoJSON grid FeatureCollection (.geojson / .json)",
    acceptedExtensions: [".geojson", ".json"],
    allowedGeometry: "Polygon / MultiPolygon",
    gridRequirement: "Setiap grid membawa nilai mask 1 untuk layak dan 0 untuk area yang dikeluarkan dari analisis.",
    affectedIndicators: ["constraint_mask"],
    description:
      "Dipakai untuk memperbarui mask sempadan jalan, sungai, persawahan, atau area yang dikeluarkan dari analisis.",
  },
];

export const adminPipelineSteps = [
  {
    id: "dataset",
    title: "Input dataset GeoJSON",
    description:
      "Admin mengunggah GeoJSON spasial. Layer bertipe append akan menambah data, sedangkan layer bertipe replace akan membuat versi aktif baru.",
    route: "/admin/datasets",
    status: "Operasional",
  },
  {
    id: "fuzzy",
    title: "Fuzzy per indikator terdampak",
    description:
      "Sistem menandai indikator terdampak dari layer yang berubah. Admin menjalankan fuzzy hanya pada indikator tersebut.",
    route: "/admin/fuzzy",
    status: "Per indikator",
  },
  {
    id: "ahp",
    title: "Kelola AHP default",
    description:
      "Admin dapat menambahkan responden baru. Jika bobot default berubah, fuzzy tidak perlu ulang, tetapi WLC harus dihitung ulang.",
    route: "/admin/ahp",
    status: "Opsional",
  },
  {
    id: "wlc",
    title: "Hitung WLC ulang",
    description:
      "WLC berjalan setelah semua indikator terdampak selesai difuzzy dan bobot AHP default tersedia.",
    route: "/admin/wlc",
    status: "Setelah fuzzy siap",
  },
  {
    id: "preview",
    title: "Preview dan publish peta",
    description:
      "Admin memeriksa peta draft hasil WLC sebelum dipublikasikan sebagai peta default pelaku usaha.",
    route: "/admin/map-preview",
    status: "Tahap akhir",
  },
];

export const datasetValidationChecklist = [
  "Format file harus GeoJSON FeatureCollection (.geojson atau .json)",
  "Setiap fitur harus memiliki geometry yang valid",
  "Layer grid harus memakai kode grid yang sama dengan grid utama",
  "Sistem koordinat data sudah sesuai proses analisis atau sudah dikonversi sebelum upload",
  "Untuk layer kompetitor, data baru ditambahkan ke layer existing, bukan mengganti seluruh titik lama",
  "Setelah upload, sistem menandai indikator terdampak agar fuzzy dilakukan hanya pada indikator tersebut",
];

export const initialProcessingLogs = [
  {
    id: "LOG-INIT-001",
    title: "Dataset awal dummy aktif",
    detail: "Dataset awal digunakan sebagai versi awal front end. Perubahan admin akan disimpan pada mock backend localStorage.",
    status: "Aktif",
    time: "Data awal",
  },
  {
    id: "LOG-INIT-002",
    title: "Nilai fuzzy awal tersedia",
    detail: "Semua indikator awal dianggap sudah memiliki nilai fuzzy 0 sampai 1 sehingga WLC awal dapat ditampilkan.",
    status: "Siap WLC",
    time: "Data awal",
  },
];
