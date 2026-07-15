import { useEffect, useState } from "react";
import { GeoJSON, MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { MapPinned } from "lucide-react";
import AdminLayout from "../layouts/AdminLayout";
import Card from "../components/common/Card";
import { mapService } from "../services/mapService";
import { wlcService } from "../services/api/wlcService";

// Helper to calculate mathematical centroid of a Polygon/MultiPolygon
function getCentroid(feature) {
  try {
    let coords = [];
    if (feature.geometry.type === "Polygon") {
      coords = feature.geometry.coordinates[0];
    } else if (feature.geometry.type === "MultiPolygon") {
      coords = feature.geometry.coordinates[0][0];
    }
    
    if (coords && coords.length > 0) {
      let sumLat = 0;
      let sumLng = 0;
      coords.forEach(coord => {
        sumLng += coord[0];
        sumLat += coord[1];
      });
      return [sumLat / coords.length, sumLng / coords.length];
    }
  } catch (e) {
    console.error("Centroid calculation error:", e);
  }
  return [-8.165, 113.72]; // Fallback Jember
}

const indicatorIdToKey = {
  1: "kepadatan_layanan_makan_non_coffee",
  2: "kepadatan_layanan_olahraga_rekreasi",
  3: "kepadatan_hunian",
  4: "kedekatan_pusat_belanja",
  5: "kepadatan_kampus_fasilitas_pendidikan",
  6: "kepadatan_kantor_jasa_keuangan_bisnis",
  7: "intensitas_cahaya_malam",
  8: "kepadatan_populasi",
  9: "jarak_jalan_utama",
  10: "kedekatan_simpul_transportasi",
  11: "kepadatan_simpang_jalan",
  12: "kepadatan_coffee_shop_existing",
  13: "jarak_coffee_shop_existing_terdekat",
};

const indicatorNames = {
  kepadatan_layanan_makan_non_coffee: "Kepadatan layanan makan non-cafe",
  kepadatan_layanan_olahraga_rekreasi: "Kepadatan layanan olahraga dan rekreasi",
  kepadatan_hunian: "Kepadatan kawasan hunian",
  kedekatan_pusat_belanja: "Kedekatan Pusat Belanja",
  kepadatan_kampus_fasilitas_pendidikan: "Kepadatan kampus dan fasilitas pendidikan",
  kepadatan_kantor_jasa_keuangan_bisnis: "Kepadatan kantor, bank, jasa keuangan, dan bisnis",
  intensitas_cahaya_malam: "Intensitas Cahaya Malam",
  kepadatan_populasi: "Kepadatan Populasi",
  jarak_jalan_utama: "Jarak ke Jalan Utama",
  kedekatan_simpul_transportasi: "Kedekatan Simpul Transportasi",
  kepadatan_simpang_jalan: "Kepadatan simpang jalan",
  kepadatan_coffee_shop_existing: "Kepadatan coffee shop existing",
  jarak_coffee_shop_existing_terdekat: "Jarak ke Coffee Shop Existing Terdekat"
};

// Top 10 Rank Text Labels (no background circle, white text-shadow outline for high contrast)
const rankIcon = (rank) => L.divIcon({
  html: `<div class="text-[#1D3557] font-black text-sm select-none flex items-center justify-center w-full h-full" style="text-shadow: 2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 0px 2px 0 #fff, 0px -2px 0 #fff, 2px 0px 0 #fff, -2px 0px 0 #fff; background: transparent !important; border: none !important; line-height: 1;">${rank}</div>`,
  className: "bg-transparent border-0 flex items-center justify-center",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

export default function AdminTop10MapPage() {
  const [geojson, setGeojson] = useState(null);
  const [boundaryGeojson, setBoundaryGeojson] = useState(null);
  const [top10Grids, setTop10Grids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMapData() {
      try {
        const grids = await mapService.getDefaultMap();
        const boundary = await wlcService.getBoundary().catch(() => null);

        setGeojson(grids);
        setBoundaryGeojson(boundary);

        if (grids && grids.features) {
          // Sort and slice top 10
          const sorted = [...grids.features].sort(
            (a, b) => b.properties.scoreUsed - a.properties.scoreUsed
          );
          
          const top10 = sorted.slice(0, 10).map((f, idx) => {
            const centroid = getCentroid(f);
            
            // Get dominant indicators (top 2 fuzzy scores)
            const scores = f.properties.indicatorScores || {};
            const fuzzyScores = [];
            for (const [key, val] of Object.entries(scores)) {
              if (key.startsWith("fuzzy_") && key !== "fuzzy_sawah" && key !== "fuzzy_sempadan_sungai") {
                const rawKey = key.replace("fuzzy_", "");
                const displayName = indicatorNames[rawKey] || rawKey;
                fuzzyScores.push({ name: displayName, score: Number(val) });
              }
            }
            fuzzyScores.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
            
            const dominanStr = fuzzyScores.slice(0, 2).map(fs => {
              let scStr = fs.score.toString().replace(".", ",");
              if (fs.score === 1) scStr = "1";
              else if (fs.score === 0) scStr = "0";
              return `${fs.name} (${scStr})`;
            }).join(", ");

            const rawScore = Number(f.properties.scoreUsed);
            const skorWlcStr = rawScore.toFixed(4);

            return {
              rank: idx + 1,
              gridCode: f.properties.gridCode,
              kecamatan: f.properties.kecamatan || "-",
              kelurahan: f.properties.kelurahan || "-",
              score: skorWlcStr,
              centroid,
              dominant: dominanStr,
              properties: f.properties
            };
          });

          setTop10Grids(top10);
        }
      } catch (err) {
        console.error("Gagal memuat data peta top 10:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMapData();
  }, []);

  const top10Codes = top10Grids.map((g) => g.gridCode);

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-[#577590] p-3 text-white shadow-xs">
            <MapPinned size={22} />
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-[#1D3557] tracking-tight sm:text-2xl">
              Peta Visual 10 Grid Terbaik
            </h1>
            <p className="text-xs font-semibold text-stone-400 sm:text-sm">
              Halaman visualisasi khusus untuk tangkapan layar (screenshot) bab hasil penelitian.
            </p>
          </div>
        </div>

        {loading ? (
          <Card className="flex items-center justify-center p-20 text-stone-500 font-semibold">
            Memetakan 10 lokasi terbaik...
          </Card>
        ) : (
          <div className="w-full">
            {/* Map Container - Full Width */}
            <Card className="p-0 border border-stone-200/60 shadow-md rounded-3xl overflow-hidden h-[750px] relative w-full">
              <MapContainer
                center={[-8.165, 113.725]}
                zoom={13}
                className="h-full w-full"
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {boundaryGeojson && (
                  <GeoJSON
                    data={boundaryGeojson}
                    style={() => ({
                      color: "#1D3557",
                      weight: 2,
                      fillColor: "transparent",
                      fillOpacity: 0,
                      dashArray: "6, 6",
                    })}
                  />
                )}

                {geojson && (
                  <GeoJSON
                    key={JSON.stringify(top10Codes)}
                    data={geojson}
                    style={(feature) => {
                      const isTop10 = top10Codes.includes(feature.properties.gridCode);
                      if (isTop10) {
                        return {
                          color: "#dc2626", // Outline merah menyala
                          weight: 3,
                          fillColor: "#fbbf24", // Fill kuning emas
                          fillOpacity: 0.85,
                        };
                      }
                      return {
                        color: "#e7e5e4", // Outline abu sangat muda
                        weight: 0.5,
                        fillColor: "#f5f5f4", // Faint grey
                        fillOpacity: 0.1,
                      };
                    }}
                  />
                )}

                {/* Rank Markers at Centroids */}
                {top10Grids.map((g) => (
                  <Marker
                    key={g.gridCode}
                    position={g.centroid}
                    icon={rankIcon(g.rank)}
                  >
                    <Popup>
                      <div className="font-sans text-xs">
                        <strong className="text-sm text-stone-900">{g.gridCode} (Peringkat {g.rank})</strong><br/>
                        <span className="text-stone-500">Kecamatan:</span> {g.kecamatan}<br/>
                        <span className="text-stone-500">Kelurahan:</span> {g.kelurahan}<br/>
                        <span className="text-stone-500">Skor WLC:</span> <strong className="font-mono text-emerald-600">{g.score}</strong><br/>
                        <span className="text-stone-500">Kelas:</span> {g.properties.suitabilityClass}<br/>
                        <div className="mt-1 border-t border-stone-100 pt-1 text-[10px] text-stone-400">
                          <strong>Dominan:</strong> {g.dominant}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
