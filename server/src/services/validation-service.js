const prisma = require("../prisma/prisma-client");
const { NotFoundError, BadRequestError } = require("../utils/error-handling-util");

class ValidationService {
  /**
   * Mengambil semua titik coffee shop eksisting dalam format GeoJSON EPSG:4326.
   * Format ini dapat langsung dibaca dan di-render oleh Leaflet di frontend.
   */
  static async getExistingCoffeeShopsGeoJson() {
    const shops = await prisma.$queryRawUnsafe(`
      SELECT 
        id_shop,
        nama,
        latitude,
        longitude,
        ST_AsGeoJSON(ST_Transform(geom, 4326))::json as geojson
      FROM existing_coffee_shop
      ORDER BY id_shop ASC
    `);

    const features = shops.map(shop => ({
      type: "Feature",
      properties: {
        id: shop.id_shop,
        name: shop.nama,
        latitude: shop.latitude,
        longitude: shop.longitude
      },
      geometry: shop.geojson
    }));

    return {
      type: "FeatureCollection",
      features
    };
  }

  /**
   * Melakukan overlay spasial dan mengembalikan statistik akurasi model WLC
   * beserta beberapa sampel grid untuk evaluasi kesesuaian dan pembatas.
   */
  static async getSpatialValidationStats() {
    // 1. Ambil raster layer WLC final_score yang aktif (sebagai penanda run teraktif)
    const activeLayer = await prisma.rasterLayer.findFirst({
      where: { tipe_raster: "FINAL_SCORE" },
      orderBy: { id_raster_layer: "desc" }
    });

    if (!activeLayer) {
      throw new NotFoundError("Hasil kalkulasi WLC aktif belum ditemukan. Silakan jalankan kalkulasi WLC terlebih dahulu.");
    }

    const runId = activeLayer.id_raster_layer;

    // Helper untuk memetakan nama kelas kesesuaian dari DB (lowercase/snake_case) ke format UI (Title Case)
    const mapDbClassToUi = (dbClass) => {
      if (!dbClass) return "";
      const normalized = dbClass.toLowerCase();
      if (normalized === "sesuai") return "Sesuai";
      if (normalized === "cukup_sesuai") return "Cukup Sesuai";
      if (normalized === "kurang_sesuai") return "Kurang Sesuai";
      return dbClass;
    };

    // 2. Hitung total coffee shop eksisting di database
    const totalCoffeeShopsCount = await prisma.existingCoffeeShop.count();
    if (totalCoffeeShopsCount === 0) {
      throw new BadRequestError("Data coffee shop eksisting belum di-seed ke database.");
    }

    // 3. Distribusi sebaran coffee shop eksisting pada kelas kesesuaian WLC (Overlay Point-in-Polygon)
    //    HANYA grid yang berada di dalam wilayah studi (memiliki kecamatan terisi)
    const distributionRaw = await prisma.$queryRawUnsafe(`
      SELECT
        h.kelas_kesesuaian,
        COUNT(c.id_shop)::int as jumlah
      FROM grid g
      INNER JOIN hasil_wlc h ON g.id_grid = h.id_grid
      INNER JOIN existing_coffee_shop c ON ST_Contains(g.geom, c.geom)
      WHERE g.kecamatan IS NOT NULL  -- Hanya grid di dalam wilayah studi
      GROUP BY h.kelas_kesesuaian
    `);

    // Pastikan semua kategori terwakili meskipun jumlahnya 0
    const classes = ["Sesuai", "Cukup Sesuai", "Kurang Sesuai"];
    const distributionMapped = distributionRaw.map(d => ({
      kelas_kesesuaian: mapDbClassToUi(d.kelas_kesesuaian),
      jumlah: d.jumlah
    }));

    const sebaran = classes.map(cls => {
      const match = distributionMapped.find(d => d.kelas_kesesuaian === cls);
      const jumlah = match ? match.jumlah : 0;
      const persentase = totalCoffeeShopsCount > 0 
        ? Number(((jumlah / totalCoffeeShopsCount) * 100).toFixed(2)) 
        : 0;
      return { kelas_kesesuaian: cls, jumlah, persentase };
    });

    // 4. Deteksi coffee shop yang menabrak area constraint (sawah / sempadan sungai)
    //    HANYA grid yang berada di dalam wilayah studi (memiliki kecamatan terisi)
    const constraintViolationsRaw = await prisma.$queryRawUnsafe(`
      SELECT
        COUNT(c.id_shop)::int as total_pelanggaran,
        COUNT(CASE WHEN (h.nilai_indikator->>'sawah')::numeric = 0 THEN 1 END)::int as pelanggaran_sawah,
        COUNT(CASE WHEN (h.nilai_indikator->>'sempadan_sungai')::numeric = 0 THEN 1 END)::int as pelanggaran_sungai
      FROM grid g
      INNER JOIN hasil_wlc h ON g.id_grid = h.id_grid
      INNER JOIN existing_coffee_shop c ON ST_Contains(g.geom, c.geom)
      WHERE g.kecamatan IS NOT NULL  -- Hanya grid di dalam wilayah studi
        AND ((h.nilai_indikator->>'sawah')::numeric = 0 OR (h.nilai_indikator->>'sempadan_sungai')::numeric = 0)
    `);

    const violations = constraintViolationsRaw[0] || { total_pelanggaran: 0, pelanggaran_sawah: 0, pelanggaran_sungai: 0 };
    const persentasePelanggaran = totalCoffeeShopsCount > 0 
      ? Number(((violations.total_pelanggaran / totalCoffeeShopsCount) * 100).toFixed(2)) 
      : 0;

    // 5. Ambil sampel grid representatif untuk audit kesesuaian dan pembatas
    //    HANYA grid yang berada di dalam wilayah studi (memiliki kecamatan terisi)
    // 1. Sampel grid Kepadatan Tinggi (kepadatan coffee shop eksisting tertinggi)
    const sampelKepadatanTinggi = await prisma.$queryRawUnsafe(`
      SELECT
        g.kode_grid,
        g.kecamatan,
        g.kelurahan,
        h.skor_wlc::float as skor_wlc,
        h.kelas_kesesuaian,
        h.nilai_indikator,
        COUNT(c.id_shop)::int as jumlah_coffee_shop
      FROM grid g
      INNER JOIN hasil_wlc h ON g.id_grid = h.id_grid
      LEFT JOIN existing_coffee_shop c ON ST_Contains(g.geom, c.geom)
      WHERE g.kecamatan IS NOT NULL
      GROUP BY g.id_grid, g.kode_grid, g.kecamatan, g.kelurahan, h.skor_wlc, h.kelas_kesesuaian, h.nilai_indikator
      ORDER BY jumlah_coffee_shop DESC, h.skor_wlc DESC
      LIMIT 1
    `);

    // 2. Sampel grid Tanpa Kopi Kuat (tanpa coffee shop eksisting tergolong kelas Sesuai)
    const sampelTanpaKopiKuat = await prisma.$queryRawUnsafe(`
      SELECT
        g.kode_grid,
        g.kecamatan,
        g.kelurahan,
        h.skor_wlc::float as skor_wlc,
        h.kelas_kesesuaian,
        h.nilai_indikator,
        0 as jumlah_coffee_shop
      FROM grid g
      INNER JOIN hasil_wlc h ON g.id_grid = h.id_grid
      WHERE g.kecamatan IS NOT NULL
        AND h.kelas_kesesuaian = 'sesuai'
        AND (h.nilai_indikator->>'kepadatan_coffee_shop_existing')::numeric = 0
      ORDER BY h.skor_wlc DESC
      LIMIT 1
    `);

    // 3. Sampel grid Tanpa Kopi Lemah (tanpa coffee shop eksisting tergolong kelas Kurang Sesuai)
    const sampelTanpaKopiLemah = await prisma.$queryRawUnsafe(`
      SELECT
        g.kode_grid,
        g.kecamatan,
        g.kelurahan,
        h.skor_wlc::float as skor_wlc,
        h.kelas_kesesuaian,
        h.nilai_indikator,
        0 as jumlah_coffee_shop
      FROM grid g
      INNER JOIN hasil_wlc h ON g.id_grid = h.id_grid
      WHERE g.kecamatan IS NOT NULL
        AND h.kelas_kesesuaian = 'kurang_sesuai'
        AND (h.nilai_indikator->>'sawah')::numeric = 1
        AND (h.nilai_indikator->>'sempadan_sungai')::numeric = 1
        AND (h.nilai_indikator->>'kepadatan_coffee_shop_existing')::numeric = 0
      ORDER BY h.skor_wlc DESC
      LIMIT 1
    `);

    // 4. Sampel grid Pembatas Lahan (berada pada area constraint = 0)
    const sampelPembatasLahan = await prisma.$queryRawUnsafe(`
      SELECT
        g.kode_grid,
        g.kecamatan,
        g.kelurahan,
        h.skor_wlc::float as skor_wlc,
        h.kelas_kesesuaian,
        h.nilai_indikator,
        (SELECT COUNT(*)::int FROM existing_coffee_shop c WHERE ST_Contains(g.geom, c.geom)) as jumlah_coffee_shop
      FROM grid g
      INNER JOIN hasil_wlc h ON g.id_grid = h.id_grid
      WHERE g.kecamatan IS NOT NULL
        AND ((h.nilai_indikator->>'sawah')::numeric = 0 OR (h.nilai_indikator->>'sempadan_sungai')::numeric = 0)
      ORDER BY h.skor_wlc ASC
      LIMIT 1
    `);

    const formatSample = (row) => ({
      ...row,
      kelas_kesesuaian: mapDbClassToUi(row.kelas_kesesuaian)
    });

    return {
      runInfo: {
        id_analysis_run: runId,
        nama_run: activeLayer.kode_layer,
        tanggal_hitung: activeLayer.created_at,
        versi: runId,
      },
      summary: {
        total_coffee_shop_eksisting: totalCoffeeShopsCount,
        total_coffee_shop_terpetakan: sebaran.reduce((sum, item) => sum + item.jumlah, 0)
      },
      sebaran_kelas: sebaran,
      pelanggaran_constraint: {
        total_pelanggaran: violations.total_pelanggaran,
        persentase_pelanggaran: persentasePelanggaran,
        rincian: {
          sawah: violations.pelanggaran_sawah,
          sempadan_sungai: violations.pelanggaran_sungai
        }
      },
      sampel_grid: {
        kepadatan_tinggi: sampelKepadatanTinggi.map(formatSample),
        tanpa_kopi_kuat: sampelTanpaKopiKuat.map(formatSample),
        tanpa_kopi_lemah: sampelTanpaKopiLemah.map(formatSample),
        pembatas_lahan: sampelPembatasLahan.map(formatSample)
      }
    };
  }
}

module.exports = ValidationService;
