import { Link, useLocation } from "react-router-dom";
import { LogOut, Map } from "lucide-react";
import Button from "../common/Button";

const titleByPath = {
  "/admin/dashboard": "Dashboard Admin",
  "/admin/indicators": "Kelola Indikator",
  "/admin/datasets": "Kelola Dataset",
  "/admin/fuzzy": "Normalisasi Fuzzy Otomatis",
  "/admin/ahp": "Pembobotan AHP Default",
  "/admin/wlc": "Perhitungan WLC",
  "/admin/map-preview": "Preview Peta Publik",
};

export default function AdminTopbar() {
  const location = useLocation();

  function handleLogout() {
    localStorage.removeItem("admin_token");
  }

  return (
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Admin</p>
          <h1 className="text-lg font-bold text-stone-950">{titleByPath[location.pathname] || "Admin"}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button as="link" to="/map" variant="secondary" className="hidden md:inline-flex">
            <Map size={16} /> Lihat Peta
          </Button>
          <Link
            to="/admin/login"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl bg-stone-100 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-200"
          >
            <LogOut size={16} /> Keluar
          </Link>
        </div>
      </div>
    </header>
  );
}
