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
    // 1. Ambil analysis run WLC yang aktif (yang paling terbaru)
    const activeRun = await prisma.analysisRun.findFirst({
      orderBy: { id_analysis_run: "desc" }
    });

    if (!activeRun) {
      throw new NotFoundError("Hasil kalkulasi WLC aktif belum ditemukan. Silakan jalankan kalkulasi WLC terlebih dahulu.");
    }

    const runId = activeRun.id_analysis_run;

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
      WHERE h.id_analysis_run = $1
        AND g.kecamatan IS NOT NULL  -- Hanya grid di dalam wilayah studi
      GROUP BY h.kelas_kesesuaian
    `, runId);

    // Pastikan semua kategori terwakili meskipun jumlahnya 0
    const classes = ["Sesuai", "Kurang Sesuai", "Tidak Sesuai"];
    const sebaran = classes.map(cls => {
      const match = distributionRaw.find(d => d.kelas_kesesuaian === cls);
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
      WHERE h.id_analysis_run = $1
        AND g.kecamatan IS NOT NULL  -- Hanya grid di dalam wilayah studi
        AND ((h.nilai_indikator->>'sawah')::numeric = 0 OR (h.nilai_indikator->>'sempadan_sungai')::numeric = 0)
    `, runId);

    const violations = constraintViolationsRaw[0] || { total_pelanggaran: 0, pelanggaran_sawah: 0, pelanggaran_sungai: 0 };
    const persentasePelanggaran = totalCoffeeShopsCount > 0 
      ? Number(((violations.total_pelanggaran / totalCoffeeShopsCount) * 100).toFixed(2)) 
      : 0;

    // 5. Ambil sampel grid representatif untuk audit kesesuaian dan pembatas
    //    HANYA grid yang berada di dalam wilayah studi (memiliki kecamatan terisi)
    const limitSample = 3;

    // Sampel grid Sesuai (non-constrained)
    const sampelSesuai = await prisma.$queryRawUnsafe(`
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
      WHERE h.id_analysis_run = $1
        AND g.kecamatan IS NOT NULL  -- Hanya grid di dalam wilayah studi
        AND h.kelas_kesesuaian = 'Sesuai'
        AND (h.nilai_indikator->>'sawah')::numeric = 1
        AND (h.nilai_indikator->>'sempadan_sungai')::numeric = 1
      GROUP BY g.id_grid, h.id_hasil
      ORDER BY g.kode_grid ASC
      LIMIT $2
    `, runId, limitSample);

    // Sampel grid Kurang Sesuai (non-constrained)
    const sampelKurangSesuai = await prisma.$queryRawUnsafe(`
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
      WHERE h.id_analysis_run = $1
        AND g.kecamatan IS NOT NULL  -- Hanya grid di dalam wilayah studi
        AND h.kelas_kesesuaian = 'Kurang Sesuai'
        AND (h.nilai_indikator->>'sawah')::numeric = 1
        AND (h.nilai_indikator->>'sempadan_sungai')::numeric = 1
      GROUP BY g.id_grid, h.id_hasil
      ORDER BY g.kode_grid ASC
      LIMIT $2
    `, runId, limitSample);

    // Sampel grid Tidak Sesuai (karena skor rendah, bukan constraint)
    const sampelTidakSesuaiSkor = await prisma.$queryRawUnsafe(`
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
      WHERE h.id_analysis_run = $1
        AND g.kecamatan IS NOT NULL  -- Hanya grid di dalam wilayah studi
        AND h.kelas_kesesuaian = 'Tidak Sesuai'
        AND (h.nilai_indikator->>'sawah')::numeric = 1
        AND (h.nilai_indikator->>'sempadan_sungai')::numeric = 1
      GROUP BY g.id_grid, h.id_hasil
      ORDER BY g.kode_grid ASC
      LIMIT $2
    `, runId, limitSample);

    // Sampel grid yang terkena Pembatas Lahan (Constraint)
    const sampelPembatas = await prisma.$queryRawUnsafe(`
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
      WHERE h.id_analysis_run = $1
        AND g.kecamatan IS NOT NULL  -- Hanya grid di dalam wilayah studi
        AND ((h.nilai_indikator->>'sawah')::numeric = 0 OR (h.nilai_indikator->>'sempadan_sungai')::numeric = 0)
      GROUP BY g.id_grid, h.id_hasil
      ORDER BY g.kode_grid ASC
      LIMIT $2
    `, runId, limitSample);

    return {
      runInfo: {
        id_analysis_run: runId,
        nama_run: activeRun.nama_run,
        tanggal_hitung: activeRun.created_at,
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
        sesuai: sampelSesuai,
        kurang_sesuai: sampelKurangSesuai,
        tidak_sesuai_skor: sampelTidakSesuaiSkor,
        pembatas_lahan: sampelPembatas
      }
    };
  }
}

module.exports = ValidationService;
