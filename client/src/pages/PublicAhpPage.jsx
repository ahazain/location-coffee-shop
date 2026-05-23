import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Save, TriangleAlert } from "lucide-react";
import AhpConsistencyCard from "../components/ahp/AhpConsistencyCard";
import AhpIntroCard from "../components/ahp/AhpIntroCard";
import AhpPairwiseQuestion from "../components/ahp/AhpPairwiseQuestion";
import AhpScaleGuide from "../components/ahp/AhpScaleGuide";
import AhpStepper from "../components/ahp/AhpStepper";
import AhpWeightResult from "../components/ahp/AhpWeightResult";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { criteria } from "../data/criteria";
import { indicators } from "../data/indicators";
import PublicLayout from "../layouts/PublicLayout";
import { weightService } from "../services/weightService";
import {
  calculateAhpFromComparisons,
  createEqualComparisons,
  generatePairs,
} from "../utils/ahp";
import { cn } from "../utils/className";
import { buildGlobalIndicatorWeights } from "../utils/weights";

const steps = [
  { title: "Pengenalan" },
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
      const items = getIndicatorsByCriteria(criterion.code);
      return [criterion.code, createEqualComparisons(generatePairs(items))];
    }),
  );
}

function buildIndicatorQuestionList() {
  return criteria.flatMap((criterion) => {
    const items = getIndicatorsByCriteria(criterion.code);
    return generatePairs(items).map((pair) => ({
      ...pair,
      criteriaCode: criterion.code,
      criteriaName: criterion.name,
    }));
  });
}

export default function PublicAhpPage() {
  const navigate = useNavigate();
  const criteriaPairs = useMemo(() => generatePairs(criteria), []);
  const indicatorQuestions = useMemo(() => buildIndicatorQuestionList(), []);

  const [activeStep, setActiveStep] = useState(0);
  const [criteriaIndex, setCriteriaIndex] = useState(0);
  const [indicatorIndex, setIndicatorIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [criteriaComparisons, setCriteriaComparisons] = useState(() => createEqualComparisons(criteriaPairs));
  const [indicatorComparisons, setIndicatorComparisons] = useState(() => buildInitialIndicatorComparisons());

  const criteriaResult = useMemo(
    () => calculateAhpFromComparisons(criteria, criteriaComparisons),
    [criteriaComparisons],
  );

  const localResults = useMemo(() => Object.fromEntries(
    criteria.map((criterion) => {
      const items = getIndicatorsByCriteria(criterion.code);
      return [criterion.code, calculateAhpFromComparisons(items, indicatorComparisons[criterion.code])];
    }),
  ), [indicatorComparisons]);

  const localIndicatorWeights = useMemo(() => Object.fromEntries(
    Object.entries(localResults).map(([criteriaCode, result]) => [criteriaCode, result.weightsPercent]),
  ), [localResults]);

  const globalIndicatorWeights = useMemo(
    () => buildGlobalIndicatorWeights(criteriaResult.weightsPercent, localIndicatorWeights),
    [criteriaResult.weightsPercent, localIndicatorWeights],
  );

  const allLocalConsistent = Object.values(localResults).every((result) => result.isConsistent);
  const isAllConsistent = criteriaResult.isConsistent && allLocalConsistent;
  const activeCriteriaPair = criteriaPairs[criteriaIndex];
  const activeIndicatorPair = indicatorQuestions[indicatorIndex];
  const completedCriteria = criteriaIndex + 1;
  const completedIndicator = indicatorIndex + 1;

  function updateCriteriaComparison(key, value) {
    setCriteriaComparisons((current) => ({ ...current, [key]: value }));
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
    setIndicatorComparisons(buildInitialIndicatorComparisons());
    setCriteriaIndex(0);
    setIndicatorIndex(0);
    setActiveStep(0);
  }

  async function saveAndOpenMap() {
    setIsSaving(true);
    const result = await weightService.saveCustomAhpWeights({ criteriaComparisons, indicatorComparisons });
    setIsSaving(false);

    if (result.isConsistent) {
      navigate("/peta-rekomendasi");
    }
  }

  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-6">
        <AhpStepper steps={steps} activeStep={activeStep} />

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            {activeStep === 0 && (
              <>
                <AhpIntroCard />
                <Card className="p-5">
                  <h2 className="text-xl font-black text-stone-950">Sebelum mulai</h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="font-bold text-stone-900">1. Tidak perlu hitung manual</p>
                      <p className="mt-2 text-sm leading-6 text-stone-500">Anda hanya mengisi pilihan. Matriks, bobot, dan CR dihitung otomatis oleh sistem.</p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="font-bold text-stone-900">2. Jawab secara konsisten</p>
                      <p className="mt-2 text-sm leading-6 text-stone-500">CR harus ≤ 0,1 agar bobot dapat dipakai untuk memperbarui peta.</p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="font-bold text-stone-900">3. Bisa kembali kapan saja</p>
                      <p className="mt-2 text-sm leading-6 text-stone-500">Gunakan tombol kembali jika ingin memperbaiki jawaban sebelumnya.</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button onClick={() => setActiveStep(1)}>
                      Mulai Perbandingan Kriteria <ArrowRight size={16} />
                    </Button>
                    <Button as="link" to="/peta-rekomendasi" variant="secondary">
                      Lihat Peta Default
                    </Button>
                  </div>
                </Card>
              </>
            )}

            {activeStep === 1 && activeCriteriaPair && (
              <>
                <AhpPairwiseQuestion
                  title="Tahap 1 - Perbandingan Antar Kriteria"
                  helper="Bandingkan kriteria utama dengan mempertimbangkan indikator yang berada di dalamnya."
                  pair={activeCriteriaPair}
                  value={criteriaComparisons[activeCriteriaPair.key]}
                  onChange={(value) => updateCriteriaComparison(activeCriteriaPair.key, value)}
                  questionNumber={completedCriteria}
                  totalQuestions={criteriaPairs.length}
                />

                <div className="flex flex-wrap justify-between gap-2">
                  <Button variant="secondary" onClick={goPreviousCriteria}><ArrowLeft size={16} /> Kembali</Button>
                  <Button onClick={goNextCriteria}>
                    {criteriaIndex === criteriaPairs.length - 1 ? "Lanjut ke Indikator" : "Pertanyaan Berikutnya"}
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </>
            )}

            {activeStep === 2 && activeIndicatorPair && (
              <>
                <Card className="p-4">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                      <Badge>Kriteria aktif</Badge>
                      <h2 className="mt-2 text-xl font-black text-stone-950">{activeIndicatorPair.criteriaName}</h2>
                      <p className="mt-1 text-sm leading-6 text-stone-500">Sekarang bandingkan indikator yang berada di dalam kriteria ini.</p>
                    </div>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">
                      {completedIndicator} dari {indicatorQuestions.length}
                    </span>
                  </div>
                </Card>

                <AhpPairwiseQuestion
                  title="Tahap 2 - Perbandingan Antar Indikator"
                  helper="Penilaian dilakukan hanya pada indikator yang berada dalam kriteria yang sama."
                  pair={activeIndicatorPair}
                  value={indicatorComparisons[activeIndicatorPair.criteriaCode]?.[activeIndicatorPair.key]}
                  onChange={(value) => updateIndicatorComparison(activeIndicatorPair.criteriaCode, activeIndicatorPair.key, value)}
                  questionNumber={completedIndicator}
                  totalQuestions={indicatorQuestions.length}
                />

                <div className="flex flex-wrap justify-between gap-2">
                  <Button variant="secondary" onClick={goPreviousIndicator}><ArrowLeft size={16} /> Kembali</Button>
                  <Button onClick={goNextIndicator}>
                    {indicatorIndex === indicatorQuestions.length - 1 ? "Lihat Hasil Bobot" : "Pertanyaan Berikutnya"}
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </>
            )}

            {activeStep === 3 && (
              <>
                <Card className={cn("p-5", isAllConsistent ? "border-green-200" : "border-red-200")}>
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div className="flex items-start gap-3">
                      <span className={cn("rounded-2xl p-2", isAllConsistent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                        {isAllConsistent ? <CheckCircle2 size={20} /> : <TriangleAlert size={20} />}
                      </span>
                      <div>
                        <Badge variant={isAllConsistent ? "green" : "red"}>{isAllConsistent ? "Siap diterapkan" : "Perlu revisi"}</Badge>
                        <h1 className="mt-3 text-2xl font-black text-stone-950">Hasil Pembobotan AHP</h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
                          Bobot ini akan disimpan sementara di browser dan digunakan untuk menghitung ulang WLC pada halaman peta rekomendasi.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" onClick={resetForm}><RotateCcw size={16} /> Reset</Button>
                      <Button disabled={!isAllConsistent || isSaving} onClick={saveAndOpenMap}>
                        <Save size={16} /> {isSaving ? "Menyimpan..." : "Terapkan ke Peta"}
                      </Button>
                    </div>
                  </div>
                </Card>

                <AhpWeightResult
                  criteriaWeights={criteriaResult.weightsPercent}
                  localIndicatorWeights={localIndicatorWeights}
                  globalIndicatorWeights={globalIndicatorWeights}
                />

                <div className="flex flex-wrap justify-between gap-2">
                  <Button variant="secondary" onClick={() => setActiveStep(2)}><ArrowLeft size={16} /> Kembali ke indikator</Button>
                  <Button as="link" to="/peta-rekomendasi" variant="secondary">Buka Peta Tanpa Menyimpan</Button>
                </div>
              </>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <AhpScaleGuide />
            <AhpConsistencyCard title="Konsistensi Kriteria" result={criteriaResult} />
            <Card className="p-4">
              <h3 className="font-bold text-stone-950">Konsistensi Indikator</h3>
              <div className="mt-3 space-y-2">
                {criteria.map((criterion) => {
                  const result = localResults[criterion.code];
                  return (
                    <div key={criterion.code} className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-3 py-2">
                      <span className="text-sm font-semibold text-stone-700">{criterion.shortName}</span>
                      <Badge variant={result.isConsistent ? "green" : "red"}>CR {result.cr}</Badge>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs leading-5 text-stone-500">Semua nilai CR harus maksimal 0,1 agar tombol Terapkan ke Peta aktif.</p>
            </Card>
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
}
