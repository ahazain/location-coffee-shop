import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, 
  RefreshCw, 
  ArrowLeft, 
  HelpCircle, 
  ShieldAlert, 
  Layers, 
  User, 
  Lock, 
  AlertTriangle,
  FileWarning
} from "lucide-react";

export default function ErrorPage({ code: propCode }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine error code from prop, state, or path
  let code = propCode;
  if (!code) {
    const path = location.pathname;
    if (path.includes("/400")) code = 400;
    else if (path.includes("/401")) code = 401;
    else if (path.includes("/403")) code = 403;
    else code = 404; // default to 404
  }

  // Define details for each error code
  const errorConfig = {
    400: {
      statusText: "400 BAD REQUEST",
      title: "Permintaan Tidak Valid",
      subtitle: "Sistem mengalami kendala saat memproses data koordinat atau permintaan Anda.",
      description: "Kesalahan sintaks pada parameter spatial query atau timeout data stream.",
      category: "Data Input",
      errorCode: "0X400_BAD_SPATIAL_PARAMS",
      themeColor: "amber",
      illustration: (
        <svg viewBox="0 0 400 300" className="w-full h-full max-h-[260px] animate-float">
          {/* Grid Background */}
          <g stroke="#e2e8f0" strokeWidth="1" strokeDasharray="5,5">
            <line x1="50" y1="50" x2="350" y2="50" />
            <line x1="50" y1="120" x2="350" y2="120" />
            <line x1="50" y1="190" x2="350" y2="190" />
            <line x1="50" y1="260" x2="350" y2="260" />
            <line x1="100" y1="30" x2="100" y2="270" />
            <line x1="200" y1="30" x2="200" y2="270" />
            <line x1="300" y1="30" x2="300" y2="270" />
          </g>

          {/* Perspective Map Base */}
          <path d="M 80,180 L 200,60 L 320,180 L 200,260 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="3" />
          <path d="M 80,180 L 200,210 L 320,180" fill="none" stroke="#cbd5e1" strokeWidth="2" />
          <path d="M 200,60 L 200,210" fill="none" stroke="#cbd5e1" strokeWidth="2" />
          
          {/* Map contours and roads */}
          <path d="M 120,140 Q 150,110 210,130 T 290,120" fill="none" stroke="#334155" strokeWidth="4" />
          <path d="M 100,200 Q 180,170 200,240" fill="none" stroke="#0f172a" strokeWidth="5" />
          
          {/* Coffee Shop Pins */}
          <circle cx="160" cy="120" r="6" fill="#cbd5e1" />
          <circle cx="260" cy="150" r="6" fill="#cbd5e1" />
          
          {/* Spilled Coffee Stain (Trouble Area) */}
          <ellipse cx="200" cy="180" rx="35" ry="15" fill="#78350f" fillOpacity="0.15" />
          <ellipse cx="202" cy="182" rx="20" ry="8" fill="#78350f" fillOpacity="0.25" />

          {/* Warning sign floating above */}
          <g className="hover-shake cursor-pointer">
            <polygon points="200,80 230,135 170,135" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
            <line x1="200" y1="98" x2="200" y2="120" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
            <circle cx="200" cy="128" r="3" fill="#ffffff" />
          </g>
          
          {/* Badge */}
          <rect x="120" y="215" width="160" height="30" rx="8" fill="#1e293b" />
          <text x="200" y="234" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle" letterSpacing="1">
            400 BAD REQUEST
          </text>
        </svg>
      )
    },
    401: {
      statusText: "401 UNAUTHORIZED",
      title: "Sesi Tidak Valid",
      subtitle: "Maaf, identitas Anda tidak dikenali atau sesi Anda telah berakhir. Silakan kembali ke halaman utama untuk masuk kembali ke sistem.",
      description: "Akses ditolak karena token otentikasi tidak valid atau sudah kedaluwarsa.",
      category: "Kredensial",
      errorCode: "0X401_AUTH_EXPIRED",
      themeColor: "rose",
      illustration: (
        <svg viewBox="0 0 400 300" className="w-full h-full max-h-[260px] animate-float">
          {/* Kiosk base */}
          <rect x="150" y="80" width="100" height="150" rx="10" fill="#0f172a" />
          <rect x="160" y="90" width="80" height="70" rx="6" fill="#1e293b" />
          
          {/* Screen elements */}
          <circle cx="200" cy="125" r="18" fill="#e11d48" fillOpacity="0.2" />
          <text x="200" y="132" fill="#e11d48" fontSize="24" fontWeight="bold" textAnchor="middle">?</text>
          
          {/* Wifi antenna signal */}
          <path d="M 180,60 Q 200,45 220,60" fill="none" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" strokeDasharray="3,3" />
          <path d="M 170,50 Q 200,30 230,50" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />

          {/* Kiosk stand */}
          <path d="M 140,230 L 260,230 L 240,250 L 160,250 Z" fill="#334155" />

          {/* User Silhouette standing in front */}
          <g opacity="0.85">
            {/* Head */}
            <circle cx="110" cy="140" r="12" fill="#475569" />
            {/* Body */}
            <path d="M 90,165 Q 110,155 130,165 L 125,230 L 95,230 Z" fill="#334155" />
          </g>

          {/* Badge */}
          <rect x="110" y="200" width="180" height="30" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <text x="200" y="218" fill="#0f172a" fontSize="11" fontWeight="bold" textAnchor="middle">
            <tspan fill="#e11d48">401</tspan> Unauthorized
          </text>
          <text x="200" y="240" fill="#64748b" fontSize="9" textAnchor="middle">Access Denied</text>
        </svg>
      )
    },
    403: {
      statusText: "403 FORBIDDEN",
      title: "Akses Dibatasi",
      subtitle: "Anda tidak memiliki izin untuk mengakses data spasial di lapisan ini. Silakan hubungi administrator sistem jika Anda merasa ini adalah kesalahan.",
      description: "Kebijakan keamanan sistem membatasi pengguna umum mengakses lapisan analisis WLC tingkat lanjut.",
      category: "Hak Akses",
      errorCode: "0X403_RESTRICTED_LAYER",
      themeColor: "indigo",
      illustration: (
        <svg viewBox="0 0 400 300" className="w-full h-full max-h-[260px] animate-float">
          {/* Secure folder outline */}
          <path d="M 120,90 L 170,90 L 190,110 L 280,110 A 10,10 0 0 1 290,120 L 290,210 A 10,10 0 0 1 280,220 L 120,220 A 10,10 0 0 1 110,210 L 110,100 A 10,10 0 0 1 120,90 Z" fill="#0f172a" />
          <path d="M 125,120 L 275,120 L 275,205 L 125,205 Z" fill="#1e293b" />
          
          {/* Map/Contours representation inside folder */}
          <path d="M 140,140 Q 180,180 220,130 T 260,175" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="4,2" />
          <circle cx="180" cy="155" r="5" fill="#6366f1" />
          <circle cx="230" cy="145" r="4" fill="#818cf8" />

          {/* Shield/Lock in front */}
          <g className="hover-pulse cursor-pointer">
            <circle cx="200" cy="170" r="28" fill="#0f172a" stroke="#6366f1" strokeWidth="3" />
            {/* Lock symbol */}
            <rect x="190" y="165" width="20" height="15" rx="3" fill="#6366f1" />
            <path d="M 194,165 L 194,158 A 6,6 0 0 1 206,158 L 206,165" fill="none" stroke="#6366f1" strokeWidth="2.5" />
          </g>

          {/* Broken Key on floor */}
          <g transform="translate(240, 210) rotate(25)">
            <circle cx="10" cy="10" r="6" fill="none" stroke="#cbd5e1" strokeWidth="2.5" />
            <line x1="16" y1="10" x2="35" y2="10" stroke="#cbd5e1" strokeWidth="2.5" />
            <line x1="30" y1="10" x2="30" y2="15" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="35" y1="10" x2="35" y2="15" stroke="#cbd5e1" strokeWidth="2" />
            {/* Cut line showing key is broken */}
            <line x1="22" y1="5" x2="26" y2="15" stroke="#0f172a" strokeWidth="2" />
          </g>

          {/* Badge */}
          <rect x="135" y="65" width="130" height="22" rx="6" fill="#fee2e2" />
          <text x="200" y="79" fill="#ef4444" fontSize="10" fontWeight="extrabold" textAnchor="middle" letterSpacing="1.5">
            403 FORBIDDEN
          </text>
        </svg>
      )
    },
    404: {
      statusText: "404 NOT FOUND",
      title: "Halaman Tidak Ditemukan",
      subtitle: "Maaf, lokasi atau halaman yang Anda cari tidak dapat ditemukan di dalam sistem. Pastikan koordinat atau URL yang Anda masukkan sudah benar.",
      description: "ERROR CODE: 0X404_LOCATION_UNDETERMINED",
      category: "Navigasi",
      errorCode: "0X404_NOT_FOUND",
      themeColor: "indigo",
      illustration: (
        <svg viewBox="0 0 400 300" className="w-full h-full max-h-[260px] animate-float">
          {/* Grid lines */}
          <g stroke="#cbd5e1" strokeWidth="0.75" strokeDasharray="4,4">
            <line x1="40" y1="60" x2="360" y2="60" />
            <line x1="40" y1="130" x2="360" y2="130" />
            <line x1="40" y1="200" x2="360" y2="200" />
            <line x1="40" y1="270" x2="360" y2="270" />
            <line x1="90" y1="40" x2="90" y2="280" />
            <line x1="180" y1="40" x2="180" y2="280" />
            <line x1="270" y1="40" x2="270" y2="280" />
          </g>

          {/* Isometric map board */}
          <polygon points="200,60 320,130 200,200 80,130" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2.5" />
          
          {/* Missing site target circle (radar) */}
          <ellipse cx="200" cy="130" rx="30" ry="15" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4,2" />
          <ellipse cx="200" cy="130" rx="10" ry="5" fill="#6366f1" fillOpacity="0.15" />
          
          {/* Cracked/broken map pin */}
          <g transform="translate(182, 60)" className="hover-shake cursor-pointer">
            <path d="M18,40 C5,27 0,18 0,12 A12,12 0 0,1 24,12 C24,18 19,27 18,40 Z" fill="#475569" opacity="0.9" />
            <circle cx="12" cy="12" r="5" fill="#ffffff" />
            {/* Crack lines on pin */}
            <path d="M 6,10 L 12,14 L 18,9" fill="none" stroke="#0f172a" strokeWidth="1.5" />
          </g>

          {/* Magnifying glass checking the empty spot */}
          <g transform="translate(190, 110)" className="hover-pulse">
            {/* Handle */}
            <line x1="32" y1="32" x2="65" y2="65" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
            <line x1="32" y1="32" x2="65" y2="65" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
            {/* Rim */}
            <circle cx="20" cy="20" r="22" fill="none" stroke="#334155" strokeWidth="5" />
            <circle cx="20" cy="20" r="22" fill="none" stroke="#cbd5e1" strokeWidth="2" />
            {/* Lens Reflection */}
            <path d="M 5,10 A 18,18 0 0,1 30,10" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </g>

          {/* Floating Coffee Bean symbol next to search area */}
          <path d="M 120,150 Q 110,135 125,125 T 140,140 Z" fill="#78350f" opacity="0.75" />
          <line x1="120" y1="150" x2="140" y2="140" stroke="#451a03" strokeWidth="1" />

          {/* Badge */}
          <rect x="110" y="215" width="180" height="36" rx="8" fill="#0f172a" />
          <text x="200" y="232" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle" letterSpacing="1">
            404 ERROR:
          </text>
          <text x="200" y="244" fill="#cbd5e1" fontSize="9" fontWeight="medium" textAnchor="middle" letterSpacing="0.5">
            LOCATION NOT FOUND
          </text>
        </svg>
      )
    }
  };

  const currentError = errorConfig[code] || errorConfig[404];

  // Specific buttons for each page type
  const renderActions = () => {
    switch (code) {
      case 400:
        return (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-slate-800 active:scale-95 cursor-pointer"
            >
              <RefreshCw size={14} className="animate-spin-slow" /> Coba Lagi
            </button>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-stone-600 shadow-xs transition hover:bg-stone-50 active:scale-95 cursor-pointer"
            >
              Hubungi Bantuan
            </button>
          </div>
        );
      case 401:
        return (
          <div className="mt-8 flex flex-col items-center gap-4">
            <button
              onClick={() => navigate("/admin/login")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-slate-800 active:scale-95 cursor-pointer w-full max-w-xs"
            >
              <Home size={15} /> Kembali ke Beranda / Login
            </button>
            <div className="flex gap-4 text-xs font-bold text-stone-400 uppercase tracking-wider">
              <button onClick={() => navigate("/")} className="hover:text-stone-600 transition cursor-pointer">Hubungi Dukungan</button>
              <span className="text-stone-200">|</span>
              <button onClick={() => window.location.reload()} className="hover:text-stone-600 transition flex items-center gap-1 cursor-pointer">
                <RefreshCw size={12} /> Coba Lagi
              </button>
            </div>
          </div>
        );
      case 403:
        return (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-slate-800 active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={15} /> Kembali ke Beranda
            </button>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-stone-600 shadow-xs transition hover:bg-stone-50 active:scale-95 cursor-pointer"
            >
              Laporkan Masalah
            </button>
          </div>
        );
      case 404:
      default:
        return (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-slate-800 active:scale-95 cursor-pointer"
            >
              <Home size={14} /> Kembali ke Beranda
            </button>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-stone-600 shadow-xs transition hover:bg-stone-50 active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={14} /> Halaman Sebelumnya
            </button>
          </div>
        );
    }
  };

  // Additional detail panels based on code
  const renderDetailPanel = () => {
    if (code === 400) {
      return (
        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 text-left max-w-md mx-auto">
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-800 uppercase tracking-wider">
            <HelpCircle size={14} /> Detail Teknis
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Kode Error</p>
              <p className="mt-0.5 text-sm font-black text-rose-600">400</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Kategori</p>
              <p className="mt-0.5 text-sm font-extrabold text-[#1d3557]">Data Input</p>
            </div>
          </div>
          <p className="mt-3 text-xs font-medium leading-relaxed text-stone-500 border-t border-blue-100/50 pt-3">
            {currentError.description}
          </p>
        </div>
      );
    }

    if (code === 403) {
      return (
        <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg mx-auto">
          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4 text-center">
            <span className="inline-flex rounded-xl bg-blue-50 p-2 text-[#577590] border border-blue-100/50 mb-2">
              <ShieldAlert size={16} />
            </span>
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Keamanan</p>
            <p className="mt-1 text-xs font-extrabold text-stone-700">Enkripsi Berlapis</p>
          </div>
          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4 text-center">
            <span className="inline-flex rounded-xl bg-blue-50 p-2 text-[#577590] border border-blue-100/50 mb-2">
              <Layers size={16} />
            </span>
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Lapisan Data</p>
            <p className="mt-1 text-xs font-extrabold text-stone-700">Coffee Shop SDSS Map</p>
          </div>
          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4 text-center">
            <span className="inline-flex rounded-xl bg-blue-50 p-2 text-[#577590] border border-blue-100/50 mb-2">
              <User size={16} />
            </span>
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Role Saat Ini</p>
            <p className="mt-1 text-xs font-extrabold text-stone-700">Tamu (Read-only)</p>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-4 py-1.5 text-[9px] font-bold uppercase tracking-wider text-stone-400">
          <HelpCircle size={10} strokeWidth={3} /> {currentError.description}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50/50 flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/20 rounded-full blur-3xl" />

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-xl text-center fade-in bg-white/70 backdrop-blur-md border border-stone-200/40 rounded-3xl p-6 sm:p-10 shadow-sm relative z-10">
          
          {/* Interactive Illustration */}
          <div className="flex justify-center mb-6">
            {currentError.illustration}
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1d3557]">
            {currentError.title}
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-sm font-medium leading-relaxed text-stone-500 max-w-md mx-auto">
            {currentError.subtitle}
          </p>

          {/* Actions */}
          {renderActions()}

          {/* Technical Info Panel */}
          {renderDetailPanel()}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-stone-200/50 text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-white/30 backdrop-blur-sm relative z-10">
        © 2026 WEBGIS COFFEE SHOP LOCATION. SEMUA HAK DILINDUNGI.
      </footer>
    </div>
  );
}
