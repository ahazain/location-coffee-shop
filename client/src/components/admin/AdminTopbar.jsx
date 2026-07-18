import { useLocation } from "react-router-dom";

const pageTitles = {
  // "/admin/dashboard": {
  //   title: "Dashboard",
  //   subtitle: "Ringkasan data dan aktivitas analisis.",
  // },
  "/admin/datasets": {
    title: "Unggah Data",
    subtitle: "Manajemen dan pembaharuan indikator operasional perusahaan.",
  },
  "/admin/kriteria": {
    title: "Data Kriteria",
    subtitle: "Kelola data kriteria untuk analisis AHP dan WLC.",
  },
  "/admin/indicators": {
    title: "Data Indikator",
    subtitle: "Kelola indikator penilaian untuk proses fuzzy dan WLC.",
  },
  "/admin/fuzzy": {
    title: "Proses Fuzzy",
    subtitle: "Kelola proses fuzzifikasi data indikator spasial.",
  },
  "/admin/ahp": {
    title: "AHP Responden",
    subtitle: "Kelola bobot kriteria berdasarkan hasil responden.",
  },
  "/admin/wlc": {
    title: "Hitung WLC",
    subtitle: "Proses perhitungan Weighted Linear Combination.",
  },
  "/admin/map-preview": {
    title: "Preview & Publish",
    subtitle: "Pratinjau hasil analisis spasial sebelum dipublikasikan.",
  },
};

export default function AdminTopbar() {
  const location = useLocation();

  const currentPage = pageTitles[location.pathname] || {
    title: "Manajemen Data",
    subtitle: "Panel administrasi analisis lokasi.",
  };

  return (
    <header className="border-b border-stone-200 bg-white/95 backdrop-blur px-6 py-5 shadow-xs">
      <div>
        <h1 className="text-lg font-extrabold text-[#1D3557] tracking-wide">
          {currentPage.title}
        </h1>
        <p className="mt-1 text-xs font-medium text-stone-500">
          {currentPage.subtitle}
        </p>
      </div>
    </header>
  );
}