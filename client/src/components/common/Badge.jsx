import { cn } from "../../utils/className";

const variants = {
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  green: "border-green-200 bg-green-50 text-green-800",
  stone: "border-stone-200 bg-stone-100 text-stone-700",
  red: "border-red-200 bg-red-50 text-red-800",
};

export default function Badge({ variant = "amber", className, children }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", variants[variant], className)}>
      {children}
    </span>
  );
}
