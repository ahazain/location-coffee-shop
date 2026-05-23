import { CheckCircle2, TriangleAlert } from "lucide-react";
import { cn } from "../../utils/className";
import Badge from "../common/Badge";
import Card from "../common/Card";

export default function AhpConsistencyCard({ title, result, compact = false }) {
  const isConsistent = result?.isConsistent ?? true;

  return (
    <Card className={cn("p-4", isConsistent ? "border-green-200" : "border-red-200")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={cn("rounded-2xl p-2", isConsistent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
            {isConsistent ? <CheckCircle2 size={18} /> : <TriangleAlert size={18} />}
          </span>
          <div>
            <h3 className="font-bold text-stone-950">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-stone-500">
              {isConsistent ? "Penilaian konsisten dan bisa digunakan." : "Penilaian belum konsisten. Periksa kembali jawaban yang terlalu bertentangan."}
            </p>
          </div>
        </div>
        <Badge variant={isConsistent ? "green" : "red"}>CR {result?.cr ?? 0}</Badge>
      </div>

      {!compact && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-stone-50 p-3">
            <p className="text-xs text-stone-500">λ max</p>
            <p className="mt-1 font-black text-stone-950">{result?.lambdaMax ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-3">
            <p className="text-xs text-stone-500">CI</p>
            <p className="mt-1 font-black text-stone-950">{result?.ci ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-3">
            <p className="text-xs text-stone-500">CR</p>
            <p className={cn("mt-1 font-black", isConsistent ? "text-green-700" : "text-red-600")}>{result?.cr ?? 0}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
