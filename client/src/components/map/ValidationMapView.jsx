import { useEffect } from "react";
import { GeoJSON, MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { getSuitabilityColor } from "../../utils/mapStyle";

// Custom Leaflet coffee cup marker icon to avoid Vite bundling issues with default images
const coffeeIcon = L.divIcon({
  html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-amber-700 border-2 border-white text-white shadow-md shadow-amber-950/40 hover:scale-110 hover:bg-amber-600 transition-all cursor-pointer font-bold text-sm">☕</div>`,
  className: "custom-div-icon",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -10],
});

export default function ValidationMapView({ 
  gridGeojson, 
  coffeePointsGeojson, 
  boundaryGeojson,
  selectedGridCode, 
  onSelectGrid 
}) {
  
  if (!gridGeojson) {
    return (
      <div className="flex h-full items-center justify-center text-stone-500 bg-stone-50 rounded-3xl border border-stone-200">
        Memuat peta grids...
      </div>
    );
  }

  return (
    <MapContainer 
      center={[-8.165, 113.72]} 
      zoom={13} 
      scrollWheelZoom 
      className="h-full w-full rounded-3xl"
    >
      <TileLayer 
        attribution="&copy; OpenStreetMap contributors" 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
      />

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

      {/* Grid layer colored by WLC suitability class */}
      <GeoJSON
        key={JSON.stringify(
          gridGeojson.features.map((feature) => ({
            id: feature.properties.gridCode,
            score: feature.properties.scoreDefault,
            className: feature.properties.suitabilityClass,
            selected: selectedGridCode === feature.properties.gridCode,
          })),
        )}
        data={gridGeojson}
        style={(feature) => {
          const isSelected = selectedGridCode === feature.properties.gridCode;
          const isConstrained = feature.properties.indicatorScores?.sawah === 0 || feature.properties.indicatorScores?.sempadan_sungai === 0;

          return {
            color: isSelected ? "#7c2d12" : "#ffffff",
            weight: isSelected ? 3 : 1,
            fillColor: isConstrained ? "#a8a29e" : getSuitabilityColor(feature.properties.suitabilityClass),
            fillOpacity: isSelected ? 0.85 : 0.65,
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
              <span class="text-stone-500">Skor WLC:</span> <span class="font-bold font-mono">${feature.properties.scoreDefault?.toFixed(4) || "0"}</span><br/>
              <span class="text-stone-500">Kelas:</span> <span class="font-semibold" style="color: ${getSuitabilityColor(feature.properties.suitabilityClass)}">${feature.properties.suitabilityClass}</span>
              ${constraintText}
            </div>
          `);

          layer.on("click", () => {
            onSelectGrid(feature.properties);
          });
        }}
      />

      {/* Coffee Shop points layer overlaid on top */}
      {coffeePointsGeojson?.features?.map((feature) => {
        const [lon, lat] = feature.geometry.coordinates;
        return (
          <Marker 
            key={feature.properties.id} 
            position={[lat, lon]} 
            icon={coffeeIcon}
          >
            <Popup>
              <div className="font-sans text-xs">
                <strong className="text-sm text-stone-950">☕ {feature.properties.name || "Kedai Kopi"}</strong><br/>
                <span className="text-stone-500">OSM ID:</span> <span className="font-mono text-stone-600">${feature.properties.osmId || "-"}</span><br/>
                <span className="text-stone-500">Koordinat:</span> <span className="font-mono text-stone-600">${lat.toFixed(5)}, ${lon.toFixed(5)}</span>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
