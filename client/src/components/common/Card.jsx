import { cn } from "../../utils/className";

export default function Card({ className, children }) {
  return (
    <div className={cn("rounded-3xl border border-stone-200 bg-white p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}
