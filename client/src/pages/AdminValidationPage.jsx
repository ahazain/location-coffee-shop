import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, AlertTriangle, Info, MapPin, Calculator, ShieldAlert, FileText, ChevronRight, RefreshCw } from "lucide-react";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import AdminLayout from "../layouts/AdminLayout";
import ValidationMapView from "../components/map/ValidationMapView";
import { wlcService } from "../services/api/wlcService";
import { getSuitabilityColor } from "../utils/mapStyle";
import GridDetailPanel from "../components/map/GridDetailPanel";
import { indikatorService } from "../services/api/indikatorService";

export default function AdminValidationPage() {
  const [gridGeojson, setGridGeojson] = useState(null);
  const [boundaryGeojson, setBoundaryGeojson] = useState(null);
  const [coffeePoints, setCoffeePoints] = useState(null);
  const [validationStats, setValidationStats] = useState(null);
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [indicatorList, setIndicatorList] = useState([]);
  const [activeSampleTab, setActiveSampleTab] = useState("kepadatan_tinggi");

  async function loadValidationData() {
    try {
      setLoading(true);
      setError(null);

      // Ambil seluruh data spasial dan stats secara paralel
      const [grids, points, stats, boundary, indicators] = await Promise.all([
        wlcService.getGrids(),
        wlcService.getValidationPoints(),
        wlcService.getValidationStats(),
        wlcService.getBoundary().catch(() => null),
        indikatorService.getAll().catch(() => null)
      ]);

      setGridGeojson(grids);
      setCoffeePoints(points);
      setValidationStats(stats);
      setBoundaryGeojson(boundary);
      if (indicators && indicators.data_indikator) {
        setIndicatorList(indicators.data_indikator);
      }
      
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

  async function handleSync() {
    try {
      setSyncing(true);
      setSyncSuccess(null);
      const res = await wlcService.syncValidationPoints();
      setSyncSuccess(res.message || `Berhasil menyinkronkan ${res.data?.totalSynced || 0} titik kedai kopi baru.`);
      await loadValidationData();
      setTimeout(() => setSyncSuccess(null), 6000);
    } catch (err) {
      console.error("Gagal sinkronisasi data:", err);
      alert(err.message || "Terjadi kesalahan saat sinkronisasi data.");
    } finally {
      setSyncing(false);
    }
  }

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
      {/* Success Notification Banner */}
      {syncSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2 animate-fadeIn shadow-xs">
          <CheckCircle2 size={16} className="text-green-600 shrink-0" />
          <span className="font-medium">{syncSuccess}</span>
        </div>
      )}

      {/* 1. Header Section */}
      <Card className="mb-6 p-6 shadow-sm border border-stone-200/50 bg-white">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="success">Akurasi Model</Badge>
              <span className="text-xs text-stone-400">EPSG:32749 & EPSG:4326</span>
            </div>
            <h2 className="mt-3 text-2xl font-black text-stone-900">Validasi Spasial Menggunakan Citra Satelit</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-500 max-w-3xl">
              Validasi spasial dilakukan dengan menggunakan citra satelit saat ini untuk menilai seberapa banyak kedai kopi yang sudah berdiri nyata tahun ini di lapangan. Melalui perbandingan sebaran kedai kopi riil dari citra satelit terhadap hasil analisis WLC (Weighted Linear Combination) yang telah dihasilkan, kita dapat mengevaluasi tingkat kesesuaian dan keakuratan model dalam memprediksi lokasi usaha.
            </p>
          </div>
          <div className="shrink-0 flex flex-wrap items-center gap-3">
            <Button 
              onClick={handleSync} 
              disabled={syncing} 
              variant="primary" 
              size="sm"
              className="flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Sinkronisasi..." : "Sinkronisasi Google Maps / OSM"}
            </Button>
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
            <span className="text-xs text-stone-500">({matchingStats.jumlah} / {validationStats?.summary?.total_coffee_shop_eksisting || 0} outlet)</span>
          </div>
          <p className="mt-2 text-xs text-stone-400 leading-relaxed">
            Persentase kedai kopi nyata dari citra satelit saat ini yang berada di zona dinilai <strong>Sesuai</strong> atau <strong>Cukup Sesuai</strong> oleh analisis WLC yang telah dihasilkan.
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
            <span className="text-xs text-stone-500">({validationStats?.pelanggaran_constraint?.total_pelanggaran} / {validationStats?.summary?.total_coffee_shop_eksisting || 0} outlet)</span>
          </div>
          <p className="mt-2 text-xs text-stone-400 leading-relaxed">
            Jumlah kedai kopi dari citra satelit saat ini yang terdeteksi berdiri di atas wilayah pembatas (Sawah Irigasi atau Sempadan Sungai).
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
            indicatorList={indicatorList}
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
        <GridDetailPanel selectedGrid={formatGridForDetail(selectedGrid)} indicatorList={indicatorList} />
      </div>

      {/* 4. Classification Validation Cards */}
      <Card className="p-6 border border-stone-200/50 bg-white shadow-sm">
        <div>
          <h3 className="text-base font-bold text-stone-900">Hasil Validasi Spasial per Klasifikasi Kesesuaian Lahan</h3>
          <p className="text-xs text-stone-400 mt-1">Distribusi sebaran outlet kedai kopi eksisting berdasarkan analisis spasial citra satelit pada setiap kelas kesesuaian WLC.</p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-1 md:grid-cols-3">
          {[
            {
              key: "Sesuai",
              label: "Sesuai",
              badgeStyle: "bg-green-50 text-green-700 border border-green-100",
              textStyle: "text-green-700",
              desc: "Zona dengan tingkat kesesuaian tinggi berdasarkan analisis WLC. Menunjukkan area paling optimal yang direkomendasikan untuk pendirian kedai kopi."
            },
            {
              key: "Cukup Sesuai",
              label: "Cukup Sesuai",
              badgeStyle: "bg-blue-50 text-blue-700 border border-blue-100",
              textStyle: "text-blue-700",
              desc: "Zona dengan tingkat kesesuaian sedang/moderat. Area yang menawarkan potensi pasar cukup baik dengan beberapa faktor pendukung."
            },
            {
              key: "Kurang Sesuai",
              label: "Kurang Sesuai",
              badgeStyle: "bg-red-50 text-red-700 border border-red-100",
              textStyle: "text-red-700",
              desc: "Zona dengan tingkat kesesuaian rendah. Area yang memiliki keterbatasan faktor pasar, aksesibilitas, atau terkena dampak constraint."
            }
          ].map(({ key, label, badgeStyle, textStyle, desc }) => {
            const classStat = validationStats?.sebaran_kelas?.find(item => item.kelas_kesesuaian === key) || { jumlah: 0, persentase: 0 };
            
            return (
              <div
                key={key}
                className="flex flex-col justify-between rounded-3xl p-6 border border-stone-200 bg-white hover:shadow-md transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${badgeStyle}`}>
                      Kelas {label}
                    </span>
                  </div>

                  <div className="mt-6">
                    <span className="block text-stone-500 text-xs font-medium uppercase tracking-wider">Sebaran Kedai Kopi</span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className={`text-4xl font-black ${textStyle}`}>
                        {classStat.persentase.toFixed(2)}%
                      </span>
                      <span className="text-sm font-semibold text-stone-500">
                        ({classStat.jumlah} Outlet)
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-stone-500">
                    {desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] text-stone-400">
                  Divalidasi menggunakan citra satelit terhadap hasil analisis WLC yang sudah dihasilkan.
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </AdminLayout>
  );
}
