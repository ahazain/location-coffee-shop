import geopandas as gpd
import json
import os

def main():
    shp_path = r"c:\Penelitian Pertama Saya_SKRIPSI\QGIS\kedai kopi\kedai kopi.shp"
    output_json_path = os.path.join(os.path.dirname(__file__), "existing_coffee_shops.json")

    print(f"Reading shapefile from: {shp_path}")
    if not os.path.exists(shp_path):
        print(f"Error: Shapefile not found at {shp_path}")
        return

    # Read the shapefile (natively EPSG:32749)
    gdf_native = gpd.read_file(shp_path)
    
    # Reproject to EPSG:4326 to get standard lat/lon
    gdf_wgs84 = gdf_native.to_crs(epsg=4326)

    records = []
    for i in range(len(gdf_native)):
        native_geom = gdf_native.geometry.iloc[i]
        wgs84_geom = gdf_wgs84.geometry.iloc[i]
        
        osm_id = str(gdf_native['osm_id'].iloc[i]) if 'osm_id' in gdf_native.columns else None
        name = str(gdf_native['name'].iloc[i]) if 'name' in gdf_native.columns else "Tanpa Nama"
        
        # Lat/Lon (WGS84)
        lon = wgs84_geom.x
        lat = wgs84_geom.y
        
        # X/Y (UTM 49S - EPSG:32749)
        x_32749 = native_geom.x
        y_32749 = native_geom.y

        records.append({
            "osm_id": osm_id,
            "nama": name,
            "latitude": lat,
            "longitude": lon,
            "x_32749": x_32749,
            "y_32749": y_32749
        })

    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)

    print(f"Successfully exported {len(records)} coffee shop points to {output_json_path}")

if __name__ == "__main__":
    main()
