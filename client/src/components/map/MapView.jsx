import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import { getSuitabilityColor } from "../../utils/mapStyle";

export default function MapView({ geojson, boundaryGeojson, selectedGridCode, onSelectGrid, indicatorList = [] }) {
  if (!geojson) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-stone-500 font-sans p-6 text-center">
        <span className="text-3xl">🗺️</span>
        <p className="mt-2 font-semibold text-stone-700">Peta WLC Belum Tersedia</p>
        <p className="mt-1 text-xs text-stone-400 max-w-xs">Kalkulasi WLC aktif belum dijalankan oleh administrator atau data masih kosong.</p>
      </div>
    );
  }

  const maskIndicators = indicatorList.filter(ind => ind.tipe_nilai === "MASK" || ind.tipeNilai === "MASK");
  const maskKeys = maskIndicators.map(ind => "ind_" + ind.id);

  return (
    <MapContainer center={[-8.165, 113.72]} zoom={13} scrollWheelZoom className="h-full w-full rounded-3xl">
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {boundaryGeojson && (
        <GeoJSON
          data={boundaryGeojson}
          style={() => ({
            color: "#4f46e5",
            weight: 2,
            fillColor: "transparent",
            fillOpacity: 0,
            dashArray: "5, 5",
          })}
        />
      )}

      <GeoJSON
        key={JSON.stringify(
          geojson.features.map((feature) => ({
            id: feature.properties.gridCode,
            score: feature.properties.scoreUsed,
            className: feature.properties.suitabilityClass,
            selected: selectedGridCode === feature.properties.gridCode,
          })),
        )}
        data={geojson}
        style={(feature) => {
          const isSelected = selectedGridCode === feature.properties.gridCode;
          const scores = feature.properties.indicatorScores || {};
          const isConstrained = maskKeys.length > 0
            ? maskKeys.some(key => scores[key] === 0 || scores["fuzzy_" + key] === 0)
            : (scores.sawah === 0 || scores.sempadan_sungai === 0 || scores.ind_14 === 0 || scores.ind_15 === 0);

          return {
            color: isSelected ? "#7c2d12" : "#ffffff",
            weight: isSelected ? 3 : 1,
            fillColor: getSuitabilityColor(feature.properties.suitabilityClass),
            fillOpacity: isSelected ? 0.86 : 0.7,
          };
        }}
        onEachFeature={(feature, layer) => {
          const scores = feature.properties.indicatorScores || {};
          const isConstrained = maskKeys.length > 0
            ? maskKeys.some(key => scores[key] === 0 || scores["fuzzy_" + key] === 0)
            : (scores.sawah === 0 || scores.sempadan_sungai === 0 || scores.ind_14 === 0 || scores.ind_15 === 0);

          let constraintText = "";
          if (isConstrained) {
            if (maskKeys.length > 0) {
              const violatedNames = maskIndicators
                .filter(ind => scores["ind_" + ind.id] === 0 || scores["fuzzy_ind_" + ind.id] === 0)
                .map(ind => ind.name);
              constraintText = `<br/><span class="text-xs text-red-600 font-semibold font-mono">⚠️ Terkena Constraint: [${violatedNames.join(", ")}]</span>`;
            } else {
              constraintText = `<br/><span class="text-xs text-red-600 font-semibold font-mono">⚠️ Terkena Constraint:${scores.sawah === 0 ? " [Sawah]" : ""}${scores.sempadan_sungai === 0 ? " [Sempadan Sungai]" : ""}</span>`;
            }
          }

          layer.bindPopup(`
            <div class="font-sans text-xs">
              <strong class="text-sm text-stone-900">${feature.properties.gridCode}</strong><br/>
              <span class="text-stone-500">Kecamatan:</span> ${feature.properties.kecamatan || "-"}<br/>
              <span class="text-stone-500">Kelurahan:</span> ${feature.properties.kelurahan || "-"}<br/>
              <span class="text-stone-500">Skor:</span> <span class="font-bold font-mono">${feature.properties.scoreUsed?.toFixed(4) || "0"}</span><br/>
              <span class="text-stone-500">Kelas:</span> <span class="font-semibold" style="color: ${isConstrained ? "#78716c" : getSuitabilityColor(feature.properties.suitabilityClass)}">${feature.properties.suitabilityClass}</span>
              ${constraintText}
            </div>
          `);

          layer.on("click", () => {
            onSelectGrid(feature.properties);
          });
        }}
      />
    </MapContainer>
  );
}
