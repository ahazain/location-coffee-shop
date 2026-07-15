import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, AlertTriangle, Info, MapPin, Calculator, ShieldAlert, FileText, ChevronRight } from "lucide-react";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import AdminLayout from "../layouts/AdminLayout";
import ValidationMapView from "../components/map/ValidationMapView";
import { wlcService } from "../services/api/wlcService";
import { getSuitabilityColor } from "../utils/mapStyle";
import GridDetailPanel from "../components/map/GridDetailPanel";

export default function AdminValidationPage() {
  const [gridGeojson, setGridGeojson] = useState(null);
  const [boundaryGeojson, setBoundaryGeojson] = useState(null);
  const [coffeePoints, setCoffeePoints] = useState(null);
  const [validationStats, setValidationStats] = useState(null);
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSampleTab, setActiveSampleTab] = useState("kepadatan_tinggi");

  async function loadValidationData() {
    try {
      setLoading(true);
      setError(null);

      // Ambil seluruh data spasial dan stats secara paralel
      const [grids, points, stats, boundary] = await Promise.all([
        wlcService.getGrids(),
        wlcService.getValidationPoints(),
        wlcService.getValidationStats(),
        wlcService.getBoundary().catch(() => null)
      ]);

      setGridGeojson(grids);
      setCoffeePoints(points);
      setValidationStats(stats);
      setBoundaryGeojson(boundary);
      
      // Pilih default grid pertama dari sampel jika ada
      if (stats?.sampel_grid?.kepadatan_tinggi?.length > 0) {
        setSelectedGrid(stats.sampel_grid.kepadatan_tinggi[0]);
      }
    } catch (err) {
      console.error("Gagal memuat data validasi:", err);
      setError(err.message || "Terjadi kesalahan saat memuat data validasi spasial.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadValidationData();
  }, []);

  // Hitung persentase kecocokan model (Sesuai + Cukup Sesuai)
  const matchingStats = validationStats?.sebaran_kelas?.reduce((acc, item) => {
    if (item.kelas_kesesuaian === "Sesuai" || item.kelas_kesesuaian === "Cukup Sesuai") {
      acc.jumlah += item.jumlah;
      acc.persentase += item.persentase;
    }
    return acc;
  }, { jumlah: 0, persentase: 0 }) || { jumlah: 0, persentase: 0 };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-stone-500">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-stone-300 border-t-[#1D3557]"></div>
          <p className="font-semibold text-sm">Memproses overlay spasial PostGIS & data lapangan...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    const isWlcMissing = error.includes("belum ditemukan") || error.includes("jalankan kalkulasi");

    return (
      <AdminLayout>
        <Card className="mx-auto max-w-2xl p-8 text-center shadow-lg border border-red-100">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 mb-6">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-bold text-stone-900">Validasi Spasial Tertunda</h3>
          <p className="mt-3 text-sm text-stone-500 leading-relaxed">
            {error}
          </p>
          {isWlcMissing ? (
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button as="link" to="/admin/wlc">
                <Calculator size={16} /> Pergi ke Hitung WLC
              </Button>
              <Button onClick={loadValidationData} variant="secondary">Coba Muat Ulang</Button>
            </div>
          ) : (
            <div className="mt-8">
              <Button onClick={loadValidationData}>Coba Muat Ulang</Button>
            </div>
          )}
        </Card>
      </AdminLayout>
    );
  }

  // Helper untuk merender detail indikator dalam panel samping
  const renderIndicatorScore = (key, value, unit) => {
    return (
      <div className="flex justify-between py-1.5 border-b border-stone-100 text-xs" key={key}>
        <span className="text-stone-500 capitalize">{key.replace(/_/g, " ")}</span>
        <span className="font-mono font-bold text-stone-900">{value} <span className="text-[10px] text-stone-400 font-normal">{unit}</span></span>
      </div>
    );
  };

  const formatGridForDetail = (grid) => {
    if (!grid) return null;
    return {
      gridCode: grid.kode_grid || grid.gridCode,
      suitabilityClass: grid.kelas_kesesuaian || grid.suitabilityClass,
      kecamatan: grid.kecamatan,
      kelurahan: grid.kelurahan,
      scoreDefault: grid.skor_wlc ?? grid.scoreDefault,
      indicatorScores: grid.nilai_indikator || grid.indicatorScores
    };
  };

  return (
    <AdminLayout>
      {/* 1. Header Section */}
      <Card className="mb-6 p-6 shadow-sm border border-stone-200/50 bg-white">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="success">Akurasi Model</Badge>
              <span className="text-xs text-stone-400">EPSG:32749 & EPSG:4326</span>
            </div>
            <h2 className="mt-3 text-2xl font-black text-stone-900">Validasi Spasial Kesesuaian Lahan</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-500 max-w-3xl">
              Validasi spasial dilakukan untuk memeriksa apakah skor dan kelas kesesuaian hasil WLC sudah mencerminkan kondisi keruangan yang logis di wilayah studi. Proses ini dilakukan dengan menjadikan kepadatan coffee shop eksisting sebagai acuan pembanding, karena keberadaan coffee shop yang sudah berdiri dan beroperasi dapat dianggap sebagai representasi lokasi yang secara nyata sudah dipilih dan berjalan di lapangan.
            </p>
          </div>
          <div className="shrink-0">
            <Button onClick={loadValidationData} variant="secondary" size="sm">Muat Ulang Analisis</Button>
          </div>
        </div>
      </Card>

      {/* 2. KPI Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* KPI 1: Akurasi Kecocokan */}
        <Card className="p-5 border border-stone-200/60 shadow-sm relative overflow-hidden bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Akurasi Sebaran Model</span>
            <div className="rounded-xl bg-green-50 p-2 text-green-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-900">{matchingStats.persentase.toFixed(2)}%</span>
            <span className="text-xs text-stone-500">({matchingStats.jumlah} / 22 outlet)</span>
          </div>
          <p className="mt-2 text-xs text-stone-400 leading-relaxed">
            Persentase kedai kopi eksisting yang sukses berada di zona yang dinilai <strong>Sesuai</strong> atau <strong>Cukup Sesuai</strong> oleh model WLC.
          </p>
        </Card>

        {/* KPI 2: Pelanggaran Area Constraint */}
        <Card className="p-5 border border-stone-200/60 shadow-sm relative overflow-hidden bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Tingkat Pelanggaran Constraint</span>
            <div className="rounded-xl bg-red-50 p-2 text-red-600">
              <ShieldAlert size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-red-600">{validationStats?.pelanggaran_constraint?.persentase_pelanggaran}%</span>
            <span className="text-xs text-stone-500">({validationStats?.pelanggaran_constraint?.total_pelanggaran} / 22 outlet)</span>
          </div>
          <p className="mt-2 text-xs text-stone-400 leading-relaxed">
            Jumlah kedai kopi eksisting yang berdiri di atas wilayah pembatas (Sawah Irigasi atau Sempadan Sungai).
          </p>
        </Card>

        {/* KPI 3: Run Metadata */}
        <Card className="p-5 border border-stone-200/60 shadow-sm relative overflow-hidden bg-white sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Hasil Analisis WLC</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <FileText size={20} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-base font-bold text-stone-900">{validationStats?.runInfo?.nama_run}</span>
            <span className="ml-2 rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-600">v{validationStats?.runInfo?.versi}</span>
          </div>
          <div className="mt-2 text-xs text-stone-400 leading-relaxed">
            Tanggal perhitungan WLC: <br/>
            <span className="font-mono text-stone-500">{new Date(validationStats?.runInfo?.tanggal_hitung).toLocaleString("id-ID")}</span>
          </div>
        </Card>
      </div>

      {/* 3. Main Map and Panel Layout */}
      <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Map Container */}
        <div className="h-[60vh] lg:h-[68vh] overflow-hidden rounded-3xl border border-stone-200 bg-white p-2 shadow-sm relative">
          <ValidationMapView 
            gridGeojson={gridGeojson}
            coffeePointsGeojson={coffeePoints}
            boundaryGeojson={boundaryGeojson}
            selectedGridCode={selectedGrid?.kode_grid}
            onSelectGrid={(props) => {
              // Format properti dari GeoJSON agar sesuai dengan objek selectedGrid
              setSelectedGrid({
                kode_grid: props.gridCode,
                kecamatan: props.kecamatan,
                kelurahan: props.kelurahan,
                skor_wlc: props.scoreDefault,
                kelas_kesesuaian: props.suitabilityClass,
                nilai_indikator: props.indicatorScores,
                jumlah_coffee_shop: coffeePoints?.features?.filter(f => {
                  // Secara visual, MapView mengurus popup, ini sebagai fallback detail panel
                  return false; // update manual via popup click atau tabel
                }).length || 0
              });
            }}
          />
        </div>

        {/* Right Details Panel */}
        <aside className="space-y-4">
          {/* Petunjuk Inspeksi */}
          <Card className="p-5 border border-stone-200/50 bg-white shadow-sm">
            <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3">Petunjuk Inspeksi Spasial</h3>
            <div className="mt-4 text-xs text-stone-500 leading-relaxed space-y-2">
              <p>
                1. Klik salah satu sel grid di peta atau klik tombol <strong>Audit</strong> pada tabel sampel di bawah.
              </p>
              <p>
                2. Detail lengkap indikator raw dan fuzzy akan ditampilkan pada <strong>Panel Rinci Inspeksi</strong> di bagian bawah halaman.
              </p>
              <p>
                3. Bandingkan kesesuaian nilai WLC dengan sebaran kedai kopi lapangan secara langsung.
              </p>
            </div>
          </Card>
        </aside>
      </div>

      {/* Detail Inspeksi Lengkap */}
      <div className="mb-6">
        <GridDetailPanel selectedGrid={formatGridForDetail(selectedGrid)} />
      </div>

      {/* 4. Representative Sample Grid Audit Cards */}
      <Card className="p-6 border border-stone-200/50 bg-white shadow-sm">
        <div>
          <h3 className="text-base font-bold text-stone-900">Audit Sampel Grid Wilayah</h3>
          <p className="text-xs text-stone-400 mt-1">Pilih salah satu grid sampel audit di bawah ini untuk melihat detail kecocokan parameter spasial di lapangan.</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              key: "kepadatan_tinggi",
              label: "Kepadatan Tertinggi",
              grid: validationStats?.sampel_grid?.kepadatan_tinggi?.[0],
              badgeStyle: "bg-amber-50 text-amber-700 border border-amber-100",
              desc: "Memiliki jumlah outlet coffee shop terbanyak yang aktif beroperasi saat ini di lapangan."
            },
            {
              key: "tanpa_kopi_kuat",
              label: "Tanpa Pesaing (Sesuai)",
              grid: validationStats?.sampel_grid?.tanpa_kopi_kuat?.[0],
              badgeStyle: "bg-green-50 text-green-700 border border-green-100",
              desc: "Bebas dari pesaing terdekat dan dinilai sangat potensial (Sesuai) menurut model WLC."
            },
            {
              key: "tanpa_kopi_lemah",
              label: "Tanpa Pesaing (Kurang Sesuai)",
              grid: validationStats?.sampel_grid?.tanpa_kopi_lemah?.[0],
              badgeStyle: "bg-blue-50 text-blue-700 border border-blue-100",
              desc: "Bebas dari pesaing namun memiliki potensi pasar atau aksesibilitas yang sangat rendah."
            },
            {
              key: "pembatas_lahan",
              label: "Area Constraint",
              grid: validationStats?.sampel_grid?.pembatas_lahan?.[0],
              badgeStyle: "bg-red-50 text-red-700 border border-red-100",
              desc: "Berada di atas kawasan perlindungan lingkungan (Sawah Irigasi atau Sempadan Sungai) sehingga tidak boleh dibangun."
            }
          ].map(({ key, label, grid, badgeStyle, desc }) => {
            if (!grid) return null;
            const isSelected = selectedGrid?.kode_grid === grid.kode_grid;
            const isSawah = grid.nilai_indikator?.sawah === 0;
            const isSungai = grid.nilai_indikator?.sempadan_sungai === 0;

            return (
              <div
                key={key}
                onClick={() => setSelectedGrid(grid)}
                className={`relative flex flex-col justify-between rounded-3xl p-5 border transition-all duration-300 cursor-pointer select-none h-full hover:shadow-md ${
                  isSelected 
                    ? "border-[#1D3557] bg-stone-50/50 shadow-md ring-2 ring-[#1D3557]/20 scale-[1.02]" 
                    : "border-stone-200/80 bg-white hover:border-stone-400"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badgeStyle}`}>
                      {label}
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium font-mono">
                      {grid.kecamatan || "-"}
                    </span>
                  </div>

                  <h4 className="mt-4 text-2xl font-black text-stone-900 tracking-tight">
                    {grid.kode_grid}
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                    Kel. {grid.kelurahan || "-"}
                  </p>
                  
                  <p className="text-[10px] text-stone-500 mt-3 leading-normal italic min-h-[32px]">
                    {desc}
                  </p>

                  <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-400">Skor WLC</span>
                      <span className="font-mono font-bold text-stone-900">
                        {grid.skor_wlc?.toFixed(5) || "0.00000"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-400">Kelas</span>
                      <span 
                        className="font-bold text-[11px]" 
                        style={{ color: getSuitabilityColor(grid.kelas_kesesuaian) }}
                      >
                        {grid.kelas_kesesuaian}
                      </span>
                    </div>

                    <div className="flex justify-between items-start text-xs pt-1">
                      <span className="text-stone-400">Constraint</span>
                      <div className="flex flex-col items-end gap-1">
                        {isSawah || isSungai ? (
                          <div className="flex flex-wrap justify-end gap-1 text-[9px] font-bold">
                            {isSawah && <span className="bg-red-50 text-red-600 px-1 rounded-md">🌾 Sawah</span>}
                            {isSungai && <span className="bg-blue-50 text-blue-600 px-1 rounded-md">🌊 Sungai</span>}
                          </div>
                        ) : (
                          <span className="text-stone-400 text-[10px]">Aman</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGrid(grid);
                    }}
                    className={`w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer ${
                      isSelected 
                        ? "bg-[#1D3557] text-white shadow-sm" 
                        : "bg-stone-50 text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    <span>Audit Detail</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </AdminLayout>
  );
}
