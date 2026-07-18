import { X } from "lucide-react";
import Button from "./Button";
import Card from "./Card";

export default function ConfirmationModal({ 
  isOpen, 
  title = "Konfirmasi Aksi", 
  message = "Apakah Anda yakin ingin melakukan tindakan ini?", 
  confirmText = "Ya, Lanjutkan", 
  cancelText = "Batal", 
  onConfirm, 
  onCancel,
  variant = "danger" // danger, warning, primary
}) {
  if (!isOpen) return null;

  const confirmButtonVariant = variant === "danger" 
    ? "bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-50/50" 
    : variant === "warning"
    ? "bg-amber-500 hover:bg-amber-600 text-white ring-4 ring-amber-50/50"
    : "bg-[#1D3557] hover:bg-[#2c4c78] text-white ring-4 ring-blue-50/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <Card className="w-full max-w-md overflow-hidden p-0 shadow-2xl border border-stone-200">
        <div className="flex items-center justify-between border-b border-stone-100 p-5 bg-stone-50">
          <h3 className="font-bold text-stone-950">{title}</h3>
          <button 
            onClick={onCancel}
            className="rounded-xl p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm leading-relaxed text-stone-650 font-medium">{message}</p>
        </div>
        
        <div className="flex items-center justify-end gap-3 border-t border-stone-100 p-4 bg-stone-50/50">
          <Button 
            variant="secondary" 
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold"
          >
            {cancelText}
          </Button>
          <button 
            onClick={onConfirm}
            className={`rounded-2xl px-5 py-2.5 text-xs font-bold tracking-wide transition shadow-sm ${confirmButtonVariant}`}
          >
            {confirmText}
          </button>
        </div>
      </Card>
    </div>
  );
}
