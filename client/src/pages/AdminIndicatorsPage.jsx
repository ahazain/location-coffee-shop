import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";
import IndicatorTable from "../components/admin/IndicatorTable";
import AdminLayout from "../layouts/AdminLayout";
import { criteria } from "../data/criteria";
import { adminService } from "../services/adminService";

export default function AdminIndicatorsPage() {
  const [indicators, setIndicators] = useState([]);
  const [query, setQuery] = useState("");
  const [criteriaFilter, setCriteriaFilter] = useState("Semua");

  useEffect(() => {
    adminService.getIndicators().then(setIndicators);
  }, []);

  const filteredIndicators = useMemo(() => {
    return indicators.filter((indicator) => {
      const matchesQuery = `${indicator.name} ${indicator.code} ${indicator.direction}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesCriteria = criteriaFilter === "Semua" || indicator.criteriaCode === criteriaFilter;

      return matchesQuery && matchesCriteria;
    });
  }, [criteriaFilter, indicators, query]);

  return (
    <AdminLayout>
      <Card className="mb-5 p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <Badge>Hierarki kriteria & indikator</Badge>
            <h2 className="mt-3 text-2xl font-black text-stone-950">Indikator penilaian lokasi</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
              Halaman ini dipakai untuk meninjau 13 indikator sesuai hierarki kuesioner. Tipe fuzzy, satuan, dan arah preferensi disiapkan sebelum proses fuzzy otomatis dan WLC dijalankan.
            </p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4 text-center">
            <p className="text-2xl font-black text-stone-950">{filteredIndicators.length}</p>
            <p className="text-xs text-stone-500">Indikator tampil</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_260px]">
          <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 focus-within:border-amber-700">
            <Search size={18} className="text-stone-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari indikator, kode, atau arah preferensi..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
          <select
            value={criteriaFilter}
            onChange={(event) => setCriteriaFilter(event.target.value)}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 outline-none focus:border-amber-700"
          >
            <option value="Semua">Semua kriteria</option>
            {criteria.map((item) => (
              <option key={item.code} value={item.code}>{item.name}</option>
            ))}
          </select>
        </div>
      </Card>

      <IndicatorTable indicators={filteredIndicators} />
    </AdminLayout>
  );
}
