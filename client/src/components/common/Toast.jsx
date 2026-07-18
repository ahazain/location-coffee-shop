import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export default function Toast({ message, type = "success", onClose, duration = 4050 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const isSuccess = type === "success";

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slideIn">
      <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-xl backdrop-blur-md transition-all duration-300 ${
        isSuccess 
          ? "border-emerald-200/50 bg-emerald-50/95 text-emerald-950" 
          : "border-red-200/50 bg-red-50/95 text-red-950"
      }`}>
        <span>
          {isSuccess 
            ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            : <AlertCircle className="h-5 w-5 text-red-650" />
          }
        </span>
        <p className="text-sm font-semibold tracking-wide">{message}</p>
        <button 
          onClick={onClose} 
          className={`ml-2 rounded-xl p-1 transition-colors ${
            isSuccess 
              ? "hover:bg-emerald-100 text-emerald-700" 
              : "hover:bg-red-100 text-red-700"
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
