import { useMemo, useState } from "react";
import { Save, UserPlus } from "lucide-react";
import AhpConsistencyCard from "../ahp/AhpConsistencyCard";
import AhpPairwiseQuestion from "../ahp/AhpPairwiseQuestion";
import AhpScaleGuide from "../ahp/AhpScaleGuide";
import AhpStepper from "../ahp/AhpStepper";
import AhpWeightResult from "../ahp/AhpWeightResult";
import Badge from "../common/Badge";
import Button from "../common/Button";
import Card from "../common/Card";
import { criteria } from "../../data/criteria";
import { indicators } from "../../data/indicators";
import { calculateAhpFromComparisons, createEqualComparisons, generatePairs } from "../../utils/ahp";
import { buildGlobalIndicatorWeights } from "../../utils/weights";
import { adminService } from "../../services/adminService";

const steps = [
  { title: "Identitas" },
  { title: "Kriteria" },
  { title: "Indikator" },
  { title: "Hasil" },
];

function getIndicatorsByCriteria(criteriaCode) {
  return indicators.filter((indicator) => indicator.criteriaCode === criteriaCode);
}

function buildInitialIndicatorComparisons() {
  return Object.fromEntries(
    criteria.map((criterion) => {
      const pairs = generatePairs(getIndicatorsByCriteria(criterion.code));
      return [criterion.code, createEqualComparisons(pairs)];
    }),
  );
}

function buildIndicatorQuestions() {
  return criteria.flatMap((criterion) => {
    const items = getIndicatorsByCriteria(criterion.code);
    return generatePairs(items).map((pair) => ({
      ...pair,
      criteriaCode: criterion.code,
      criteriaName: criterion.name,
    }));
  });
}

export default function AdminAhpRespondentWizard({ onSaved }) {
  const criteriaPairs = useMemo(() => generatePairs(criteria), []);
  const indicatorQuestions = useMemo(() => buildIndicatorQuestions(), []);
  const [activeStep, setActiveStep] = useState(0);
  const [criteriaIndex, setCriteriaIndex] = useState(0);
  const [indicatorIndex, setIndicatorIndex] = useState(0);
  const [savedMessage, setSavedMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    coffeeShop: "",
    role: "Pemilik",
    experience: "> 2 tahun",
    hasBranch: true,
  });
  const [criteriaComparisons, setCriteriaComparisons] = useState(() => createEqualComparisons(criteriaPairs));
  const [indicatorComparisons, setIndicatorComparisons] = useState(() => buildInitialIndicatorComparisons());

  const criteriaResult = useMemo(
    () => calculateAhpFromComparisons(criteria, criteriaComparisons),
    [criteriaComparisons],
  );

  const localResults = useMemo(
    () => Object.fromEntries(
      criteria.map((criterion) => {
        const items = getIndicatorsByCriteria(criterion.code);
        return [criterion.code, calculateAhpFromComparisons(items, indicatorComparisons[criterion.code])];
      }),
    ),
    [indicatorComparisons],
  );

  const localIndicatorWeights = useMemo(
    () => Object.fromEntries(
      Object.entries(localResults).map(([criteriaCode, result]) => [criteriaCode, result.weightsPercent]),
    ),
    [localResults],
  );

  const globalIndicatorWeights = useMemo(
    () => buildGlobalIndicatorWeights(criteriaResult.weightsPercent, localIndicatorWeights),
    [criteriaResult.weightsPercent, localIndicatorWeights],
  );

  const allLocalConsistent = Object.values(localResults).every((result) => result.isConsistent);
  const isAllConsistent = criteriaResult.isConsistent && allLocalConsistent;
  const activeCriteriaPair = criteriaPairs[criteriaIndex];
  const activeIndicatorPair = indicatorQuestions[indicatorIndex];

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function updateCriteriaComparison(key, value) {
    setCriteriaComparisons((current) => ({ ...current, [key]: value }));
    setSavedMessage("");
  }

  function updateIndicatorComparison(criteriaCode, key, value) {
    setIndicatorComparisons((current) => ({
      ...current,
      [criteriaCode]: {
        ...current[criteriaCode],
        [key]: value,
      },
    }));
    setSavedMessage("");
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

  function resetWizard() {
    setActiveStep(0);
    setCriteriaIndex(0);
    setIndicatorIndex(0);
    setSavedMessage("");
    setCriteriaComparisons(createEqualComparisons(criteriaPairs));
    setIndicatorComparisons(buildInitialIndicatorComparisons());
  }

  async function saveRespondent() {
    setIsSaving(true);
    const result = await adminService.saveAhpRespondent({
      profile,
      criteriaComparisons,
      indicatorComparisons,
      criteriaResult,
      localResults,
      globalIndicatorWeights,
      isConsistent: isAllConsistent,
    });
    setIsSaving(false);
    setSavedMessage(result.message);
    if (result.ok) onSaved?.();
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <Badge>Tambah responden AHP</Badge>
          <h2 className="mt-3 text-xl font-black text-stone-950">Input aktor/responden baru seperti kuesioner</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
            Admin dapat memasukkan hasil kuesioner responden baru. Jika CR konsisten, responden tersebut disimpan ke mock backend dan menandai WLC perlu dihitung ulang.
          </p>
        </div>
        <Button variant="secondary" onClick={resetWizard}>Reset form</Button>
      </div>

      <div className="mt-5">
        <AhpStepper steps={steps} activeStep={activeStep} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div>
          {activeStep === 0 && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-stone-700">Nama responden</span>
                  <input
                    value={profile.name}
                    onChange={(event) => updateProfile("name", event.target.value)}
                    placeholder="contoh: Bapak/Ibu ..."
                    className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-stone-700">Nama coffee shop</span>
                  <input
                    value={profile.coffeeShop}
                    onChange={(event) => updateProfile("coffeeShop", event.target.value)}
                    placeholder="contoh: Kedai Kopi ..."
                    className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-stone-700">Jabatan</span>
                  <select
                    value={profile.role}
                    onChange={(event) => updateProfile("role", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
                  >
                    <option>Pemilik</option>
                    <option>Manajer</option>
                    <option>Pengelola</option>
                    <option>Lainnya</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-stone-700">Lama usaha</span>
                  <select
                    value={profile.experience}
                    onChange={(event) => updateProfile("experience", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
                  >
                    <option>{"> 2 tahun"}</option>
                    <option>1 - 2 tahun</option>
                    <option>{"< 1 tahun"}</option>
                  </select>
                </label>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm font-semibold text-stone-700">
                <input
                  type="checkbox"
                  checked={profile.hasBranch}
                  onChange={(event) => updateProfile("hasBranch", event.target.checked)}
                  className="h-4 w-4 accent-amber-800"
                />
                Responden memiliki cabang / pengalaman membuka lebih dari satu lokasi
              </label>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setActiveStep(1)}><UserPlus size={16} /> Mulai perbandingan kriteria</Button>
              </div>
            </div>
          )}

          {activeStep === 1 && activeCriteriaPair && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-stone-50 p-4">
                <p className="text-sm font-bold text-stone-950">Perbandingan kriteria {criteriaIndex + 1} dari {criteriaPairs.length}</p>
                <p className="mt-1 text-sm text-stone-500">Responden membandingkan kriteria utama sesuai struktur hierarki AHP.</p>
              </div>
              <AhpPairwiseQuestion
                pair={activeCriteriaPair}
                value={criteriaComparisons[activeCriteriaPair.key]}
                onChange={(value) => updateCriteriaComparison(activeCriteriaPair.key, value)}
              />
              <div className="flex flex-wrap justify-between gap-3">
                <Button variant="secondary" onClick={goPreviousCriteria}>Kembali</Button>
                <Button onClick={goNextCriteria}>{criteriaIndex === criteriaPairs.length - 1 ? "Lanjut ke indikator" : "Pertanyaan berikutnya"}</Button>
              </div>
            </div>
          )}

          {activeStep === 2 && activeIndicatorPair && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-stone-50 p-4">
                <p className="text-sm font-bold text-stone-950">Kriteria aktif: {activeIndicatorPair.criteriaName}</p>
                <p className="mt-1 text-sm text-stone-500">Perbandingan indikator {indicatorIndex + 1} dari {indicatorQuestions.length}</p>
              </div>
              <AhpPairwiseQuestion
                pair={activeIndicatorPair}
                value={indicatorComparisons[activeIndicatorPair.criteriaCode]?.[activeIndicatorPair.key]}
                onChange={(value) => updateIndicatorComparison(activeIndicatorPair.criteriaCode, activeIndicatorPair.key, value)}
              />
              <div className="flex flex-wrap justify-between gap-3">
                <Button variant="secondary" onClick={goPreviousIndicator}>Kembali</Button>
                <Button onClick={goNextIndicator}>{indicatorIndex === indicatorQuestions.length - 1 ? "Lihat hasil responden" : "Pertanyaan berikutnya"}</Button>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-5">
              <div className={isAllConsistent ? "rounded-3xl border border-green-200 bg-green-50 p-4 text-green-800" : "rounded-3xl border border-red-200 bg-red-50 p-4 text-red-800"}>
                <p className="font-bold">{isAllConsistent ? "Responden konsisten dan siap digabung" : "Responden belum konsisten"}</p>
                <p className="mt-1 text-sm leading-6">
                  {isAllConsistent
                    ? "Bobot responden dapat disimpan sebagai aktor baru untuk memperbarui bobot default."
                    : "Periksa kembali perbandingan kriteria atau indikator yang CR-nya lebih dari 0,1."}
                </p>
              </div>

              <AhpWeightResult
                criteriaWeights={criteriaResult.weightsPercent}
                localIndicatorWeights={localIndicatorWeights}
                globalIndicatorWeights={globalIndicatorWeights}
              />

              {savedMessage && (
                <div className="rounded-3xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800">
                  {savedMessage}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => setActiveStep(2)}>Kembali ke indikator</Button>
                <Button onClick={saveRespondent} disabled={!isAllConsistent || isSaving}>
                  <Save size={16} /> {isSaving ? "Menyimpan..." : "Simpan responden AHP"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <AhpScaleGuide />
          <AhpConsistencyCard title="CR kriteria responden" result={criteriaResult} />
          <Card className="p-4">
            <h3 className="font-bold text-stone-950">CR indikator</h3>
            <div className="mt-3 space-y-2">
              {criteria.map((criterion) => {
                const result = localResults[criterion.code];
                return (
                  <div key={criterion.code} className="flex items-center justify-between gap-2 rounded-2xl bg-stone-50 px-3 py-2 text-sm">
                    <span className="truncate font-semibold text-stone-700">{criterion.name}</span>
                    <Badge variant={result?.isConsistent ? "green" : "red"}>{result?.cr ?? "-"}</Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </aside>
      </div>
    </Card>
  );
}
