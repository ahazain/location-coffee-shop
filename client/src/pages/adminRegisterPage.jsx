import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Coffee,
  IdCard,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";
import Card from "../components/common/Card";
import { authService } from "../services/api";

export default function AdminRegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password.trim();
    const confirmPassword = form.confirmPassword.trim();

    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage("Semua field wajib diisi.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi password tidak sama.");
      return;
    }

    try {
      await authService.register(name, email, password);
      navigate("/admin/login");
    } catch (err) {
      setErrorMessage(err.message || "Registrasi gagal.");
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f8fafc] lg:grid-cols-[1fr_560px]">
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
              Admin Registration
            </p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-50 ring-1 ring-white/10">
            Create Admin Account
          </span>

          <h1 className="mt-5 text-5xl font-black tracking-tight">
            Daftarkan akun admin untuk mengelola sistem.
          </h1>

          <p className="mt-5 text-lg leading-8 text-blue-100/80">
            Halaman ini masih desain frontend. Integrasi register ke backend
            bisa ditambahkan setelah endpoint autentikasi tersedia.
          </p>

          <div className="mt-8 rounded-3xl bg-white/10 p-5 ring-1 ring-white/10">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-blue-100" />
              <p className="text-sm leading-6 text-blue-50">
                Setelah backend auth aktif, akun admin dapat diverifikasi dan
                digunakan untuk mengakses panel administrasi.
              </p>
            </div>
          </div>
        </div>

        <p className="relative text-sm text-blue-100/70">
          Pastikan akun admin hanya diberikan kepada pengelola sistem.
        </p>
      </section>

      {/* REGISTER FORM */}
      <section className="flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md rounded-3xl border border-stone-200/60 bg-white p-8 shadow-xs">
          <div className="mb-7">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#577590] ring-1 ring-blue-100/50">
              Admin Register
            </span>

            <h1 className="mt-4 text-3xl font-black text-[#1D3557] tracking-wide">
              Daftar Admin
            </h1>

            <p className="mt-2 text-sm leading-6 text-stone-500">
              Buat akun administrator baru untuk mengakses panel pengelolaan
              data dan analisis lokasi.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-stone-700">
                Nama Lengkap
              </span>

              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 transition focus-within:border-[#1D3557] focus-within:ring-4 focus-within:ring-blue-50/50">
                <IdCard size={18} className="text-stone-400" />

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                  className="w-full bg-transparent text-sm font-medium text-stone-700 outline-none placeholder:text-stone-400"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-stone-700">
                Email
              </span>

              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 transition focus-within:border-[#1D3557] focus-within:ring-4 focus-within:ring-blue-50/50">
                <Mail size={18} className="text-stone-400" />

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
                  placeholder="Masukkan email"
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

            <label className="block">
              <span className="text-sm font-semibold text-stone-700">
                Konfirmasi Password
              </span>

              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 transition focus-within:border-[#1D3557] focus-within:ring-4 focus-within:ring-blue-50/50">
                <LockKeyhole size={18} className="text-stone-400" />

                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      confirmPassword: event.target.value,
                    })
                  }
                  className="w-full bg-transparent text-sm font-medium text-stone-700 outline-none placeholder:text-stone-400"
                  placeholder="Ulangi password"
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
              <UserPlus size={16} />
              Daftar Admin
            </button>

            <Link
              to="/admin/login"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-stone-600 transition hover:bg-stone-50 active:scale-95"
            >
              <ArrowLeft size={16} />
              Kembali ke Login
            </Link>

            <p className="pt-2 text-center text-xs text-stone-500">
              Sudah punya akun?{" "}
              <Link
                to="/admin/login"
                className="font-bold text-[#1D3557] hover:underline"
              >
                Masuk Admin
              </Link>
            </p>
          </form>
        </Card>
      </section>
    </main>
  );
}
