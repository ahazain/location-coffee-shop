import { Link, NavLink } from "react-router-dom";
import { Coffee, MapPinned } from "lucide-react";
import Button from "../components/common/Button";
import { cn } from "../utils/className";

const navItems = [
  { to: "/", label: "Beranda" },
  { to: "/pembobotan-ahp", label: "Pembobotan AHP" },
  { to: "/peta-rekomendasi", label: "Peta Rekomendasi" },
];

export default function PublicLayout({ children }) {
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-[1000] border-b border-stone-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <span className="rounded-2xl bg-amber-800 p-2 text-white shadow-sm">
              <Coffee size={22} />
            </span>
            <span>
              <span className="block text-sm font-bold text-stone-950">Coffee Location</span>
              <span className="hidden text-xs text-stone-500 sm:block">AHP, WLC, dan WebGIS</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn(
                  "rounded-xl px-4 py-2 text-sm font-semibold transition",
                  isActive ? "bg-amber-50 text-amber-900" : "text-stone-700 hover:bg-stone-100",
                )}
              >
                {item.label}
              </NavLink>
            ))}
            <Button as="link" to="/admin/login" className="px-4 py-2">Admin</Button>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <Button as="link" to="/pembobotan-ahp" variant="secondary" className="hidden sm:inline-flex">
              AHP
            </Button>
            <Button as="link" to="/peta-rekomendasi" className="px-3">
              <MapPinned size={16} /> Peta
            </Button>
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
