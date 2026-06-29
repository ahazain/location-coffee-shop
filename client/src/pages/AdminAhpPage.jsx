import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, CheckCircle2, RefreshCcw, UsersRound, Plus, Trash2 } from "lucide-react";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import AdminLayout from "../layouts/AdminLayout";
import { ahpService } from "../services/api/ahpService";
import { pakarService } from "../services/api/pakarService";

export default function AdminAhpPage() {
  const [konsensus, setKonsensus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal tambah pakar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPakar, setNewPakar] = useState({ nama_pakar: "", institusi: "", jabatan: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function loadKonsensus() {
    try {
      setLoading(true);
      const data = await ahpService.getBobotKonsensus();
      setKonsensus(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadKonsensus(); }, []);

  // Sort bobot indikator by bobot_akhir DESC
  const sortedIndikator = useMemo(() => {
    if (!konsensus?.bobot_indikator) return [];
    return [...konsensus.bobot_indikator].sort((a, b) => b.bobot_akhir - a.bobot_akhir);
  }, [konsensus]);

  const totalBobot = useMemo(() => {
    if (!konsensus?.bobot_kriteria) return 0;
    return konsensus.bobot_kriteria.reduce((s, k) => s + k.bobot, 0);
  }, [konsensus]);

  async function handleAddPakar(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await pakarService.create(newPakar);
      setMessage({ type: "success", text: "Pakar berhasil ditambahkan." });
      setIsModalOpen(false);
      setNewPakar({ nama_pakar: "", institusi: "", jabatan: "" });
      loadKonsensus();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePakar(id) {
    if (!window.confirm("Hapus pakar ini? Data AHP terkait pakar ini akan ikut terhapus.")) return;
    try {
      await pakarService.delete(id);
      setMessage({ type: "success", text: "Pakar berhasil dihapus." });
      loadKonsensus();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  return (
    <AdminLayout>
      <Card className="mb-5 p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <Badge>Step AHP — Bobot Konsensus</Badge>
            <h2 className="mt-3 text-2xl font-black text-stone-950">Hasil AHP: Bobot Kriteria & Indikator</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-500">
              Bobot konsensus dihitung dari rata-rata geometrik semua pakar aktif. Bobot ini digunakan langsung oleh WLC sebagai Wi (bobot akhir indikator).
            </p>
          </div>
          <div className="rounded-3xl bg-green-50 p-4 text-green-800">
            <div className="flex items-center gap-2 font-bold"><CheckCircle2 size={18} /> Bobot Konsensus Siap</div>
            <p className="mt-1 text-xs">Total bobot: {(totalBobot * 100).toFixed(1)}%</p>
          </div>
        </div>
      </Card>

      {message && (
        <div className={`mb-4 rounded-xl p-4 text-sm ${message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}
      {error && <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">Error: {error}</div>}

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800"><UsersRound /></span>
          <p className="mt-4 text-sm text-stone-500">Pakar aktif</p>
          <h3 className="text-2xl font-black text-stone-950">{konsensus?.total_pakar ?? (loading ? "..." : "-")}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">Responden yang menginput matriks perbandingan AHP.</p>
        </Card>
        <Card className="p-5">
          <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800"><BrainCircuit /></span>
          <p className="mt-4 text-sm text-stone-500">Kriteria AHP</p>
          <h3 className="text-2xl font-black text-stone-950">{konsensus?.bobot_kriteria?.length ?? (loading ? "..." : "-")}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">Kriteria utama yang dibandingkan secara berpasangan.</p>
        </Card>
        <Card className="p-5">
          <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800"><RefreshCcw /></span>
          <p className="mt-4 text-sm text-stone-500">Indikator berbobot</p>
          <h3 className="text-2xl font-black text-stone-950">{konsensus?.bobot_indikator?.length ?? (loading ? "..." : "-")}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">Bobot akhir = bobot kriteria × bobot lokal indikator.</p>
        </Card>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Panel Pakar */}
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-stone-950">Daftar Pakar / Responden</h2>
              <p className="mt-1 text-sm text-stone-500">Pelaku usaha yang mengisi kuesioner AHP.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
            >
              <Plus size={16} /> Tambah
            </button>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="py-6 text-center text-sm text-stone-400">Memuat...</div>
            ) : (konsensus?.pakar || []).map((pakar) => (
              <div key={pakar.id_pakar} className="flex items-start justify-between rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div>
                  <p className="font-semibold text-stone-950">{pakar.nama_pakar}</p>
                  <p className="mt-1 text-sm text-stone-500">{pakar.jabatan} • {pakar.institusi}</p>
                </div>
                <button
                  onClick={() => handleDeletePakar(pakar.id_pakar)}
                  className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Panel Bobot Kriteria */}
        <Card className="p-5">
          <h2 className="text-lg font-bold text-stone-950">Bobot Kriteria Konsensus</h2>
          <p className="mt-1 text-sm text-stone-500">Hasil rata-rata geometrik dari semua pakar aktif.</p>
          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="py-6 text-center text-sm text-stone-400">Memuat...</div>
            ) : (konsensus?.bobot_kriteria || []).map((k) => (
              <div key={k.id_kriteria}>
                <div className="mb-1 flex items-center justify-between text-sm font-semibold text-stone-700">
                  <span>{k.nama}</span>
                  <span>{(k.bobot * 100).toFixed(2)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-amber-700" style={{ width: `${k.bobot * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Tabel Bobot Akhir Indikator */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-stone-200 p-5">
          <h2 className="text-lg font-bold text-stone-950">Bobot Akhir Indikator (Wi untuk WLC)</h2>
          <p className="mt-1 text-sm text-stone-500">Diurutkan dari kontribusi terbesar ke terkecil. Bobot akhir = bobot kriteria × bobot lokal.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-5 py-3">Indikator</th>
                <th className="px-5 py-3 text-right">Bobot Lokal</th>
                <th className="px-5 py-3 text-right">Bobot Akhir (Wi)</th>
                <th className="px-5 py-3 text-right">Proporsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr><td colSpan="4" className="px-5 py-10 text-center text-stone-400">Memuat...</td></tr>
              ) : sortedIndikator.map((ind, idx) => (
                <tr key={ind.id_indikator} className="hover:bg-stone-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">{idx + 1}</span>
                      <div>
                        <p className="font-semibold text-stone-900">{ind.nama}</p>
                        <p className="text-xs text-stone-500">{ind.kode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right text-stone-600">{(ind.bobot_lokal * 100).toFixed(2)}%</td>
                  <td className="px-5 py-4 text-right font-bold text-stone-950">{(ind.bobot_akhir * 100).toFixed(4)}%</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-stone-100">
                        <div className="h-full rounded-full bg-amber-600" style={{ width: `${(ind.bobot_akhir / (sortedIndikator[0]?.bobot_akhir || 1)) * 100}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Tambah Pakar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-stone-900">Tambah Pakar Baru</h3>
            <form onSubmit={handleAddPakar} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Nama Pakar</label>
                <input type="text" required value={newPakar.nama_pakar}
                  onChange={(e) => setNewPakar({ ...newPakar, nama_pakar: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
                  placeholder="Misal: Budi Santoso" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Institusi / Coffee Shop</label>
                <input type="text" required value={newPakar.institusi}
                  onChange={(e) => setNewPakar({ ...newPakar, institusi: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
                  placeholder="Misal: Cafe Kita" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Jabatan</label>
                <input type="text" required value={newPakar.jabatan}
                  onChange={(e) => setNewPakar({ ...newPakar, jabatan: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
                  placeholder="Misal: Owner / Manager" />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-100">
                  Batal
                </button>
                <button type="submit" disabled={saving}
                  className="rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-800">
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
