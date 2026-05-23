export const suitabilityStyles = {
  "Sangat sesuai": {
    color: "#166534",
    textClass: "text-green-800",
    bgClass: "bg-green-50",
    borderClass: "border-green-200",
  },
  Sesuai: {
    color: "#65a30d",
    textClass: "text-lime-800",
    bgClass: "bg-lime-50",
    borderClass: "border-lime-200",
  },
  "Cukup sesuai": {
    color: "#facc15",
    textClass: "text-yellow-800",
    bgClass: "bg-yellow-50",
    borderClass: "border-yellow-200",
  },
  "Kurang sesuai": {
    color: "#f97316",
    textClass: "text-orange-800",
    bgClass: "bg-orange-50",
    borderClass: "border-orange-200",
  },
  "Tidak sesuai": {
    color: "#dc2626",
    textClass: "text-red-800",
    bgClass: "bg-red-50",
    borderClass: "border-red-200",
  },
  "Area terbatas": {
    color: "#78716c",
    textClass: "text-stone-700",
    bgClass: "bg-stone-100",
    borderClass: "border-stone-300",
  },
};

export function getSuitabilityColor(className) {
  return suitabilityStyles[className]?.color || suitabilityStyles["Tidak sesuai"].color;
}

export function getSuitabilityBadgeClass(className) {
  const style = suitabilityStyles[className] || suitabilityStyles["Tidak sesuai"];

  return `${style.bgClass} ${style.textClass} ${style.borderClass}`;
}
