import { Link, useLocation } from "react-router-dom";
import { BarChart3, BrainCircuit, Calculator, LayoutDashboard, MapPinned, Settings, Sigma, Store, UploadCloud, ListTree } from "lucide-react";
import { cn } from "../../utils/className";

const navItems = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Input Dataset", to: "/admin/datasets", icon: UploadCloud },
  { label: "Kriteria", to: "/admin/kriteria", icon: ListTree },
  { label: "Indikator", to: "/admin/indicators", icon: BarChart3 },
  { label: "Proses Fuzzy", to: "/admin/fuzzy", icon: Sigma },
  { label: "AHP Responden", to: "/admin/ahp", icon: BrainCircuit },
  { label: "Hitung WLC", to: "/admin/wlc", icon: Calculator },
  { label: "Preview & Publish", to: "/admin/map-preview", icon: MapPinned },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-stone-200 bg-stone-950 px-4 py-5 text-white lg:block">
      <Link to="/" className="flex items-center gap-3 rounded-3xl bg-white/10 p-3">
        <span className="rounded-2xl bg-amber-700 p-2 text-white">
          <Store size={22} />
        </span>
        <span>
          <span className="block text-sm font-bold">Coffee Location</span>
          <span className="block text-xs text-stone-300">Admin Analisis</span>
        </span>
      </Link>

      <nav className="mt-8 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                isActive ? "bg-amber-700 text-white" : "text-stone-300 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-5 left-4 right-4 rounded-3xl bg-white/10 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Settings size={16} />
          Alur proposal
        </div>
        <p className="mt-2 text-xs leading-5 text-stone-300">
          Input dataset → fuzzy ulang layer terdampak → AHP default/responden → WLC ulang → preview & publish.
        </p>
      </div>
    </aside>
  );
}
