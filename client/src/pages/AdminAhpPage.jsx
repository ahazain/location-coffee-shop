import { Fragment, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Plus,
  RotateCcw,
  Save,
  Scale,
  Trash2,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import Card from "../components/common/Card";
import Toast from "../components/common/Toast";
import ConfirmationModal from "../components/common/ConfirmationModal";
import AdminLayout from "../layouts/AdminLayout";
import { ahpService } from "../services/api/ahpService";
import { pakarService } from "../services/api/pakarService";
import { kriteriaService } from "../services/api/kriteriaService";
import { indikatorService } from "../services/api/indikatorService";
import {
  calculateAhpFromComparisons,
  createEqualComparisons,
  generatePairs,
  matrixFromComparisons,
  saatyScale,
} from "../utils/ahp";

const steps = [
  { title: "Pakar" },
  { title: "Kriteria" },
  { title: "Indikator" },
  { title: "Hasil" },
];

const preferenceOptions = [
  { value: "left", label: "Pilihan A lebih penting" },
  { value: "equal", label: "Sama penting" },
  { value: "right", label: "Pilihan B lebih penting" },
];

function formatPercent(value, digit = 2) {
  return `${Number(value || 0).toFixed(digit)}%`;
}

function formatFractionPercent(value, digit = 2) {
  return `${(Number(value || 0) * 100).toFixed(digit)}%`;
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

function buildInitialIndicatorComparisons(criteriaItems, indicatorItems) {
  return Object.fromEntries(
    criteriaItems.map((criterion) => {
      const items = indicatorItems.filter(
        (indicator) => indicator.criteriaCode === criterion.code
      );

      return [criterion.code, createEqualComparisons(generatePairs(items))];
    })
  );
}

function resolveServiceMethod(service, methodNames) {
  return methodNames.find((name) => typeof service?.[name] === "function");
}

function getPakarName(pakar) {
  return pakar.institusi || pakar.nama_pakar || "-";
}

function getPakarBobotAkhir(indicator, pakarId) {
  const pakarWeights =
    indicator.pakar_weights ||
    indicator.bobot_pakar ||
    indicator.bobot_akhir_pakar ||
    [];

  const found = pakarWeights.find(
    (item) => item.id_pakar?.toString() === pakarId?.toString()
  );

  return found?.bobot_akhir ?? found?.bobot ?? null;
}

function AdminStepper({ activeStep }) {
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

function AdminConsistencyCard({ title, result, compact = false }) {
  const isConsistent = result?.isConsistent ?? true;

  return (
    <Card
      className={`p-5 border ${isConsistent ? "border-emerald-100" : "border-red-100"
        }`}
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

function AdminScaleGuide() {
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

function AdminPairwiseQuestion({
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

function WeightBar({ label, value, helper, valueIsFraction = false }) {
  const percent = valueIsFraction ? Number(value || 0) * 100 : Number(value || 0);

  return (
    <div>
      <div className="mb-1 flex items-start justify-between gap-3 text-sm">
        <div>
          <p className="font-semibold text-stone-800">{label}</p>
          {helper && <p className="text-xs leading-5 text-stone-500">{helper}</p>}
        </div>

        <span className="font-black text-[#1D3557]">
          {formatPercent(percent)}
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full bg-[#577590]"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminAhpPage() {
  const [konsensus, setKonsensus] = useState(null);
  const [kriteriaItems, setKriteriaItems] = useState([]);
  const [indikatorItems, setIndikatorItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState(null);
  const [modalConfig, setModalConfig] = useState(null);

  const [isPakarModalOpen, setIsPakarModalOpen] = useState(false);
  const [newPakar, setNewPakar] = useState({
    nama_pakar: "",
    institusi: "",
    jabatan: "",
  });

  const [selectedPakarId, setSelectedPakarId] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [criteriaIndex, setCriteriaIndex] = useState(0);
  const [indicatorIndex, setIndicatorIndex] = useState(0);

  const [criteriaComparisons, setCriteriaComparisons] = useState({});
  const [indicatorComparisons, setIndicatorComparisons] = useState({});

  async function loadData({ initializeForm = false } = {}) {
    try {
      setLoading(true);

      const [konsensusData, kriteriaData, indikatorData] = await Promise.all([
        ahpService.getBobotKonsensus(),
        kriteriaService.getAll(),
        indikatorService.getAll(),
      ]);

      const mappedKriteria = getArrayData(kriteriaData)
        .map(mapKriteriaItem)
        .filter((item) => item.id !== 6 && item.code !== "6")
        .sort((a, b) => a.urutan - b.urutan);

      const mappedIndikator = getArrayData(indikatorData)
        .map(mapIndikatorItem)
        .filter((item) => item.criteriaId !== 6 && item.criteriaCode !== "6")
        .sort((a, b) => a.urutan - b.urutan);

      setKonsensus(konsensusData);
      setKriteriaItems(mappedKriteria);
      setIndikatorItems(mappedIndikator);

      const pakarList = konsensusData?.pakar || [];

      setSelectedPakarId((current) => {
        const currentStillExists = pakarList.some(
          (pakar) => pakar.id_pakar?.toString() === current?.toString()
        );

        if (current && currentStillExists) return current;

        return pakarList[0]?.id_pakar || "";
      });

      if (initializeForm) {
        setCriteriaComparisons(
          createEqualComparisons(generatePairs(mappedKriteria))
        );

        setIndicatorComparisons(
          buildInitialIndicatorComparisons(mappedKriteria, mappedIndikator)
        );
      }
    } catch (err) {
      setToast({
        type: "error",
        message: `Gagal memuat data AHP: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData({ initializeForm: true });
  }, []);

  const criteriaPairs = useMemo(
    () => generatePairs(kriteriaItems),
    [kriteriaItems]
  );

  const indicatorQuestions = useMemo(() => {
    return kriteriaItems.flatMap((criterion) => {
      const items = indikatorItems.filter(
        (indicator) => indicator.criteriaCode === criterion.code
      );

      return generatePairs(items).map((pair) => ({
        ...pair,
        criteriaCode: criterion.code,
        criteriaId: criterion.id,
        criteriaName: criterion.name,
      }));
    });
  }, [kriteriaItems, indikatorItems]);

  const criteriaResult = useMemo(
    () => calculateAhpFromComparisons(kriteriaItems, criteriaComparisons),
    [kriteriaItems, criteriaComparisons]
  );

  const localResults = useMemo(() => {
    return Object.fromEntries(
      kriteriaItems.map((criterion) => {
        const items = indikatorItems.filter(
          (indicator) => indicator.criteriaCode === criterion.code
        );

        return [
          criterion.code,
          calculateAhpFromComparisons(
            items,
            indicatorComparisons[criterion.code] || {}
          ),
        ];
      })
    );
  }, [kriteriaItems, indikatorItems, indicatorComparisons]);

  const localIndicatorWeights = useMemo(() => {
    return Object.fromEntries(
      Object.entries(localResults).map(([criteriaCode, result]) => [
        criteriaCode,
        result.weightsPercent,
      ])
    );
  }, [localResults]);

  const manualIndicatorRows = useMemo(() => {
    return indikatorItems
      .map((indicator) => {
        const criteriaWeightPercent =
          criteriaResult.weightsPercent?.[indicator.criteriaCode] || 0;

        const localWeightPercent =
          localIndicatorWeights?.[indicator.criteriaCode]?.[indicator.code] || 0;

        const globalPercent =
          (criteriaWeightPercent / 100) * (localWeightPercent / 100) * 100;

        const criterion = kriteriaItems.find(
          (item) => item.code === indicator.criteriaCode
        );

        return {
          ...indicator,
          criteriaName: criterion?.name || "-",
          localWeightPercent,
          globalPercent,
        };
      })
      .sort((a, b) => b.globalPercent - a.globalPercent);
  }, [indikatorItems, kriteriaItems, criteriaResult, localIndicatorWeights]);

  const allLocalConsistent = Object.values(localResults).every(
    (result) => result.isConsistent
  );

  const isAllConsistent = criteriaResult.isConsistent && allLocalConsistent;

  const activeCriteriaPair = criteriaPairs[criteriaIndex];
  const activeIndicatorPair = indicatorQuestions[indicatorIndex];

  const totalBobotKonsensus = useMemo(() => {
    if (!konsensus?.bobot_kriteria) return 0;

    return konsensus.bobot_kriteria.reduce(
      (sum, item) => sum + Number(item.bobot || 0),
      0
    );
  }, [konsensus]);

  const sortedKonsensusIndikator = useMemo(() => {
    return [...(konsensus?.bobot_indikator || [])].sort(
      (a, b) =>
        Number(b.bobot_rata_rata || b.bobot_akhir || 0) -
        Number(a.bobot_rata_rata || a.bobot_akhir || 0)
    );
  }, [konsensus]);

  const pakarColumns = useMemo(() => {
    return (konsensus?.pakar || []).map((pakar) => ({
      id_pakar: pakar.id_pakar,
      nama: getPakarName(pakar),
    }));
  }, [konsensus]);

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

  function resetManualForm() {
    setCriteriaComparisons(createEqualComparisons(criteriaPairs));
    setIndicatorComparisons(
      buildInitialIndicatorComparisons(kriteriaItems, indikatorItems)
    );
    setCriteriaIndex(0);
    setIndicatorIndex(0);
    setActiveStep(0);
  }

  async function handleAddPakar(event) {
    event.preventDefault();
    setSaving(true);

    try {
      const created = await pakarService.create(newPakar);

      setToast({
        type: "success",
        message: "Pakar berhasil ditambahkan.",
      });

      setIsPakarModalOpen(false);
      setNewPakar({
        nama_pakar: "",
        institusi: "",
        jabatan: "",
      });

      await loadData();

      if (created?.id_pakar) {
        setSelectedPakarId(created.id_pakar);
      }
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Gagal menambahkan pakar.",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleDeletePakar(pakar) {
    setModalConfig({
      isOpen: true,
      title: "Konfirmasi Hapus Pakar",
      message: `Apakah Anda yakin ingin menghapus pakar "${pakar.nama_pakar}"? Data AHP terkait pakar ini akan ikut terhapus.`,
      variant: "danger",
      onConfirm: () => executeDeletePakar(pakar.id_pakar),
    });
  }

  async function executeDeletePakar(idPakar) {
    setModalConfig(null);
    setSaving(true);

    try {
      await pakarService.delete(idPakar);

      setToast({
        type: "success",
        message: "Pakar berhasil dihapus.",
      });

      await loadData();
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Gagal menghapus pakar.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveKriteriaAHP(payload) {
    const methodName = resolveServiceMethod(ahpService, [
      "saveKriteriaAHP",
      "saveKriteriaAhp",
      "saveKriteria",
    ]);

    if (!methodName) {
      throw new Error(
        "Method saveKriteriaAHP belum ada di frontend ahpService."
      );
    }

    return ahpService[methodName](payload);
  }

  async function saveIndikatorAHP(payload) {
    const methodName = resolveServiceMethod(ahpService, [
      "saveIndikatorAHP",
      "saveIndikatorAhp",
      "saveIndikator",
    ]);

    if (!methodName) {
      throw new Error(
        "Method saveIndikatorAHP belum ada di frontend ahpService."
      );
    }

    if (methodName === "saveIndikator") {
      const { id_kriteria, ...rest } = payload;
      return ahpService.saveIndikator(id_kriteria, rest);
    }

    return ahpService[methodName](payload);
  }

  async function handleSaveManualAhp() {
    if (!selectedPakarId) {
      setToast({
        type: "error",
        message: "Pilih pakar terlebih dahulu sebelum menyimpan hasil AHP.",
      });
      return;
    }

    if (!isAllConsistent) {
      setToast({
        type: "error",
        message:
          "Hasil AHP belum konsisten. Pastikan semua nilai CR maksimal 0,1.",
      });
      return;
    }

    setSaving(true);

    try {
      const idPakar = Number(selectedPakarId);

      const criteriaMatrix = matrixFromComparisons(
        kriteriaItems,
        criteriaComparisons
      );

      await saveKriteriaAHP({
        id_pakar: idPakar,
        matrix: criteriaMatrix,
        item_ids: kriteriaItems.map((item) => item.id),
      });

      for (const criterion of kriteriaItems) {
        const items = indikatorItems.filter(
          (indicator) => indicator.criteriaCode === criterion.code
        );

        if (items.length === 0) continue;

        const indicatorMatrix = matrixFromComparisons(
          items,
          indicatorComparisons[criterion.code] || {}
        );

        await saveIndikatorAHP({
          id_pakar: idPakar,
          id_kriteria: criterion.id,
          matrix: indicatorMatrix,
          item_ids: items.map((item) => item.id),
        });
      }

      setToast({
        type: "success",
        message:
          "Hasil AHP admin berhasil disimpan dan bobot konsensus diperbarui.",
      });

      await loadData();
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Gagal menyimpan hasil AHP admin.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Card className="p-8 border border-stone-200/60 shadow-xs rounded-3xl bg-white w-full">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="mt-3 text-xl font-black text-[#1D3557] tracking-wide">
                AHP Responden
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
                Kelola pakar, input perbandingan AHP manual dari admin, lalu
                simpan hasilnya sebagai bobot kriteria dan indikator untuk WLC.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="rounded-2xl bg-stone-50 p-4 text-center border border-stone-100">
                <p className="text-2xl font-black text-[#1D3557]">
                  {konsensus?.total_pakar ?? (loading ? "..." : 0)}
                </p>
                <p className="text-xs text-stone-500">Pakar Aktif</p>
              </div>

              <div className="rounded-2xl bg-stone-50 p-4 text-center border border-stone-100">
                <p className="text-2xl font-black text-[#1D3557]">
                  {kriteriaItems.length}
                </p>
                <p className="text-xs text-stone-500">Kriteria</p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4 text-center border border-emerald-100 text-emerald-800">
                <p className="text-2xl font-black">
                  {formatFractionPercent(totalBobotKonsensus, 1)}
                </p>
                <p className="text-xs">Total Bobot</p>
              </div>
            </div>
          </div>
        </Card>

        <AdminStepper activeStep={activeStep} />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            {activeStep === 0 && (
              <Card className="p-8 border border-stone-200/60 shadow-xs rounded-3xl bg-white">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div>
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-blue-50 p-4 text-[#577590] border border-blue-100/50">
                        <UsersRound className="h-7 w-7" />
                      </div>

                      <div>
                        <h3 className="text-base font-extrabold text-[#1D3557] tracking-wide">
                          Pilih Pakar / Responden
                        </h3>

                        <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-500">
                          Pilih pakar yang akan diinputkan hasil AHP-nya oleh
                          admin. Setelah hasil disimpan, sistem akan menghitung
                          ulang bobot konsensus.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
                      <select
                        value={selectedPakarId || ""}
                        onChange={(event) =>
                          setSelectedPakarId(event.target.value)
                        }
                        className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm font-semibold text-stone-700 outline-none transition focus:border-[#1D3557] focus:ring-4 focus:ring-blue-50/50"
                      >
                        <option value="" disabled>
                          -- Pilih Pakar --
                        </option>

                        {(konsensus?.pakar || []).map((pakar) => (
                          <option key={pakar.id_pakar} value={pakar.id_pakar}>
                            {pakar.nama_pakar}
                            {pakar.institusi ? ` - ${pakar.institusi}` : ""}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => setIsPakarModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1D3557] px-5 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#2c4c78] active:scale-95 cursor-pointer uppercase tracking-wider"
                      >
                        <Plus size={16} />
                        Tambah Pakar
                      </button>
                    </div>

                    <div className="mt-6 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl bg-stone-50 p-4 border border-stone-100">
                        <p className="font-bold text-[#1D3557]">
                          1. Bandingkan kriteria
                        </p>
                        <p className="mt-2 text-sm leading-6 text-stone-500">
                          Admin mengisi perbandingan antar kriteria utama.
                        </p>
                      </div>

                      <div className="rounded-2xl bg-stone-50 p-4 border border-stone-100">
                        <p className="font-bold text-[#1D3557]">
                          2. Bandingkan indikator
                        </p>
                        <p className="mt-2 text-sm leading-6 text-stone-500">
                          Indikator dibandingkan dalam kriteria masing-masing.
                        </p>
                      </div>

                      <div className="rounded-2xl bg-stone-50 p-4 border border-stone-100">
                        <p className="font-bold text-[#1D3557]">
                          3. Simpan hasil
                        </p>
                        <p className="mt-2 text-sm leading-6 text-stone-500">
                          Bobot disimpan jika CR semua tahap maksimal 0,1.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    disabled={!selectedPakarId || kriteriaItems.length === 0}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold uppercase tracking-wider shadow-md transition ${!selectedPakarId || kriteriaItems.length === 0
                        ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                        : "bg-[#577590] text-white hover:bg-[#1D3557] active:scale-95 cursor-pointer"
                      }`}
                  >
                    Mulai Perbandingan Kriteria
                    <ArrowRight size={16} />
                  </button>
                </div>
              </Card>
            )}

            {activeStep === 1 && (
              <>
                {activeCriteriaPair ? (
                  <AdminPairwiseQuestion
                    title="Tahap 1 - Perbandingan Antar Kriteria"
                    helper="Bandingkan kriteria utama berdasarkan tingkat kepentingannya terhadap rekomendasi lokasi coffee shop."
                    pair={activeCriteriaPair}
                    value={criteriaComparisons[activeCriteriaPair.key]}
                    onChange={(value) =>
                      updateCriteriaComparison(activeCriteriaPair.key, value)
                    }
                    questionNumber={criteriaIndex + 1}
                    totalQuestions={criteriaPairs.length}
                  />
                ) : (
                  <Card className="p-8 border border-stone-200/60 shadow-xs rounded-3xl bg-white">
                    <p className="text-sm text-stone-500">
                      Data kriteria belum cukup untuk perbandingan AHP.
                    </p>
                  </Card>
                )}

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

            {activeStep === 2 && (
              <>
                {activeIndicatorPair ? (
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
                            Sekarang bandingkan indikator yang berada dalam
                            kriteria ini.
                          </p>
                        </div>

                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">
                          {indicatorIndex + 1} dari {indicatorQuestions.length}
                        </span>
                      </div>
                    </Card>

                    <AdminPairwiseQuestion
                      title="Tahap 2 - Perbandingan Antar Indikator"
                      helper="Penilaian dilakukan hanya pada indikator yang berada dalam kriteria yang sama."
                      pair={activeIndicatorPair}
                      value={
                        indicatorComparisons[
                        activeIndicatorPair.criteriaCode
                        ]?.[activeIndicatorPair.key]
                      }
                      onChange={(value) =>
                        updateIndicatorComparison(
                          activeIndicatorPair.criteriaCode,
                          activeIndicatorPair.key,
                          value
                        )
                      }
                      questionNumber={indicatorIndex + 1}
                      totalQuestions={indicatorQuestions.length}
                    />
                  </>
                ) : (
                  <Card className="p-8 border border-stone-200/60 shadow-xs rounded-3xl bg-white">
                    <p className="text-sm text-stone-500">
                      Data indikator belum cukup untuk perbandingan AHP.
                    </p>
                  </Card>
                )}

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
                          {isAllConsistent ? "Siap disimpan" : "Perlu revisi"}
                        </p>

                        <h1 className="mt-3 text-2xl font-black text-[#1D3557]">
                          Hasil Pembobotan AHP Admin
                        </h1>

                        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
                          Hasil ini akan disimpan untuk pakar terpilih. Setelah
                          tersimpan, bobot konsensus akan dihitung ulang dan
                          digunakan oleh proses WLC.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={resetManualForm}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-xs font-bold text-stone-600 transition hover:bg-stone-50 active:scale-95 cursor-pointer uppercase tracking-wider"
                      >
                        <RotateCcw size={16} />
                        Reset
                      </button>

                      <button
                        type="button"
                        disabled={!isAllConsistent || saving}
                        onClick={handleSaveManualAhp}
                        className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold uppercase tracking-wider shadow-md transition ${!isAllConsistent || saving
                            ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                            : "bg-[#1D3557] text-white hover:bg-[#2c4c78] active:scale-95 cursor-pointer"
                          }`}
                      >
                        <Save size={16} />
                        {saving ? "Menyimpan..." : "Simpan Hasil AHP"}
                      </button>
                    </div>
                  </div>
                </Card>

                <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <Card className="p-5 border border-stone-200/60 shadow-xs rounded-3xl bg-white">
                    <div className="flex items-center gap-3">
                      <span className="rounded-2xl bg-blue-50 p-3 text-[#577590] border border-blue-100/50">
                        <BarChart3 size={18} />
                      </span>

                      <div>
                        <h3 className="font-extrabold text-[#1D3557]">
                          Bobot Kriteria Manual
                        </h3>

                        <p className="text-sm text-stone-500">
                          Hasil dari perbandingan antar kriteria.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-4">
                      {kriteriaItems.map((criterion) => (
                        <WeightBar
                          key={criterion.code}
                          label={criterion.name}
                          value={criteriaResult.weightsPercent[criterion.code]}
                        />
                      ))}
                    </div>
                  </Card>

                  <Card className="p-5 border border-stone-200/60 shadow-xs rounded-3xl bg-white">
                    <div className="flex items-center gap-3">
                      <span className="rounded-2xl bg-blue-50 p-3 text-[#577590] border border-blue-100/50">
                        <BarChart3 size={18} />
                      </span>

                      <div>
                        <h3 className="font-extrabold text-[#1D3557]">
                          Bobot Akhir Indikator Manual
                        </h3>

                        <p className="text-sm text-stone-500">
                          Bobot akhir = bobot kriteria × bobot lokal indikator.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-4">
                      {manualIndicatorRows.map((indicator) => (
                        <WeightBar
                          key={indicator.code}
                          label={indicator.name}
                          value={indicator.globalPercent}
                          helper={`Kriteria: ${indicator.criteriaName} • Lokal: ${formatPercent(
                            indicator.localWeightPercent
                          )}`}
                        />
                      ))}
                    </div>
                  </Card>
                </div>

                <div className="flex flex-wrap justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-xs font-bold text-stone-600 transition hover:bg-stone-50 active:scale-95 cursor-pointer uppercase tracking-wider"
                  >
                    <ArrowLeft size={16} />
                    Kembali ke Indikator
                  </button>
                </div>
              </>
            )}
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <AdminScaleGuide />

            <AdminConsistencyCard
              title="Konsistensi Kriteria"
              result={criteriaResult}
            />

            <Card className="p-5 border border-stone-200/60 shadow-xs rounded-3xl bg-white">
              <h3 className="font-extrabold text-[#1D3557]">
                Konsistensi Indikator
              </h3>

              <div className="mt-3 space-y-2">
                {kriteriaItems.map((criterion) => {
                  const result = localResults[criterion.code];

                  return (
                    <div
                      key={criterion.code}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-3 py-2"
                    >
                      <span className="text-sm font-semibold text-stone-700">
                        {criterion.name}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${result?.isConsistent
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                          }`}
                      >
                        CR {result?.cr ?? 0}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 text-xs leading-5 text-stone-500">
                Semua nilai CR harus maksimal 0,1 agar hasil AHP bisa disimpan.
              </p>
            </Card>
          </aside>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-0 border border-stone-200/60 shadow-xs rounded-3xl bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5 bg-white">
              <div>
                <h2 className="text-[#1D3557] font-extrabold text-sm tracking-wide">
                  Daftar Pakar / Responden
                </h2>

                <p className="mt-1 text-xs text-stone-500">
                  Pakar yang menjadi sumber perhitungan bobot konsensus.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPakarModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1D3557] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#2c4c78] active:scale-95 cursor-pointer uppercase tracking-wider"
              >
                <Plus size={15} />
                Tambah
              </button>
            </div>

            <div className="divide-y divide-stone-100">
              {loading ? (
                <div className="px-6 py-12 text-center text-xs font-semibold text-stone-400 bg-white">
                  Memuat data...
                </div>
              ) : (konsensus?.pakar || []).length === 0 ? (
                <div className="px-6 py-12 text-center text-xs font-semibold text-stone-400 bg-white">
                  Belum ada pakar.
                </div>
              ) : (
                (konsensus?.pakar || []).map((pakar) => (
                  <div
                    key={pakar.id_pakar}
                    className="flex items-start justify-between gap-3 px-6 py-4 hover:bg-stone-50/40 transition"
                  >
                    <div>
                      <p className="font-extrabold text-[#1D3557] text-sm">
                        {pakar.nama_pakar}
                      </p>

                      <p className="mt-1 text-xs text-stone-500">
                        {pakar.jabatan || "-"} • {pakar.institusi || "-"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePakar(pakar)}
                      className="rounded-lg p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 transition active:scale-90 cursor-pointer"
                      title="Hapus Pakar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5 border border-stone-200/60 shadow-xs rounded-3xl bg-white">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-blue-50 p-3 text-[#577590] border border-blue-100/50">
                <BrainCircuit size={18} />
              </span>

              <div>
                <h3 className="font-extrabold text-[#1D3557]">
                  Bobot Kriteria Konsensus
                </h3>

                <p className="text-sm text-stone-500">
                  Bobot aktif yang digunakan untuk WLC.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {loading ? (
                <div className="py-6 text-center text-sm text-stone-400">
                  Memuat...
                </div>
              ) : (
                (konsensus?.bobot_kriteria || []).map((item) => (
                  <WeightBar
                    key={item.id_kriteria}
                    label={item.nama}
                    value={item.bobot}
                    helper={item.kode}
                    valueIsFraction
                  />
                ))
              )}
            </div>
          </Card>
        </div>

        <Card className="flex flex-col justify-between p-0 border border-stone-200/60 shadow-xs rounded-3xl bg-white w-full overflow-hidden">
          <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5 bg-white">
            <div>
              <h2 className="text-[#1D3557] font-extrabold text-sm tracking-wide">
                Bobot Akhir Indikator AHP
              </h2>

              <p className="mt-1 text-xs text-stone-500">
                Perbandingan bobot akhir setiap pakar dan bobot kalkulasi yang
                digunakan sebagai hasil konsensus untuk WLC.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#f8fafc]/50 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                <tr>
                  <th
                    rowSpan="2"
                    className="px-6 py-4 w-16 text-center align-middle"
                  >
                    NO
                  </th>

                  <th rowSpan="2" className="px-6 py-4 align-middle">
                    INDIKATOR
                  </th>

                  <th
                    colSpan={Math.max(pakarColumns.length, 1)}
                    className="px-6 py-4 text-center border-l border-stone-100"
                  >
                    BOBOT AKHIR PAKAR
                  </th>

                  <th
                    rowSpan="2"
                    className="px-6 py-4 text-right align-middle border-l border-stone-100"
                  >
                    BOBOT KALKULASI
                  </th>
                </tr>

                <tr>
                  {pakarColumns.length > 0 ? (
                    pakarColumns.map((pakar) => (
                      <th
                        key={pakar.id_pakar}
                        className="px-6 py-3 text-center border-l border-stone-100"
                      >
                        {pakar.nama}
                      </th>
                    ))
                  ) : (
                    <th className="px-6 py-3 text-center border-l border-stone-100">
                      Pakar
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={3 + Math.max(pakarColumns.length, 1)}
                      className="px-6 py-12 text-center text-xs font-semibold text-stone-400 bg-white"
                    >
                      Memuat data...
                    </td>
                  </tr>
                ) : sortedKonsensusIndikator.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3 + Math.max(pakarColumns.length, 1)}
                      className="px-6 py-12 text-center text-xs font-semibold text-stone-400 bg-white"
                    >
                      Belum ada bobot indikator.
                    </td>
                  </tr>
                ) : (
                  sortedKonsensusIndikator.map((item, index) => (
                    <tr
                      key={item.id_indikator}
                      className="hover:bg-stone-50/40 transition"
                    >
                      <td className="px-6 py-4 text-center font-semibold text-stone-400 font-mono">
                        {String(index + 1).padStart(2, "0")}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-extrabold text-[#1D3557] text-xs sm:text-sm">
                          {item.nama}
                        </p>
                      </td>

                      {pakarColumns.length > 0 ? (
                        pakarColumns.map((pakar) => {
                          const bobotPakar = getPakarBobotAkhir(
                            item,
                            pakar.id_pakar
                          );

                          return (
                            <td
                              key={pakar.id_pakar}
                              className="px-6 py-4 text-center font-semibold text-stone-500 border-l border-stone-50"
                            >
                              {bobotPakar === null || bobotPakar === undefined
                                ? "-"
                                : formatFractionPercent(bobotPakar, 4)}
                            </td>
                          );
                        })
                      ) : (
                        <td className="px-6 py-4 text-center font-semibold text-stone-400 border-l border-stone-50">
                          -
                        </td>
                      )}

                      <td className="px-6 py-4 text-right font-extrabold text-[#1D3557] border-l border-stone-100">
                        {formatFractionPercent(
                          item.bobot_rata_rata || item.bobot_akhir,
                          4
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {isPakarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-stone-200/60">
            <h3 className="mb-5 text-xl font-extrabold text-[#1D3557] tracking-wide">
              Tambah Pakar Baru
            </h3>

            <form onSubmit={handleAddPakar} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Nama Pakar
                </label>

                <input
                  type="text"
                  required
                  value={newPakar.nama_pakar}
                  onChange={(event) =>
                    setNewPakar({
                      ...newPakar,
                      nama_pakar: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-[#1D3557] focus:ring-4 focus:ring-blue-50/50"
                  placeholder="Misal: Budi Santoso"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Institusi / Coffee Shop
                </label>

                <input
                  type="text"
                  required
                  value={newPakar.institusi}
                  onChange={(event) =>
                    setNewPakar({
                      ...newPakar,
                      institusi: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-[#1D3557] focus:ring-4 focus:ring-blue-50/50"
                  placeholder="Misal: Cafe Kita"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Jabatan
                </label>

                <input
                  type="text"
                  required
                  value={newPakar.jabatan}
                  onChange={(event) =>
                    setNewPakar({
                      ...newPakar,
                      jabatan: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-[#1D3557] focus:ring-4 focus:ring-blue-50/50"
                  placeholder="Misal: Owner / Manager"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPakarModalOpen(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 active:scale-95 cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-95 ${saving
                      ? "bg-stone-300 cursor-not-allowed"
                      : "bg-[#577590] hover:bg-[#1D3557] cursor-pointer"
                    }`}
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalConfig && (
        <ConfirmationModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          message={modalConfig.message}
          variant={modalConfig.variant}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AdminLayout>
  );
}