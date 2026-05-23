import { CheckCircle2 } from "lucide-react";
import { cn } from "../../utils/className";

export default function AhpStepper({ steps, activeStep }) {
  return (
    <div className="grid gap-2 rounded-3xl border border-stone-200 bg-white p-3 shadow-sm md:grid-cols-4">
      {steps.map((step, index) => {
        const isActive = index === activeStep;
        const isDone = index < activeStep;

        return (
          <div
            key={step.title}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition",
              isActive && "bg-amber-50 text-amber-900",
              isDone && "bg-green-50 text-green-800",
              !isActive && !isDone && "bg-stone-50 text-stone-500",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black",
                isActive && "bg-amber-800 text-white",
                isDone && "bg-green-700 text-white",
                !isActive && !isDone && "bg-white text-stone-500 ring-1 ring-stone-200",
              )}
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
