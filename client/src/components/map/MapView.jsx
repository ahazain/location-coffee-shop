import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import { getSuitabilityColor } from "../../utils/mapStyle";

export default function MapView({ geojson, selectedGridCode, onSelectGrid }) {
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

          return {
            color: isSelected ? "#7c2d12" : "#ffffff",
            weight: isSelected ? 3 : 1,
            fillColor: getSuitabilityColor(feature.properties.suitabilityClass),
            fillOpacity: isSelected ? 0.86 : 0.7,
          };
        }}
        onEachFeature={(feature, layer) => {
          layer.bindPopup(`
            <strong>${feature.properties.gridCode}</strong><br/>
            Kecamatan: ${feature.properties.kecamatan}<br/>
            Kelurahan: ${feature.properties.kelurahan}<br/>
            Skor: ${feature.properties.scoreUsed}<br/>
            Kelas: ${feature.properties.suitabilityClass}
          `);

          layer.on("click", () => {
            onSelectGrid(feature.properties);
          });
        }}
      />
    </MapContainer>
  );
}
