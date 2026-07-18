import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import { getSuitabilityColor } from "../../utils/mapStyle";

export default function MapView({ geojson, boundaryGeojson, selectedGridCode, onSelectGrid }) {
  if (!geojson) {
    return (
      <div className="flex h-full items-center justify-center text-stone-500">
        Memuat peta dummy...
      </div>
    );
  }

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
          const isConstrained = feature.properties.indicatorScores?.sawah === 0 || feature.properties.indicatorScores?.sempadan_sungai === 0;

          return {
            color: isSelected ? "#7c2d12" : "#ffffff",
            weight: isSelected ? 3 : 1,
            fillColor: getSuitabilityColor(feature.properties.suitabilityClass),
            fillOpacity: isSelected ? 0.86 : 0.7,
          };
        }}
        onEachFeature={(feature, layer) => {
          const isConstrained = feature.properties.indicatorScores?.sawah === 0 || feature.properties.indicatorScores?.sempadan_sungai === 0;
          const constraintText = isConstrained 
            ? `<br/><span class="text-xs text-red-600 font-semibold font-mono">⚠️ Terkena Constraint:${feature.properties.indicatorScores?.sawah === 0 ? " [Sawah]" : ""}${feature.properties.indicatorScores?.sempadan_sungai === 0 ? " [Sempadan Sungai]" : ""}</span>`
            : "";

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
