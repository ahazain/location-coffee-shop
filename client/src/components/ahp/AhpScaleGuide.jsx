import { saatyScale } from "../../utils/ahp";
import Card from "../common/Card";

export default function AhpScaleGuide() {
  return (
    <Card className="p-4">
      <h3 className="font-bold text-stone-950">Panduan Skala Saaty</h3>
      <p className="mt-1 text-sm leading-6 text-stone-500">
        Gunakan nilai 1 jika sama penting. Gunakan nilai lebih besar jika salah satu faktor semakin dominan.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {saatyScale.map((item) => (
          <div key={item.value} className="flex items-center gap-3 rounded-2xl bg-stone-50 p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-amber-800 ring-1 ring-stone-200">
              {item.value}
            </span>
            <span className="text-sm font-medium text-stone-700">{item.label.replace(`${item.value} - `, "")}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
