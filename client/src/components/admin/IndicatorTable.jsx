import { Fragment } from "react";
import { Edit2, Trash2, Folder } from "lucide-react";
import Badge from "../common/Badge";
import Card from "../common/Card";

function fuzzyLabel(type) {
  if (type === "linear_increasing") return "Benefit (Linear Increasing)";
  if (type === "linear_decreasing") return "Cost (Linear Decreasing)";
  if (type === "near") return "Optimum (Near)";
  return type || "-";
}

export default function IndicatorTable({ indicators, loading, onEdit, onDelete }) {
  const indicatorsWithNumber = indicators.map((indicator, index) => ({
    ...indicator,
    rowNumber: index + 1,
  }));

  const groupedByKriteria = indicatorsWithNumber.reduce((acc, indicator) => {
    const kId =
      indicator.id_kriteria ||
      indicator.kriteria?.id_kriteria ||
      indicator.kriteria?.id ||
      999;

    const kName = indicator.kriteria?.nama_kriteria || "Lainnya";

    if (!acc[kId]) {
      acc[kId] = {
        id: kId,
        nama: kName,
        items: [],
      };
    }

    acc[kId].items.push(indicator);
    return acc;
  }, {});

  const groups = Object.values(groupedByKriteria).sort((a, b) => a.id - b.id);

  return (
    <Card className="flex flex-col justify-between p-0 border border-stone-200/60 shadow-xs rounded-3xl bg-white w-full overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#f8fafc]/50 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            <tr>
              <th className="px-6 py-4 w-16 text-center">NO</th>
              <th className="px-6 py-4">INDIKATOR</th>
              <th className="px-6 py-4">TIPE FUZZY</th>
              <th className="px-6 py-4 w-24 text-right">AKSI</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr>
                <td
                  colSpan="4"
                  className="px-6 py-12 text-center text-xs font-semibold text-stone-400 bg-white"
                >
                  Loading data...
                </td>
              </tr>
            ) : indicators.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="px-6 py-12 text-center text-xs font-semibold text-stone-400 bg-white"
                >
                  Tidak ada indikator yang sesuai kriteria pencarian.
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <Fragment key={group.id}>
                  <tr className="bg-amber-50/15">
                    <td
                      colSpan="4"
                      className="px-6 py-3 text-xs font-bold text-amber-600 bg-amber-50/5 border-y border-stone-100/50"
                    >
                      <span className="flex items-center gap-2">
                        <Folder
                          size={14}
                          className="text-amber-500 fill-amber-100"
                        />
                        Kriteria: {group.nama}
                      </span>
                    </td>
                  </tr>

                  {group.items.map((indicator) => {
                    const indicatorId = indicator.id_indikator || indicator.id;
                    const noStr = String(indicator.rowNumber).padStart(2, "0");

                    return (
                      <tr
                        key={indicatorId}
                        className="hover:bg-stone-50/40 transition"
                      >
                        <td className="px-6 py-4 text-center font-semibold text-stone-400 font-mono">
                          {noStr}
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-extrabold text-[#1D3557] text-xs sm:text-sm">
                            {indicator.nama_indikator}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <Badge variant="amber">
                            {fuzzyLabel(indicator.fungsi_fuzzy)}
                          </Badge>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-3.5">
                            <button
                              type="button"
                              onClick={() => onEdit(indicator)}
                              className="rounded-lg p-1.5 text-stone-400 hover:text-[#1D3557] hover:bg-stone-100 transition active:scale-90 cursor-pointer"
                              title="Edit Indikator"
                            >
                              <Edit2 size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onDelete(indicatorId, indicator.nama_indikator)
                              }
                              className="rounded-lg p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 transition active:scale-90 cursor-pointer"
                              title="Hapus Indikator"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}