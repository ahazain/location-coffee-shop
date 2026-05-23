export const datasetSummary = {
  activeVersion: "Dummy Spatial Dataset 2026 v1",
  areaStudy: "Sumbersari, Kaliwates, Patrang - Kabupaten Jember",
  gridSize: "465 m × 465 m",
  coordinateSystem: "UTM Zone 49S untuk analisis, WGS84 untuk WebGIS",
  publishedAt: "14 Mei 2026",
  status: "Aktif untuk front end dummy",
};

export const datasetLayers = [
  {
    id: "poi-food",
    name: "POI makanan non-cafe",
    type: "Point density",
    records: 168,
    freshness: "Dummy",
    status: "Tervalidasi",
  },
  {
    id: "poi-office",
    name: "POI kantor, bank, dan jasa",
    type: "Point density",
    records: 121,
    freshness: "Dummy",
    status: "Tervalidasi",
  },
  {
    id: "road-network",
    name: "Jaringan jalan utama dan simpang",
    type: "Line / node",
    records: 74,
    freshness: "Dummy",
    status: "Tervalidasi",
  },
  {
    id: "education",
    name: "Kampus dan fasilitas pendidikan",
    type: "Point density",
    records: 43,
    freshness: "Dummy",
    status: "Tervalidasi",
  },
  {
    id: "night-light",
    name: "Intensitas cahaya malam",
    type: "Raster index",
    records: 12,
    freshness: "Dummy",
    status: "Perlu update backend",
  },
  {
    id: "competitor",
    name: "Pesaing coffee shop",
    type: "Point / distance",
    records: 57,
    freshness: "Dummy",
    status: "Tervalidasi",
  },
];

export const uploadHistory = [
  {
    id: "UPL-001",
    fileName: "grid_jember_dummy.geojson",
    uploadedBy: "Admin",
    uploadedAt: "14 Mei 2026, 09:20",
    status: "Dipublikasikan",
  },
  {
    id: "UPL-002",
    fileName: "indikator_fuzzy_dummy.csv",
    uploadedBy: "Admin",
    uploadedAt: "14 Mei 2026, 09:12",
    status: "Tervalidasi",
  },
  {
    id: "UPL-003",
    fileName: "bobot_default_ahp.json",
    uploadedBy: "Admin",
    uploadedAt: "14 Mei 2026, 09:05",
    status: "Tervalidasi",
  },
];
