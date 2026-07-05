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

export default function AdminValidationPage() {
  const [gridGeojson, setGridGeojson] = useState(null);
  const [boundaryGeojson, setBoundaryGeojson] = useState(null);
  const [coffeePoints, setCoffeePoints] = useState(null);
  const [validationStats, setValidationStats] = useState(null);
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSampleTab, setActiveSampleTab] = useState("tidak_sesuai_skor");

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
      if (stats?.sampel_grid?.tidak_sesuai_skor?.length > 0) {
        setSelectedGrid(stats.sampel_grid.tidak_sesuai_skor[0]);
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

  // Hitung persentase kecocokan model (Sesuai + Kurang Sesuai)
  const matchingStats = validationStats?.sebaran_kelas?.reduce((acc, item) => {
    if (item.kelas_kesesuaian === "Sesuai" || item.kelas_kesesuaian === "Kurang Sesuai") {
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
              Halaman ini menguji akurasi matematis analisis *Weighted Linear Combination* (WLC) dengan sebaran **22 kedai kopi eksisting** (ground truth) di lapangan serta memvalidasi kepatuhan terhadap batasan (*constraints*).
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
            Persentase kedai kopi eksisting yang sukses berada di zona yang dinilai <strong>Sesuai</strong> atau <strong>Kurang Sesuai</strong> oleh model WLC.
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
          {/* Sebaran Detail */}
          <Card className="p-5 border border-stone-200/50 bg-white shadow-sm">
            <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3">Sebaran Kelas Kesesuaian</h3>
            <div className="mt-4 space-y-4">
              {validationStats?.sebaran_kelas?.map((item) => {
                const isSesuai = item.kelas_kesesuaian === "Sesuai";
                const isKurang = item.kelas_kesesuaian === "Kurang Sesuai";
                
                let progressColor = "bg-red-500";
                let badgeColor = "bg-red-50 text-red-600";
                if (isSesuai) {
                  progressColor = "bg-green-600";
                  badgeColor = "bg-green-50 text-green-600";
                } else if (isKurang) {
                  progressColor = "bg-yellow-500";
                  badgeColor = "bg-yellow-50 text-yellow-600";
                }

                return (
                  <div key={item.kelas_kesesuaian} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-700">{item.kelas_kesesuaian}</span>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${badgeColor}`}>
                        {item.jumlah} outlet ({item.persentase}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${progressColor}`} 
                        style={{ width: `${item.persentase}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Rincian Pelanggaran Constraint */}
          <Card className="p-5 border border-stone-200/50 bg-white shadow-sm">
            <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3">Pelanggaran Area Pembatas</h3>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-red-100 bg-red-50/40 p-3 flex gap-3 items-start">
                <div className="rounded-lg bg-red-100 p-1 text-red-600 shrink-0">
                  <ShieldAlert size={16} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-red-950">Padi Sawah Irigasi</p>
                  <p className="mt-0.5 text-stone-500">
                    <strong>{validationStats?.pelanggaran_constraint?.rincian?.sawah} outlet</strong> berdiri di lahan sawah aktif.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-red-100 bg-red-50/40 p-3 flex gap-3 items-start">
                <div className="rounded-lg bg-red-100 p-1 text-red-600 shrink-0">
                  <ShieldAlert size={16} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-red-950">Sempadan Sungai</p>
                  <p className="mt-0.5 text-stone-500">
                    <strong>{validationStats?.pelanggaran_constraint?.rincian?.sempadan_sungai} outlet</strong> berada di sempadan/aliran sungai.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Detail Grid Terpilih */}
          <Card className="p-5 border border-stone-200/50 bg-white shadow-sm">
            <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3">Detail Grid Inspeksi</h3>
            {selectedGrid ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-stone-900">{selectedGrid.kode_grid}</span>
                  <span className="text-xs text-stone-400 font-medium">
                    {selectedGrid.kecamatan || "Luar Wilayah"}, {selectedGrid.kelurahan || "-"}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-stone-50 p-2.5 border border-stone-100">
                    <p className="text-[10px] text-stone-400 font-semibold uppercase">Skor WLC</p>
                    <p className="mt-1 text-sm font-black font-mono text-stone-900">{selectedGrid.skor_wlc?.toFixed(4) || "0.00"}</p>
                  </div>
                  <div className="rounded-xl bg-stone-50 p-2.5 border border-stone-100">
                    <p className="text-[10px] text-stone-400 font-semibold uppercase">Kelas</p>
                    <p className="mt-1 text-xs font-bold" style={{ color: getSuitabilityColor(selectedGrid.kelas_kesesuaian) }}>
                      {selectedGrid.kelas_kesesuaian}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Nilai Indikator Audit</p>
                  <div className="rounded-2xl border border-stone-100 p-2 bg-stone-50/50 space-y-1">
                    {renderIndicatorScore("sawah", selectedGrid.nilai_indikator?.sawah === 1 ? "1 (Terkena)" : "0 (Aman)", "")}
                    {renderIndicatorScore("sempadan_sungai", selectedGrid.nilai_indikator?.sempadan_sungai === 1 ? "1 (Terkena)" : "0 (Aman)", "")}
                    {renderIndicatorScore("kepadatan_hunian", selectedGrid.nilai_indikator?.kepadatan_hunian ?? 0, "unit/km2")}
                    {renderIndicatorScore("kepadatan_populasi", selectedGrid.nilai_indikator?.kepadatan_populasi ?? 0, "jiwa/km2")}
                    {renderIndicatorScore("jarak_jalan_utama", selectedGrid.nilai_indikator?.jarak_jalan_utama ?? 0, "meter")}
                    {renderIndicatorScore("jarak_kopi_terdekat", selectedGrid.nilai_indikator?.jarak_coffee_shop_existing_terdekat ?? 0, "meter")}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 text-center text-xs text-stone-400 py-6">
                <Info size={24} className="mx-auto text-stone-300 mb-2" />
                Klik salah satu sel grid di peta atau di tabel bawah untuk mengaudit indikatornya.
              </div>
            )}
          </Card>
        </aside>
      </div>

      {/* 4. Representative Sample Grid Audit Tabs */}
      <Card className="p-6 border border-stone-200/50 bg-white shadow-sm">
        <div className="border-b border-stone-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-stone-900">Audit Sampel Grid Wilayah</h3>
            <p className="text-xs text-stone-400 mt-1">Gunakan tabel ini untuk melihat kesesuaian parameter grid dengan fakta kondisi lapangan.</p>
          </div>

          {/* Tab buttons */}
          <div className="flex flex-wrap gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-semibold text-stone-600">
            <button 
              onClick={() => setActiveSampleTab("tidak_sesuai_skor")}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${activeSampleTab === "tidak_sesuai_skor" ? "bg-white text-stone-950 shadow-xs" : "hover:text-stone-950"}`}
            >
              Tidak Sesuai (Skor)
            </button>
            <button 
              onClick={() => setActiveSampleTab("pembatas_lahan")}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${activeSampleTab === "pembatas_lahan" ? "bg-white text-stone-950 shadow-xs" : "hover:text-stone-950"}`}
            >
              Pembatas (Constraint)
            </button>
            <button 
              onClick={() => setActiveSampleTab("kurang_sesuai")}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${activeSampleTab === "kurang_sesuai" ? "bg-white text-stone-950 shadow-xs" : "hover:text-stone-950"}`}
            >
              Kurang Sesuai
            </button>
            <button 
              onClick={() => setActiveSampleTab("sesuai")}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${activeSampleTab === "sesuai" ? "bg-white text-stone-950 shadow-xs" : "hover:text-stone-950"}`}
            >
              Sesuai
            </button>
          </div>
        </div>

        {/* Tab content table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 font-bold">
                <th className="py-3 px-4">Kode Grid</th>
                <th className="py-3 px-4">Kecamatan</th>
                <th className="py-3 px-4">Kelurahan</th>
                <th className="py-3 px-4 text-center">Skor WLC</th>
                <th className="py-3 px-4 text-center">Kelas</th>
                <th className="py-3 px-4">Status Constraint</th>
                <th className="py-3 px-4 text-center">Coffee Shop Terkait</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {validationStats?.sampel_grid[activeSampleTab]?.length > 0 ? (
                validationStats.sampel_grid[activeSampleTab].map((grid) => {
                  const isSawah = grid.nilai_indikator?.sawah === 0;
                  const isSungai = grid.nilai_indikator?.sempadan_sungai === 0;
                  
                  return (
                    <tr 
                      key={grid.kode_grid} 
                      className={`border-b border-stone-100 hover:bg-stone-50/50 transition cursor-pointer ${selectedGrid?.kode_grid === grid.kode_grid ? "bg-stone-50" : ""}`}
                      onClick={() => setSelectedGrid(grid)}
                    >
                      <td className="py-3.5 px-4 font-bold text-stone-900">{grid.kode_grid}</td>
                      <td className="py-3.5 px-4 text-stone-600">{grid.kecamatan || "Luar Wilayah"}</td>
                      <td className="py-3.5 px-4 text-stone-600">{grid.kelurahan || "-"}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-stone-900">{grid.skor_wlc?.toFixed(5) || "0.0000"}</td>
                      <td className="py-3.5 px-4 text-center font-bold" style={{ color: getSuitabilityColor(grid.kelas_kesesuaian) }}>
                        {grid.kelas_kesesuaian}
                      </td>
                      <td className="py-3.5 px-4">
                        {isSawah || isSungai ? (
                          <div className="flex gap-1 text-[10px] font-bold">
                            {isSawah && <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md">🌾 Sawah</span>}
                            {isSungai && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md">🌊 Sungai</span>}
                          </div>
                        ) : (
                          <span className="text-stone-400">Aman (Non-Constraint)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-stone-700">
                        {grid.jumlah_coffee_shop > 0 ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-700">
                            {grid.jumlah_coffee_shop} outlet
                          </span>
                        ) : (
                          <span className="text-stone-400">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGrid(grid);
                          }}
                          className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          Audit <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400 font-medium bg-stone-50/50 rounded-b-2xl">
                    Tidak ada sampel grid yang terdaftar pada tab ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
}
