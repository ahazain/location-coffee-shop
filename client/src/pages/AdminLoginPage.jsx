import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, LockKeyhole, UserRound } from "lucide-react";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "admin", password: "admin123" });
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const username = form.username?.trim();
    const password = form.password?.trim();

    if (!username || !password) {
      setErrorMessage("Username dan password wajib diisi.");
      return;
    }

    if (username === "admin" && password === "admin123") {
      localStorage.setItem("admin_token", "dummy-admin-token");
      localStorage.setItem("admin_profile", JSON.stringify({
        name: "Admin Sistem Lokasi Coffee Shop",
        role: "Administrator",
      }));
      navigate("/admin/dashboard");
    } else {
      setErrorMessage("Username atau password salah.");
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f8f5f0] lg:grid-cols-[1fr_520px]">
      <section className="relative hidden overflow-hidden bg-stone-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-600/30 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="rounded-2xl bg-amber-700 p-3"><Coffee /></span>
          <div>
            <p className="text-lg font-bold">Coffee Location</p>
            <p className="text-sm text-stone-300">Admin Front End</p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <Badge variant="amber">Dummy auth</Badge>
          <h1 className="mt-5 text-5xl font-black tracking-tight">Kelola dataset lokasi kedai kopi dari satu dashboard.</h1>
          <p className="mt-5 text-lg leading-8 text-stone-300">
            Login ini masih dummy. Setelah front end selesai, autentikasi akan diganti dengan API backend.
          </p>
        </div>

        <p className="relative text-sm text-stone-400">Default demo: admin / admin123</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md p-8">
          <Badge>Admin area</Badge>
          <h1 className="mt-4 text-3xl font-black text-stone-950">Login Admin</h1>
          <p className="mt-2 text-sm leading-6 text-stone-500">Masuk untuk mengelola dataset, indikator, bobot, dan preview peta publik.</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-stone-700">Username</span>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-stone-300 bg-white px-4 py-3 focus-within:border-amber-700">
                <UserRound size={18} className="text-stone-400" />
                <input
                  type="text"
                  value={form.username}
                  onChange={(event) => setForm({ ...form, username: event.target.value })}
                  className="w-full bg-transparent outline-none"
                  placeholder="admin"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-stone-700">Password</span>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-stone-300 bg-white px-4 py-3 focus-within:border-amber-700">
                <LockKeyhole size={18} className="text-stone-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  className="w-full bg-transparent outline-none"
                  placeholder="••••••••"
                />
              </div>
            </label>

            {errorMessage && <p className="rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700">{errorMessage}</p>}

            <Button type="submit" className="w-full py-3">Masuk Dashboard</Button>
            <Button as="link" to="/" variant="ghost" className="w-full">Kembali ke Beranda</Button>
          </form>
        </Card>
      </section>
    </main>
  );
}
