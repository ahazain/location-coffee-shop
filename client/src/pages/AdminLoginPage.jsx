import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Coffee,
  LockKeyhole,
  MapPinned,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Card from "../components/common/Card";
import { authService } from "../services/api";

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "admin@spkkopi.com",
    password: "admin12345",
  });

  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const email = form.email?.trim();
    const password = form.password?.trim();

    if (!email || !password) {
      setErrorMessage("Email dan password wajib diisi.");
      return;
    }

    try {
      const data = await authService.login(email, password);
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_profile", JSON.stringify(data.profile));

      navigate("/admin/datasets");
    } catch (err) {
      setErrorMessage(err.message || "Email atau password salah.");
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f8fafc] lg:grid-cols-[1fr_520px]">
      {/* LEFT BRAND PANEL */}
      <section className="relative hidden overflow-hidden bg-[#1D3557] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#577590]/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <Coffee className="h-6 w-6" />
          </span>

          <div>
            <p className="text-lg font-black tracking-wide">
              Coffee Location
            </p>
            <p className="text-sm text-blue-100/80">
              Admin Management System
            </p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-50 ring-1 ring-white/10">
            Admin Area
          </span>

          <h1 className="mt-5 text-5xl font-black tracking-tight">
            Kelola analisis lokasi coffee shop dari satu panel.
          </h1>

          <p className="mt-5 text-lg leading-8 text-blue-100/80">
            Masuk untuk mengelola dataset, kriteria, indikator, proses fuzzy,
            AHP, WLC, dan preview peta publik.
          </p>

          <div className="mt-8 grid gap-3">
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <MapPinned className="h-5 w-5 text-blue-100" />
              <p className="text-sm font-medium text-blue-50">
                Manajemen data spasial dan analisis rekomendasi lokasi.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <ShieldCheck className="h-5 w-5 text-blue-100" />
              <p className="text-sm font-medium text-blue-50">
                Akses khusus administrator untuk pengelolaan sistem.
              </p>
            </div>
          </div>
        </div>

        <p className="relative text-sm text-blue-100/70">
          Default admin: <span className="font-bold text-white">admin@spkkopi.com</span> /{" "}
          <span className="font-bold text-white">admin12345</span>
        </p>
      </section>

      {/* LOGIN FORM */}
      <section className="flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md rounded-3xl border border-stone-200/60 bg-white p-8 shadow-xs">
          <div className="mb-7">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#577590] ring-1 ring-blue-100/50">
              Admin Login
            </span>

            <h1 className="mt-4 text-3xl font-black text-[#1D3557] tracking-wide">
              Masuk Panel Admin
            </h1>

            <p className="mt-2 text-sm leading-6 text-stone-500">
              Gunakan akun administrator untuk mengakses halaman pengelolaan
              sistem rekomendasi lokasi.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-stone-700">
                Email
              </span>

              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 transition focus-within:border-[#1D3557] focus-within:ring-4 focus-within:ring-blue-50/50">
                <UserRound size={18} className="text-stone-400" />

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      email: event.target.value,
                    })
                  }
                  className="w-full bg-transparent text-sm font-medium text-stone-700 outline-none placeholder:text-stone-400"
                  placeholder="Masukkan email admin"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-stone-700">
                Password
              </span>

              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 transition focus-within:border-[#1D3557] focus-within:ring-4 focus-within:ring-blue-50/50">
                <LockKeyhole size={18} className="text-stone-400" />

                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      password: event.target.value,
                    })
                  }
                  className="w-full bg-transparent text-sm font-medium text-stone-700 outline-none placeholder:text-stone-400"
                  placeholder="Masukkan password"
                />
              </div>
            </label>

            {errorMessage && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1D3557] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-[#2c4c78] active:scale-95 cursor-pointer"
            >
              <ShieldCheck size={16} />
              Masuk Panel Admin
            </button>

            <Link
              to="/"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-stone-600 transition hover:bg-stone-50 active:scale-95"
            >
              <ArrowLeft size={16} />
              Kembali ke Beranda
            </Link>

            <p className="pt-2 text-center text-xs text-stone-500">
              Belum punya akun admin?{" "}
              <Link
                to="/admin/register"
                className="font-bold text-[#1D3557] hover:underline"
              >
                Daftar Admin
              </Link>
            </p>
          </form>
        </Card>
      </section>
    </main>
  );
}
