export const suitabilityStyles = {
  "Sangat sesuai": {
    color: "#166534",
    textClass: "text-green-800",
    bgClass: "bg-green-50",
    borderClass: "border-green-200",
  },
  "Sangat Sesuai": {
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
  "Cukup Sesuai": {
    color: "#facc15",
    textClass: "text-yellow-800",
    bgClass: "bg-yellow-50",
    borderClass: "border-yellow-200",
  },
  "Kurang sesuai": {
    color: "#dc2626",
    textClass: "text-red-800",
    bgClass: "bg-red-50",
    borderClass: "border-red-200",
  },
  "Kurang Sesuai": {
    color: "#dc2626",
    textClass: "text-red-800",
    bgClass: "bg-red-50",
    borderClass: "border-red-200",
  },
  "Tidak sesuai": {
    color: "#dc2626",
    textClass: "text-red-800",
    bgClass: "bg-red-50",
    borderClass: "border-red-200",
  },
  "Tidak Sesuai": {
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
  "Area Terbatas": {
    color: "#78716c",
    textClass: "text-stone-700",
    bgClass: "bg-stone-100",
    borderClass: "border-stone-300",
  },
};

export function getSuitabilityColor(className) {
  return suitabilityStyles[className]?.color || suitabilityStyles["Tidak Sesuai"].color;
}

export function getSuitabilityBadgeClass(className) {
  const style = suitabilityStyles[className] || suitabilityStyles["Tidak Sesuai"];

  return `${style.bgClass} ${style.textClass} ${style.borderClass}`;
}
