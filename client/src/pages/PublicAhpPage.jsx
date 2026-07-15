import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Coffee,
  Map,
  RotateCcw,
  Save,
  Scale,
  TriangleAlert,
} from "lucide-react";
import Card from "../components/common/Card";
import { criteria as fallbackCriteria } from "../data/criteria";
import { indicators as fallbackIndicators } from "../data/indicators";
import PublicLayout from "../layouts/PublicLayout";
import { weightService } from "../services/weightService";
import { kriteriaService } from "../services/api/kriteriaService";
import { indikatorService } from "../services/api/indikatorService";
import {
  calculateAhpFromComparisons,
  createEqualComparisons,
  generatePairs,
  saatyScale,
} from "../utils/ahp";
import { buildGlobalIndicatorWeights } from "../utils/weights";

const steps = [
  { title: "Pengenalan" },
  { title: "Kriteria" },
  { title: "Indikator" },
  { title: "Hasil" },
];

const preferenceOptions = [
  { value: "left", label: "Pilihan A lebih penting" },
  { value: "equal", label: "Sama penting" },
  { value: "right", label: "Pilihan B lebih penting" },
];

function getIndicatorsByCriteria(criteriaCode, indicatorItems) {
  return indicatorItems.filter(
    (indicator) => indicator.criteriaCode === criteriaCode
  );
}

function buildInitialIndicatorComparisons(criteriaItems, indicatorItems) {
  return Object.fromEntries(
    criteriaItems.map((criterion) => {
      const items = getIndicatorsByCriteria(criterion.code, indicatorItems);
      return [criterion.code, createEqualComparisons(generatePairs(items))];
    })
  );
}

function buildIndicatorQuestionList(criteriaItems, indicatorItems) {
  return criteriaItems.flatMap((criterion) => {
    const items = getIndicatorsByCriteria(criterion.code, indicatorItems);

    return generatePairs(items).map((pair) => ({
      ...pair,
      criteriaCode: criterion.code,
      criteriaName: criterion.name,
    }));
  });
}

function getArrayData(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function mapKriteriaItem(item) {
  const id = item.id_kriteria ?? item.id;
  return {
    id,
    code: String(id),
    name: item.nama_kriteria ?? item.nama ?? "-",
    description: item.deskripsi ?? item.keterangan ?? "",
    urutan: item.urutan ?? 999,
  };
}

function mapIndikatorItem(item) {
  const id = item.id_indikator ?? item.id;
  const idKriteria =
    item.id_kriteria ??
    item.kriteria?.id_kriteria ??
    item.kriteria?.id ??
    item.criteriaId;
  return {
    id,
    code: String(id),
    criteriaCode: String(idKriteria),
    criteriaId: idKriteria,
    name: item.nama_indikator ?? item.nama ?? "-",
    description: item.keterangan ?? item.deskripsi ?? "",
    urutan: item.urutan ?? 999,
  };
}

function formatPercent(value, digit = 2) {
  return `${Number(value || 0).toFixed(digit)}%`;
}

function PublicAhpStepper({ activeStep }) {
  return (
    <div className="grid gap-2 rounded-3xl border border-stone-200/60 bg-white p-3 shadow-xs md:grid-cols-4">
      {steps.map((step, index) => {
        const isActive = index === activeStep;
        const isDone = index < activeStep;

        return (
          <div
            key={step.title}
            className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ${isActive
              ? "bg-blue-50 text-[#1D3557]"
              : isDone
                ? "bg-emerald-50 text-emerald-800"
                : "bg-stone-50 text-stone-500"
              }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${isActive
                ? "bg-[#1D3557] text-white"
                : isDone
                  ? "bg-emerald-700 text-white"
                  : "bg-white text-stone-500 ring-1 ring-stone-200"
                }`}
            >
              {isDone ? <CheckCircle2 size={16} /> : index + 1}
            </span>

            <span className="font-semibold">{step.title}</span>
          </div>
        );
      })}
    </div>
  );
}

function PublicIntroCard({ onStart, onOpenMap, criteriaCount }) {
  return (
    <Card className="p-8 border border-stone-200/60 shadow-xs rounded-3xl bg-white w-full">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-blue-50 p-4 text-[#577590] border border-blue-100/50">
            <BrainCircuit className="h-7 w-7" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#577590]">
              Analytical Hierarchy Process
            </p>

            <h1 className="mt-2 text-2xl font-black text-[#1D3557] tracking-wide">
              Pembobotan AHP untuk Rekomendasi Lokasi
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-500">
              Isi perbandingan berpasangan untuk menentukan bobot kriteria dan
              indikator. Sistem akan menghitung matriks, bobot, dan rasio
              konsistensi secara otomatis.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4 text-center border border-stone-100">
          <p className="text-2xl font-black text-[#1D3557]">
            {criteriaCount}
          </p>
          <p className="text-xs text-stone-500">Kriteria Utama</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-stone-50 p-4 border border-stone-100">
          <p className="font-bold text-[#1D3557]">1. Tidak hitung manual</p>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Anda hanya memilih prioritas. Matriks, bobot, CI, dan CR dihitung
            otomatis.
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4 border border-stone-100">
          <p className="font-bold text-[#1D3557]">2. Jawab konsisten</p>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Nilai CR harus maksimal 0,1 agar hasil bobot bisa digunakan.
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4 border border-stone-100">
          <p className="font-bold text-[#1D3557]">3. Terapkan ke peta</p>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Bobot yang konsisten dapat diterapkan ke peta rekomendasi.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1D3557] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-[#2c4c78] active:scale-95 cursor-pointer"
        >
          Mulai Perbandingan Kriteria
          <ArrowRight size={16} />
        </button>

        <button
          type="button"
          onClick={onOpenMap}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-stone-600 transition hover:bg-stone-50 active:scale-95 cursor-pointer"
        >
          <Map size={16} />
          Lihat Peta Default
        </button>
      </div>
    </Card>
  );
}

function PublicPairwiseQuestion({
  pair,
  value,
  onChange,
  title,
  helper,
  questionNumber,
  totalQuestions,
}) {
  const comparison = value || { preference: "equal", intensity: 1 };

  function setPreference(preference) {
    onChange({
      preference,
      intensity: preference === "equal" ? 1 : Number(comparison.intensity || 3),
    });
  }

  function setIntensity(intensity) {
    onChange({
      preference:
        comparison.preference === "equal" ? "left" : comparison.preference,
      intensity: Number(intensity),
    });
  }

  return (
    <Card className="p-8 border border-stone-200/60 shadow-xs rounded-3xl bg-white">
      <div className="flex flex-col justify-between gap-3 border-b border-stone-100 pb-4 md:flex-row md:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#577590]">
            {title}
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#1D3557]">
            Mana yang lebih penting?
          </h2>

          {helper && (
            <p className="mt-2 text-sm leading-6 text-stone-500">{helper}</p>
          )}
        </div>

        {questionNumber && totalQuestions && (
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">
            {questionNumber} dari {totalQuestions}
          </span>
        )}
      </div>

      <div className="mt-5 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <button
          type="button"
          onClick={() => setPreference("left")}
          className={`min-h-32 rounded-3xl border p-5 text-left transition ${comparison.preference === "left"
            ? "border-[#1D3557] bg-blue-50 ring-2 ring-blue-100"
            : "border-stone-200 bg-white hover:border-[#577590] hover:bg-blue-50/40"
            }`}
        >
          <span className="text-xs font-bold uppercase tracking-wide text-stone-400">
            Pilihan A
          </span>

          <span className="mt-2 block text-xl font-black text-[#1D3557]">
            {pair.left.name}
          </span>

          {pair.left.description && (
            <span className="mt-2 block text-sm leading-6 text-stone-500">
              {pair.left.description}
            </span>
          )}
        </button>

        <div className="flex justify-center">
          <span className="rounded-full bg-stone-100 p-3 text-stone-500">
            <BrainCircuit size={22} />
          </span>
        </div>

        <button
          type="button"
          onClick={() => setPreference("right")}
          className={`min-h-32 rounded-3xl border p-5 text-left transition ${comparison.preference === "right"
            ? "border-[#1D3557] bg-blue-50 ring-2 ring-blue-100"
            : "border-stone-200 bg-white hover:border-[#577590] hover:bg-blue-50/40"
            }`}
        >
          <span className="text-xs font-bold uppercase tracking-wide text-stone-400">
            Pilihan B
          </span>

          <span className="mt-2 block text-xl font-black text-[#1D3557]">
            {pair.right.name}
          </span>

          {pair.right.description && (
            <span className="mt-2 block text-sm leading-6 text-stone-500">
              {pair.right.description}
            </span>
          )}
        </button>
      </div>

      <div className="mt-5 rounded-3xl bg-stone-50 p-4">
        <p className="text-sm font-bold text-stone-800">
          Pilih arah perbandingan
        </p>

        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {preferenceOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPreference(option.value)}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${comparison.preference === option.value
                ? "border-[#1D3557] bg-white text-[#1D3557] shadow-sm"
                : "border-stone-200 bg-white text-stone-600 hover:bg-blue-50/40"
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-stone-800">
              Tingkat kepentingan
            </p>

            <p className="text-xs text-stone-500">
              {comparison.preference === "equal"
                ? "Otomatis 1 karena sama penting"
                : `Nilai dipilih: ${comparison.intensity}`}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-9 gap-1.5">
            {saatyScale.map((item) => (
              <button
                key={item.value}
                type="button"
                disabled={comparison.preference === "equal"}
                onClick={() => setIntensity(item.value)}
                className={`rounded-xl border py-2 text-sm font-black transition disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-300 ${Number(comparison.intensity) === item.value &&
                  comparison.preference !== "equal"
                  ? "border-[#1D3557] bg-[#1D3557] text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-blue-50/40"
                  }`}
                title={item.label}
              >
                {item.value}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function PublicScaleGuide() {
  return (
    <Card className="p-5 border border-stone-200/60 shadow-xs rounded-3xl bg-white">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-blue-50 p-3 text-[#577590] border border-blue-100/50">
          <Scale size={18} />
        </div>

        <div>
          <h3 className="font-extrabold text-[#1D3557]">
            Panduan Skala Saaty
          </h3>

          <p className="mt-1 text-sm leading-6 text-stone-500">
            Gunakan nilai 1 jika sama penting. Gunakan nilai lebih besar jika
            salah satu faktor semakin dominan.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {saatyScale.map((item) => (
          <div
            key={item.value}
            className="flex items-center gap-3 rounded-2xl bg-stone-50 p-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-[#1D3557] ring-1 ring-stone-200">
              {item.value}
            </span>

            <span className="text-sm font-medium text-stone-700">
              {item.label.replace(`${item.value} - `, "")}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PublicConsistencyCard({ title, result, compact = false }) {
  const isConsistent = result?.isConsistent ?? true;

  return (
    <Card
      className={`p-5 border ${isConsistent ? "border-emerald-100" : "border-red-100"
        } shadow-xs rounded-3xl bg-white`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={`rounded-2xl p-2 ${isConsistent
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
              }`}
          >
            {isConsistent ? (
              <CheckCircle2 size={18} />
            ) : (
              <TriangleAlert size={18} />
            )}
          </span>

          <div>
            <h3 className="font-extrabold text-[#1D3557]">{title}</h3>

            <p className="mt-1 text-sm leading-6 text-stone-500">
              {isConsistent
                ? "Penilaian konsisten dan bisa digunakan."
                : "Penilaian belum konsisten. Periksa kembali jawaban yang terlalu bertentangan."}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${isConsistent
            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
            : "bg-red-50 text-red-700 border border-red-100"
            }`}
        >
          CR {result?.cr ?? 0}
        </span>
      </div>

      {!compact && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-stone-50 p-3">
            <p className="text-xs text-stone-500">λ max</p>
            <p className="mt-1 font-black text-[#1D3557]">
              {result?.lambdaMax ?? 0}
            </p>
          </div>

          <div className="rounded-2xl bg-stone-50 p-3">
            <p className="text-xs text-stone-500">CI</p>
            <p className="mt-1 font-black text-[#1D3557]">
              {result?.ci ?? 0}
            </p>
          </div>

          <div className="rounded-2xl bg-stone-50 p-3">
            <p className="text-xs text-stone-500">CR</p>
            <p
              className={`mt-1 font-black ${isConsistent ? "text-emerald-700" : "text-red-600"
                }`}
            >
              {result?.cr ?? 0}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function WeightBar({ label, value, helper }) {
  const numericValue = Number(value || 0);

  return (
    <div>
      <div className="mb-1 flex items-start justify-between gap-3 text-sm">
        <div>
          <p className="font-semibold text-stone-800">{label}</p>
          {helper && <p className="text-xs leading-5 text-stone-500">{helper}</p>}
        </div>

        <span className="font-black text-[#1D3557]">
          {formatPercent(numericValue)}
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full bg-[#577590]"
          style={{ width: `${Math.min(numericValue, 100)}%` }}
        />
      </div>
    </div>
  );
}

function PublicWeightResult({
  criteriaWeights = {},
  localIndicatorWeights = {},
  globalIndicatorWeights = {},
  criteriaList = [],
  indicatorsList = [],
}) {
  const sortedGlobalIndicators = [...indicatorsList].sort(
    (a, b) =>
      Number(globalIndicatorWeights[b.code] || 0) -
      Number(globalIndicatorWeights[a.code] || 0)
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* 1. Card Bobot Kriteria */}
      <Card className="p-5 border border-stone-200/60 shadow-sm rounded-3xl bg-white flex flex-col">
        <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
          <span className="rounded-2xl bg-blue-50 p-2 text-[#577590] border border-blue-100/50">
            <BarChart3 size={18} />
          </span>
          <div>
            <h3 className="font-extrabold text-[#1D3557] text-sm">Bobot Kriteria</h3>
            <p className="text-[10px] text-stone-400">Prioritas antar kriteria utama</p>
          </div>
        </div>
        <div className="mt-4 space-y-4 flex-1">
          {criteriaList.map((criterion) => (
            <WeightBar
              key={criterion.code}
              label={criterion.name}
              value={criteriaWeights[criterion.code]}
              helper={criterion.shortName || criterion.name}
            />
          ))}
        </div>
      </Card>

      {/* 2. Card Bobot Lokal per Indikator */}
      <Card className="p-5 border border-stone-200/60 shadow-sm rounded-3xl bg-white flex flex-col">
        <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
          <span className="rounded-2xl bg-indigo-50 p-2 text-indigo-700 border border-indigo-100/50">
            <BarChart3 size={18} />
          </span>
          <div>
            <h3 className="font-extrabold text-[#1D3557] text-sm">Bobot Lokal Indikator</h3>
            <p className="text-[10px] text-stone-400">Kontribusi indikator dalam kriteria induk</p>
          </div>
        </div>
        <div className="mt-4 space-y-5 flex-1 max-h-[60vh] overflow-y-auto pr-1">
          {criteriaList.map((criterion) => {
            const groupInds = indicatorsList.filter(ind => ind.criteriaCode === criterion.code);
            return (
              <div key={criterion.code} className="space-y-2 border-b border-stone-50 pb-3 last:border-0 last:pb-0">
                <span className="text-[9px] uppercase font-bold text-stone-450 tracking-wider">
                  {criterion.name}
                </span>
                <div className="space-y-2">
                  {groupInds.map(ind => (
                    <WeightBar
                      key={ind.code}
                      label={ind.name}
                      value={localIndicatorWeights[criterion.code]?.[ind.code] || 0}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 3. Card Bobot Total Indikator */}
      <Card className="p-5 border border-stone-200/60 shadow-sm rounded-3xl bg-white flex flex-col">
        <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
          <span className="rounded-2xl bg-emerald-50 p-2 text-emerald-700 border border-emerald-100/50">
            <BarChart3 size={18} />
          </span>
          <div>
            <h3 className="font-extrabold text-[#1D3557] text-sm">Bobot Total Indikator</h3>
            <p className="text-[10px] text-stone-400">Bobot global akhir (Kriteria × Lokal)</p>
          </div>
        </div>
        <div className="mt-4 space-y-4 flex-1 max-h-[60vh] overflow-y-auto pr-1">
          {sortedGlobalIndicators.map((indicator) => (
            <WeightBar
              key={indicator.code}
              label={indicator.name}
              value={globalIndicatorWeights[indicator.code]}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function PublicAhpPage() {
  const navigate = useNavigate();

  const [kriteriaItems, setKriteriaItems] = useState([]);
  const [indikatorItems, setIndikatorItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeStep, setActiveStep] = useState(0);
  const [criteriaIndex, setCriteriaIndex] = useState(0);
  const [indicatorIndex, setIndicatorIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [criteriaComparisons, setCriteriaComparisons] = useState({});
  const [indicatorComparisons, setIndicatorComparisons] = useState({});

  useEffect(() => {
    Promise.all([kriteriaService.getAll(), indikatorService.getAll()])
      .then(([kriteriaData, indikatorData]) => {
        const mappedKriteria = getArrayData(kriteriaData)
          .map(mapKriteriaItem)
          .filter((item) => item.id !== 6 && item.code !== "6")
          .sort((a, b) => a.urutan - b.urutan);

        const mappedIndikator = getArrayData(indikatorData)
          .map(mapIndikatorItem)
          .filter((item) => item.criteriaId !== 6 && item.criteriaCode !== "6")
          .sort((a, b) => a.urutan - b.urutan);

        setKriteriaItems(mappedKriteria);
        setIndikatorItems(mappedIndikator);

        const pairs = generatePairs(mappedKriteria);
        setCriteriaComparisons(createEqualComparisons(pairs));
        setIndicatorComparisons(
          buildInitialIndicatorComparisons(mappedKriteria, mappedIndikator)
        );
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat data AHP:", err);
        setLoading(false);
      });
  }, []);

  const criteriaPairs = useMemo(() => generatePairs(kriteriaItems), [kriteriaItems]);
  const indicatorQuestions = useMemo(() => buildIndicatorQuestionList(kriteriaItems, indikatorItems), [kriteriaItems, indikatorItems]);

  const criteriaResult = useMemo(
    () => calculateAhpFromComparisons(kriteriaItems, criteriaComparisons),
    [kriteriaItems, criteriaComparisons]
  );

  const localResults = useMemo(
    () =>
      Object.fromEntries(
        kriteriaItems.map((criterion) => {
          const items = getIndicatorsByCriteria(criterion.code, indikatorItems);

          return [
            criterion.code,
            calculateAhpFromComparisons(
              items,
              indicatorComparisons[criterion.code] || {}
            ),
          ];
        })
      ),
    [kriteriaItems, indikatorItems, indicatorComparisons]
  );

  const localIndicatorWeights = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(localResults).map(([criteriaCode, result]) => [
          criteriaCode,
          result.weightsPercent,
        ])
      ),
    [localResults]
  );

  const globalIndicatorWeights = useMemo(
    () =>
      buildGlobalIndicatorWeights(
        criteriaResult.weightsPercent,
        localIndicatorWeights
      ),
    [criteriaResult.weightsPercent, localIndicatorWeights]
  );

  const allLocalConsistent = Object.values(localResults).every(
    (result) => result.isConsistent
  );

  const isAllConsistent = criteriaResult.isConsistent && allLocalConsistent;

  const activeCriteriaPair = criteriaPairs[criteriaIndex];
  const activeIndicatorPair = indicatorQuestions[indicatorIndex];

  const completedCriteria = criteriaIndex + 1;
  const completedIndicator = indicatorIndex + 1;

  function updateCriteriaComparison(key, value) {
    setCriteriaComparisons((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateIndicatorComparison(criteriaCode, key, value) {
    setIndicatorComparisons((current) => ({
      ...current,
      [criteriaCode]: {
        ...current[criteriaCode],
        [key]: value,
      },
    }));
  }

  function goNextCriteria() {
    if (criteriaIndex < criteriaPairs.length - 1) {
      setCriteriaIndex((current) => current + 1);
      return;
    }

    setActiveStep(2);
  }

  function goPreviousCriteria() {
    if (criteriaIndex > 0) {
      setCriteriaIndex((current) => current - 1);
      return;
    }

    setActiveStep(0);
  }

  function goNextIndicator() {
    if (indicatorIndex < indicatorQuestions.length - 1) {
      setIndicatorIndex((current) => current + 1);
      return;
    }

    setActiveStep(3);
  }

  function goPreviousIndicator() {
    if (indicatorIndex > 0) {
      setIndicatorIndex((current) => current - 1);
      return;
    }

    setActiveStep(1);
  }

  function resetForm() {
    setCriteriaComparisons(createEqualComparisons(criteriaPairs));
    setIndicatorComparisons(buildInitialIndicatorComparisons(kriteriaItems, indikatorItems));
    setCriteriaIndex(0);
    setIndicatorIndex(0);
    setActiveStep(0);
  }

  async function saveAndOpenMap() {
    setIsSaving(true);

    const result = await weightService.saveCustomAhpWeights({
      criteriaComparisons,
      indicatorComparisons,
      kriteriaItems,
      indikatorItems
    });

    setIsSaving(false);

    if (result.isConsistent) {
      navigate("/peta-rekomendasi");
    }
  }

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-stone-500">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-stone-300 border-t-[#1D3557]"></div>
          <p className="font-semibold text-sm">Memuat kriteria & indikator...</p>
        </div>
      </PublicLayout>
    );
  }

  const sortedIndicators = [...indikatorItems].sort(
    (a, b) =>
      Number(globalIndicatorWeights[b.code] || 0) -
      Number(globalIndicatorWeights[a.code] || 0)
  );

  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="space-y-6">
          <Card className="p-8 border border-stone-200/60 shadow-xs rounded-3xl bg-white w-full">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Coffee size={18} className="text-[#577590]" />
                  <p className="text-xs font-bold uppercase tracking-wider text-[#577590]">
                    Kuesioner AHP
                  </p>
                </div>

                <h2 className="mt-3 text-xl font-black text-[#1D3557] tracking-wide">
                  Pembobotan Kriteria dan Indikator
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
                  Tentukan prioritas kriteria dan indikator untuk menghasilkan
                  bobot rekomendasi lokasi coffee shop.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="rounded-2xl bg-stone-50 p-4 text-center border border-stone-100">
                  <p className="text-2xl font-black text-[#1D3557]">
                    {kriteriaItems.length}
                  </p>
                  <p className="text-xs text-stone-500">Kriteria</p>
                </div>

                <div className="rounded-2xl bg-stone-50 p-4 text-center border border-stone-100">
                  <p className="text-2xl font-black text-[#1D3557]">
                    {indikatorItems.length}
                  </p>
                  <p className="text-xs text-stone-500">Indikator</p>
                </div>

                <div
                  className={`rounded-2xl p-4 text-center border ${isAllConsistent
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                    : "bg-amber-50 border-amber-100 text-amber-800"
                    }`}
                >
                  <p className="text-2xl font-black">
                    {isAllConsistent ? "OK" : "CR"}
                  </p>
                  <p className="text-xs">
                    {isAllConsistent ? "Konsisten" : "Periksa Jawaban"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <PublicAhpStepper activeStep={activeStep} />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              {activeStep === 0 && (
                <PublicIntroCard
                  onStart={() => setActiveStep(1)}
                  onOpenMap={() => navigate("/peta-rekomendasi")}
                  criteriaCount={kriteriaItems.length}
                />
              )}

              {activeStep === 1 && activeCriteriaPair && (
                <>
                  <PublicPairwiseQuestion
                    title="Tahap 1 - Perbandingan Antar Kriteria"
                    helper="Bandingkan kriteria utama dengan mempertimbangkan indikator yang berada di dalamnya."
                    pair={activeCriteriaPair}
                    value={criteriaComparisons[activeCriteriaPair.key]}
                    onChange={(value) =>
                      updateCriteriaComparison(activeCriteriaPair.key, value)
                    }
                    questionNumber={completedCriteria}
                    totalQuestions={criteriaPairs.length}
                  />

                  <div className="flex flex-wrap justify-between gap-3">
                    <button
                      type="button"
                      onClick={goPreviousCriteria}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-xs font-bold text-stone-600 transition hover:bg-stone-50 active:scale-95 cursor-pointer uppercase tracking-wider"
                    >
                      <ArrowLeft size={16} />
                      Kembali
                    </button>

                    <button
                      type="button"
                      onClick={goNextCriteria}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#577590] px-5 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#1D3557] active:scale-95 cursor-pointer uppercase tracking-wider"
                    >
                      {criteriaIndex === criteriaPairs.length - 1
                        ? "Lanjut ke Indikator"
                        : "Pertanyaan Berikutnya"}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              )}

              {activeStep === 2 && activeIndicatorPair && (
                <>
                  <Card className="p-5 border border-stone-200/60 shadow-xs rounded-3xl bg-white">
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#577590]">
                          Kriteria Aktif
                        </p>

                        <h2 className="mt-2 text-xl font-black text-[#1D3557]">
                          {activeIndicatorPair.criteriaName}
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-stone-500">
                          Sekarang bandingkan indikator yang berada di dalam
                          kriteria ini.
                        </p>
                      </div>

                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">
                        {completedIndicator} dari {indicatorQuestions.length}
                      </span>
                    </div>
                  </Card>

                  <PublicPairwiseQuestion
                    title="Tahap 2 - Perbandingan Antar Indikator"
                    helper="Penilaian dilakukan hanya pada indikator yang berada dalam kriteria yang sama."
                    pair={activeIndicatorPair}
                    value={
                      indicatorComparisons[activeIndicatorPair.criteriaCode]?.[
                      activeIndicatorPair.key
                      ]
                    }
                    onChange={(value) =>
                      updateIndicatorComparison(
                        activeIndicatorPair.criteriaCode,
                        activeIndicatorPair.key,
                        value
                      )
                    }
                    questionNumber={completedIndicator}
                    totalQuestions={indicatorQuestions.length}
                  />

                  <div className="flex flex-wrap justify-between gap-3">
                    <button
                      type="button"
                      onClick={goPreviousIndicator}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-xs font-bold text-stone-600 transition hover:bg-stone-50 active:scale-95 cursor-pointer uppercase tracking-wider"
                    >
                      <ArrowLeft size={16} />
                      Kembali
                    </button>

                    <button
                      type="button"
                      onClick={goNextIndicator}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#577590] px-5 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#1D3557] active:scale-95 cursor-pointer uppercase tracking-wider"
                    >
                      {indicatorIndex === indicatorQuestions.length - 1
                        ? "Lihat Hasil Bobot"
                        : "Pertanyaan Berikutnya"}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              )}

              {activeStep === 3 && (
                <>
                  <Card
                    className={`p-8 border shadow-xs rounded-3xl bg-white ${isAllConsistent ? "border-emerald-100" : "border-red-100"
                      }`}
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div className="flex items-start gap-3">
                        <span
                          className={`rounded-2xl p-3 ${isAllConsistent
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                            }`}
                        >
                          {isAllConsistent ? (
                            <CheckCircle2 size={22} />
                          ) : (
                            <TriangleAlert size={22} />
                          )}
                        </span>

                        <div>
                          <p
                            className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${isAllConsistent
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-red-50 text-red-700 border border-red-100"
                              }`}
                          >
                            {isAllConsistent
                              ? "Siap diterapkan"
                              : "Perlu revisi"}
                          </p>

                          <h1 className="mt-3 text-2xl font-black text-[#1D3557]">
                            Hasil Pembobotan AHP
                          </h1>

                          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
                            Bobot ini akan disimpan sementara di browser dan
                            digunakan untuk menghitung ulang WLC pada halaman
                            peta rekomendasi.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={resetForm}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-xs font-bold text-stone-600 transition hover:bg-stone-50 active:scale-95 cursor-pointer uppercase tracking-wider"
                        >
                          <RotateCcw size={16} />
                          Reset
                        </button>

                        <button
                          type="button"
                          disabled={!isAllConsistent || isSaving}
                          onClick={saveAndOpenMap}
                          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold uppercase tracking-wider shadow-md transition ${!isAllConsistent || isSaving
                            ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                            : "bg-[#1D3557] text-white hover:bg-[#2c4c78] active:scale-95 cursor-pointer"
                            }`}
                        >
                          <Save size={16} />
                          {isSaving ? "Menyimpan..." : "Terapkan ke Peta"}
                        </button>
                      </div>
                    </div>
                  </Card>

                  <PublicWeightResult
                    criteriaWeights={criteriaResult.weightsPercent}
                    localIndicatorWeights={localIndicatorWeights}
                    globalIndicatorWeights={globalIndicatorWeights}
                    criteriaList={kriteriaItems}
                    indicatorsList={indikatorItems}
                  />
                </>
              )}

              {activeStep === 3 && (
                <div className="flex flex-wrap justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-xs font-bold text-stone-600 transition hover:bg-stone-50 active:scale-95 cursor-pointer uppercase tracking-wider"
                  >
                    <ArrowLeft size={16} />
                    Kembali ke Indikator
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/peta-rekomendasi")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-xs font-bold text-stone-600 transition hover:bg-stone-50 active:scale-95 cursor-pointer uppercase tracking-wider"
                  >
                    <Map size={16} />
                    Buka Peta Tanpa Menyimpan
                  </button>
                </div>
              )}
            </div>

            <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
              <PublicScaleGuide />

              <PublicConsistencyCard
                title="Konsistensi Kriteria"
                result={criteriaResult}
              />

              <Card className="p-5 border border-stone-200/60 shadow-xs rounded-3xl bg-white">
                <h3 className="font-extrabold text-[#1D3557]">
                  Konsistensi Kriteria Lokal
                </h3>

                <div className="mt-3 space-y-2">
                  {kriteriaItems.map((criterion) => {
                    const result = localResults[criterion.code] || { isConsistent: true, cr: 0 };

                    return (
                      <div
                        key={criterion.code}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-3 py-2"
                      >
                        <span className="text-sm font-semibold text-stone-700 font-bold">
                          {criterion.name}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${result.isConsistent
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                            }`}
                        >
                          CR {result.cr}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-3 text-xs leading-5 text-stone-500">
                  Semua nilai CR harus maksimal 0,1 agar tombol Terapkan ke
                  Peta aktif.
                </p>
              </Card>
            </aside>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}