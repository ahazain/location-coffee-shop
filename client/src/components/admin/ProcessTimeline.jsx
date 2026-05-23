import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Badge from "../common/Badge";
import Card from "../common/Card";

export default function ProcessTimeline({ steps }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-stone-950">Alur kerja admin</h2>
          <p className="mt-1 text-sm text-stone-500">Urutan ini dibuat agar admin tidak bingung saat memperbarui data.</p>
        </div>
        <Badge>Pipeline</Badge>
      </div>

      <div className="mt-5 space-y-3">
        {steps.map((step, index) => (
          <Link
            key={step.id}
            to={step.route}
            className="group flex gap-3 rounded-3xl border border-stone-200 bg-stone-50 p-4 transition hover:border-amber-700 hover:bg-amber-50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black text-amber-800 shadow-sm">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-stone-950">{step.title}</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
                  <CheckCircle2 size={14} /> {step.status}
                </span>
              </span>
              <span className="mt-1 block text-sm leading-6 text-stone-500">{step.description}</span>
            </span>
            <ArrowRight size={18} className="mt-2 shrink-0 text-stone-400 transition group-hover:translate-x-1 group-hover:text-amber-800" />
          </Link>
        ))}
      </div>
    </Card>
  );
}
