import { Link, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, BrainCircuit, Calculator, MapPinned, Settings, Sigma, Menu, UploadCloud, ListTree, LogOut, CheckSquare } from "lucide-react";
import { cn } from "../../utils/className";

const navItems = [
  { label: "Kriteria", to: "/admin/kriteria", icon: ListTree },
  { label: "Indikator", to: "/admin/indicators", icon: BarChart3 },
  { label: "Dataset", to: "/admin/datasets", icon: UploadCloud },
  { label: "Proses Fuzzy", to: "/admin/fuzzy", icon: Sigma },
  { label: "AHP Responden", to: "/admin/ahp", icon: BrainCircuit },
  { label: "Hitung WLC", to: "/admin/wlc", icon: Calculator },
  { label: "Preview & Publish", to: "/admin/map-preview", icon: MapPinned },
  { label: "Peta 10 Terbaik", to: "/admin/top-10-map", icon: MapPinned },
  { label: "Validasi Spasial", to: "/admin/validation", icon: CheckSquare },
];

export default function AdminSidebar({ isCollapsed, onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_profile");
    navigate("/admin/login");
  };

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 border-r border-stone-200/10 bg-[#1D3557] px-4 py-5 text-white lg:block transition-all duration-300",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 justify-center">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-xl bg-[#577590] p-2 text-white shrink-0 hover:bg-[#6c8ca8] transition active:scale-95 cursor-pointer flex items-center justify-center shadow-xs"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu size={20} />
        </button>
        {!isCollapsed && (
          <span className="animate-fadeIn">
            <span className="block text-sm font-bold tracking-wide">Coffee Location</span>
            <span className="block text-xs text-stone-300">Admin Analisis</span>
          </span>
        )}
      </div>

      <nav className="mt-8 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition justify-center lg:justify-start",
                isActive
                  ? "bg-[#577590] text-white shadow-md border border-white/10"
                  : "text-stone-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!isCollapsed && <span className="animate-fadeIn">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-5 left-4 right-4">
        <button
          type="button"
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-stone-300 transition hover:bg-red-500/10 hover:text-red-400 cursor-pointer justify-center lg:justify-start",
            "border border-white/10 bg-white/5"
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && <span className="animate-fadeIn">Logout</span>}
        </button>
      </div>
    </aside>
  );
}