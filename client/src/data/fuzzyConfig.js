export const fuzzyConfigByIndicator = {
  kepadatan_makan: {
    functionName: "Fuzzy Linear - Increasing",
    parameter: "Xmin = 0, Xmax = nilai maksimum grid",
    formula: "(X - Xmin) / (Xmax - Xmin)",
  },
  kepadatan_olahraga: {
    functionName: "Fuzzy Linear - Increasing",
    parameter: "Xmin = 0, Xmax = nilai maksimum grid",
    formula: "(X - Xmin) / (Xmax - Xmin)",
  },
  hunian_komersial: {
    functionName: "Fuzzy Linear - Increasing",
    parameter: "Xmin = 0, Xmax = nilai maksimum grid",
    formula: "(X - Xmin) / (Xmax - Xmin)",
  },
  kepadatan_kantor: {
    functionName: "Fuzzy Linear - Increasing",
    parameter: "Xmin = 0, Xmax = nilai maksimum grid",
    formula: "(X - Xmin) / (Xmax - Xmin)",
  },
  jarak_jalan: {
    functionName: "Fuzzy Linear - Decreasing",
    parameter: "Xmin = 0 m, Xmax = 150 m atau maksimum grid",
    formula: "(Xmax - X) / (Xmax - Xmin)",
  },
  kepadatan_simpang: {
    functionName: "Fuzzy Linear - Increasing",
    parameter: "Xmin = 0, Xmax = nilai maksimum grid",
    formula: "(X - Xmin) / (Xmax - Xmin)",
  },
  jarak_transportasi: {
    functionName: "Fuzzy Linear - Decreasing",
    parameter: "Xmin = 0 m, Xmax = 800 m atau maksimum grid",
    formula: "(Xmax - X) / (Xmax - Xmin)",
  },
  jarak_pusat_komersial: {
    functionName: "Fuzzy Linear - Decreasing",
    parameter: "Xmin = 0 m, Xmax = 400 m atau maksimum grid",
    formula: "(Xmax - X) / (Xmax - Xmin)",
  },
  kepadatan_pendidikan: {
    functionName: "Fuzzy Linear - Increasing",
    parameter: "Xmin = 0, Xmax = nilai maksimum grid",
    formula: "(X - Xmin) / (Xmax - Xmin)",
  },
  cahaya_malam: {
    functionName: "Fuzzy Linear - Increasing",
    parameter: "Xmin = nilai minimum raster, Xmax = nilai maksimum raster",
    formula: "(X - Xmin) / (Xmax - Xmin)",
  },
  kepadatan_populasi: {
    functionName: "Fuzzy Linear - Increasing",
    parameter: "Xmin = nilai minimum kelurahan, Xmax = nilai maksimum kelurahan",
    formula: "(X - Xmin) / (Xmax - Xmin)",
  },
  kepadatan_pesaing: {
    functionName: "Fuzzy Near - Optimum",
    parameter: "Xopt = median grid coffee shop eksisting",
    formula: "mendekati Xopt = semakin sesuai",
  },
  jarak_pesaing: {
    functionName: "Fuzzy Near - Optimum",
    parameter: "Xopt = median jarak pesaing coffee shop eksisting",
    formula: "mendekati Xopt = semakin sesuai",
  },
};
