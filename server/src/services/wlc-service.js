const path = require("path");
const fs = require("fs");
const prisma = require("../prisma/prisma-client");
const GeotiffHelper = require("../helpers/geotiff-helper");
const { BadRequestError, NotFoundError } = require("../utils/error-handling-util");

class WlcService {
  /**
   * Pemetaan manual ID indikator ke string kode untuk response nilai_indikator di frontend.
   */
  static mapIndikatorIdToKode(id) {
    const mapping = {
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
      14: "sawah",
      15: "sempadan_sungai",
    };
    return mapping[id] || `indikator_${id}`;
  }

  /**
   * Mengamankan keberadaan grid sel 29x33 di database PostGIS jika tabel kosong.
   */
  static async ensureGridsExist(refRaster) {
    const count = await prisma.grid.count();
    if (count > 0) {
      return;
    }

    console.log(`[WLC] Menghasilkan 957 grid spasial baru SRID 32749 berbasis extent: ${refRaster.width}x${refRaster.height}...`);
    const width = refRaster.width;
    const height = refRaster.height;
    const min_x = refRaster.min_x;
    const max_y = refRaster.max_y;
    const res_x = refRaster.res_x;
    const res_y = refRaster.res_y;

    const grids = [];
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const index = r * width + c + 1;
        const kode_grid = `GRID-${String(index).padStart(3, "0")}`;

        const x_min = min_x + c * res_x;
        const x_max = min_x + (c + 1) * res_x;
        const y_min = max_y - (r + 1) * res_y;
        const y_max = max_y - r * res_y;

        const wkt = `POLYGON((${x_min} ${y_min}, ${x_max} ${y_min}, ${x_max} ${y_max}, ${x_min} ${y_max}, ${x_min} ${y_min}))`;
        grids.push({ kode_grid, wkt });
      }
    }

    // Insert batch menggunakan transaction raw SQL PostGIS
    await prisma.$transaction(async (tx) => {
      for (const grid of grids) {
        await tx.$executeRawUnsafe(
          `INSERT INTO grid (kode_grid, geom, created_at, updated_at) VALUES ($1, ST_GeomFromText($2, 32749), NOW(), NOW())`,
          grid.kode_grid,
          grid.wkt
        );
      }
    });

    console.log(`[WLC] Berhasil menginisialisasi ${grids.length} grid spasial.`);

    // Pemetaan kecamatan & kelurahan otomatis dari GeoJSON
    try {
      const geojsonPath = path.join(__dirname, "../prisma/seeder/batas_wilayah.geojson");
      if (fs.existsSync(geojsonPath)) {
        console.log("[WLC] Memetakan kecamatan & kelurahan dari GeoJSON...");
        const rawData = fs.readFileSync(geojsonPath, "utf-8");
        const geojson = JSON.parse(rawData);

        for (const feature of geojson.features) {
          const kecamatan = feature.properties.WADMKC;
          const kelurahan = feature.properties.WADMKD;
          if (kecamatan && kelurahan) {
            const geomStr = JSON.stringify(feature.geometry);
            await prisma.$executeRawUnsafe(
              `UPDATE grid
               SET kecamatan = $1, kelurahan = $2
               WHERE ST_Intersects(ST_SetSRID(ST_GeomFromGeoJSON($3), 32749), ST_Centroid(geom))`
              ,
              kecamatan,
              kelurahan,
              geomStr
            );
          }
        }
        console.log("[WLC] Pemetaan kecamatan & kelurahan selesai.");
      } else {
        console.log("[WLC] Peringatan: batas_wilayah.geojson tidak ditemukan, data kecamatan/kelurahan bernilai null.");
      }
    } catch (error) {
      console.error("[WLC] Gagal memetakan kecamatan & kelurahan dari GeoJSON:", error.message);
    }
  }

  /**
   * Menghitung kelas kesesuaian lokasi berdasarkan Equal Interval (3 Kelas)
   * Skor 0.667 - 1.000: Sesuai
   * Skor 0.333 - 0.667: Kurang Sesuai
   * Skor < 0.333 atau terkena mask kendala: Tidak Sesuai
   */
  static classifySuitability(score, isConstrained) {
    if (isConstrained || score === 0 || score < 0.333333) {
      return "Tidak Sesuai";
    }
    if (score < 0.666667) {
      return "Kurang Sesuai";
    }
    return "Sesuai";
  }

  /**
   * Melakukan kalkulasi spasial WLC utama berbasis Bobot Konsensus AHP (id_pakar = null)
   * Membaca fuzzy layers untuk kalkulasi dan raw layers untuk ekstraksi nilai asli indikator.
   */
  static async calculateWlcConsensus() {
    // 1. Ambil bobot konsensus indikator
    const weights = await prisma.bobotIndikator.findMany({
      where: { id_pakar: null }
    });

    if (weights.length === 0) {
      throw new BadRequestError(
        "Bobot konsensus AHP belum lengkap dihitung. Selesaikan penilaian AHP pakar dan hitung konsensus terlebih dahulu."
      );
    }

    // 2. Ambil seluruh indikator
    const activeIndicators = await prisma.indikator.findMany();

    if (activeIndicators.length === 0) {
      throw new BadRequestError("Tidak ada indikator yang terdaftar di database.");
    }

    // 3. Baca data piksel untuk setiap raster (Fuzzy dan Raw)
    const fuzzyRastersData = [];
    const rawRastersData = [];
    let refRaster = null;

    for (const ind of activeIndicators) {
      const isConstraint = ind.tipe_nilai === "mask";

      // A. Muat Raw Raster (untuk ekstraksi nilai asli di pop-up dan constraint masking)
      const rawRaster = await prisma.rasterLayer.findFirst({
        where: {
          id_indikator: ind.id_indikator,
          tipe_raster: "raw",
        }
      });

      if (!rawRaster) {
        throw new BadRequestError(`Berkas raster raw untuk indikator "${ind.nama_indikator}" tidak ditemukan.`);
      }

      const rawAbsPath = path.isAbsolute(rawRaster.file_path)
        ? rawRaster.file_path
        : path.join(process.cwd(), rawRaster.file_path);

      if (!fs.existsSync(rawAbsPath)) {
        throw new NotFoundError(`Berkas raster raw tidak ditemukan di disk: ${rawRaster.file_path}`);
      }

      const rawPixels = await GeotiffHelper.readPixelsForFuzzy(rawAbsPath);
      const rawMetadata = await GeotiffHelper.readMetadataOnly(rawAbsPath);

      const rawDataObj = {
        id_indikator: ind.id_indikator,
        kode_indikator: this.mapIndikatorIdToKode(ind.id_indikator),
        jenis: ind.tipe_nilai,
        pixelValues: rawPixels.pixelValues,
        width: rawPixels.width,
        height: rawPixels.height,
        noDataValue: rawPixels.noDataValue,
        min_x: Number(rawMetadata.extent.min_x),
        max_y: Number(rawMetadata.extent.max_y),
        res_x: Number(rawMetadata.resolution_x),
        res_y: Number(rawMetadata.resolution_y),
        absPath: rawAbsPath
      };
      rawRastersData.push(rawDataObj);

      // B. Muat Fuzzy Raster (hanya untuk indikator kriteria non-constraint)
      if (!isConstraint) {
        const fuzzyRaster = await prisma.rasterLayer.findFirst({
          where: {
            id_indikator: ind.id_indikator,
            tipe_raster: "fuzzy",
          }
        });

        if (!fuzzyRaster) {
          throw new BadRequestError(
            `Berkas raster fuzzy untuk indikator "${ind.nama_indikator}" belum diproses. Silakan selesaikan normalisasi fuzzy terlebih dahulu.`
          );
        }

        const fuzzyAbsPath = path.isAbsolute(fuzzyRaster.file_path)
          ? fuzzyRaster.file_path
          : path.join(process.cwd(), fuzzyRaster.file_path);

        if (!fs.existsSync(fuzzyAbsPath)) {
          throw new NotFoundError(`Berkas raster fuzzy tidak ditemukan di disk: ${fuzzyRaster.file_path}`);
        }

        const fuzzyPixels = await GeotiffHelper.readPixelsForFuzzy(fuzzyAbsPath);
        const fuzzyMetadata = await GeotiffHelper.readMetadataOnly(fuzzyAbsPath);
        
        // Cari bobot akhir indikator ini
        const wRecord = weights.find(w => w.id_indikator === ind.id_indikator);
        const weight = wRecord ? Number(wRecord.bobot_akhir) : 0.0;

        fuzzyRastersData.push({
          id_indikator: ind.id_indikator,
          kode_indikator: this.mapIndikatorIdToKode(ind.id_indikator),
          pixelValues: fuzzyPixels.pixelValues,
          width: fuzzyPixels.width,
          height: fuzzyPixels.height,
          noDataValue: fuzzyPixels.noDataValue,
          min_x: Number(fuzzyMetadata.extent.min_x),
          max_y: Number(fuzzyMetadata.extent.max_y),
          res_x: Number(fuzzyMetadata.resolution_x),
          res_y: Number(fuzzyMetadata.resolution_y),
          weight,
          absPath: fuzzyAbsPath
        });
      }

      // Cari grid acuan 29x33 (misal dari raw/constraint sawah/sungai)
      if (rawDataObj.width === 29 && rawDataObj.height === 33) {
        refRaster = rawDataObj;
      }
    }

    if (!refRaster) {
      refRaster = rawRastersData[0];
    }

    // 4. Pastikan grid PostGIS sudah terisi
    await this.ensureGridsExist(refRaster);

    const refWidth = refRaster.width;
    const refHeight = refRaster.height;
    const refMinX = refRaster.min_x;
    const refMaxY = refRaster.max_y;
    const refResX = refRaster.res_x;
    const refResY = refRaster.res_y;

    const wlcValues = new Array(refWidth * refHeight).fill(-9999.0);
    const gridScores = [];

    // Helper untuk mensample nilai pixel di koordinat geografis (x, y) dari dataset raster
    const sampleRasterAt = (rd, x, y) => {
      const inside =
        x >= rd.min_x &&
        x <= rd.min_x + rd.width * rd.res_x &&
        y <= rd.max_y &&
        y >= rd.max_y - rd.height * rd.res_y;

      if (inside) {
        const colIdx = Math.floor((x - rd.min_x) / rd.res_x);
        const rowIdx = Math.floor((rd.max_y - y) / rd.res_y);
        if (colIdx >= 0 && colIdx < rd.width && rowIdx >= 0 && rowIdx < rd.height) {
          const px = rd.pixelValues[rowIdx * rd.width + colIdx];
          if (px !== null && px !== rd.noDataValue && !Number.isNaN(px) && Number.isFinite(px)) {
            return px;
          }
        }
      }
      return null;
    };

    // 5. Hitung WLC per sel grid acuan
    for (let r = 0; r < refHeight; r++) {
      for (let c = 0; c < refWidth; c++) {
        const gridIndex = r * refWidth + c;
        const kode_grid = `GRID-${String(gridIndex + 1).padStart(3, "0")}`;

        // Titik pusat koordinat geografis sel grid
        const x = refMinX + (c + 0.5) * refResX;
        const y = refMaxY - (r + 0.5) * refResY;

        // Cek apakah koordinat berada di dalam wilayah studi (nilai reference raster tidak null/nodata)
        const refVal = sampleRasterAt(refRaster, x, y);
        if (refVal === null) {
          wlcValues[gridIndex] = -9999.0;
          continue;
        }

        // A. Ekstraksi seluruh nilai raw asli indikator untuk data pop-up peta
        const nilaiIndikatorRaw = {};
        for (const rdRaw of rawRastersData) {
          const rawVal = sampleRasterAt(rdRaw, x, y);
          // Jika diluar cropped bounding box, fallback ke 0
          const val = rawVal !== null ? rawVal : 0.0;
          
          nilaiIndikatorRaw[rdRaw.kode_indikator] = rdRaw.jenis === "mask"
            ? (val <= 0 ? 0 : 1)
            : Number(val.toFixed(3));

          // Dapatkan nilai fuzzy-nya
          let fuzzyVal = 0.0;
          if (rdRaw.jenis === "mask") {
            fuzzyVal = val <= 0 ? 0.0 : 1.0;
          } else {
            const rdFuzzy = fuzzyRastersData.find(f => f.id_indikator === rdRaw.id_indikator);
            if (rdFuzzy) {
              const fVal = sampleRasterAt(rdFuzzy, x, y);
              fuzzyVal = fVal !== null ? fVal : 0.0;
            }
          }
          nilaiIndikatorRaw["fuzzy_" + rdRaw.kode_indikator] = Number(fuzzyVal.toFixed(3));
        }

        // B. Kalkulasi WLC menggunakan fuzzy rasters
        let scoreSum = 0.0;
        let weightSum = 0.0;
        let constraintProduct = 1.0;

        // B1. Kriteria standard
        for (const rdFuzzy of fuzzyRastersData) {
          const fuzzyVal = sampleRasterAt(rdFuzzy, x, y);
          // Jika diluar cropped bounding box, fallback ke 0.0
          const val = fuzzyVal !== null ? fuzzyVal : 0.0;
          scoreSum += val * rdFuzzy.weight;
          weightSum += rdFuzzy.weight;
        }

        // B2. Constraint mask (Indikator 14 sawah dan Indikator 15 sempadan_sungai)
        const constraintRasters = rawRastersData.filter(rd => rd.jenis === "mask");
        for (const rdConst of constraintRasters) {
          const rawVal = sampleRasterAt(rdConst, x, y);
          // Jika diluar cropped bounding box, constraintVal = 1.0 (boleh/tidak melanggar)
          const constraintVal = rawVal !== null ? (rawVal <= 0 ? 0.0 : 1.0) : 1.0;
          constraintProduct *= constraintVal;
        }

        // Normalisasi
        const rawScore = weightSum > 0 ? scoreSum / weightSum : scoreSum;
        const finalScore = rawScore * constraintProduct;

        wlcValues[gridIndex] = finalScore;

        gridScores.push({
          kode_grid,
          skor_wlc: finalScore,
          is_constrained: constraintProduct === 0,
          nilai_indikator: nilaiIndikatorRaw
        });
      }
    }

    // 6. Kelompokkan kelas kesesuaian (Equal Interval 3 Kelas) & hitung ranking
    gridScores.forEach(gs => {
      gs.kelas_kesesuaian = this.classifySuitability(gs.skor_wlc, gs.is_constrained);
    });

    // Menghitung rangking untuk sel yang tidak dibatasi (skor > 0)
    const rankable = gridScores
      .filter(gs => gs.skor_wlc > 0)
      .sort((a, b) => b.skor_wlc - a.skor_wlc);

    rankable.forEach((gs, idx) => {
      const original = gridScores.find(o => o.kode_grid === gs.kode_grid);
      if (original) {
        original.ranking = idx + 1;
      }
    });

    // 7. Simpan file GeoTIFF output final_score ke disk
    const finalScoreDir = path.join(process.cwd(), "storage", "geotiff", "final_score");
    if (!fs.existsSync(finalScoreDir)) {
      fs.mkdirSync(finalScoreDir, { recursive: true });
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}_final_suitability.tif`;
    const finalAbsPath = path.join(finalScoreDir, fileName);
    const finalRelPath = `storage/geotiff/final_score/${fileName}`;

    // Gunakan file referensi untuk menjaga CRS dan koordinat peta
    await GeotiffHelper.writeGeoTIFF(finalAbsPath, wlcValues, refRaster.absPath, -9999);

    const finalMetadata = await GeotiffHelper.readMetadataOnly(finalAbsPath);

    // 8. Simpan run log, raster layer, dan hasil WLC per grid ke DB (Transaction)
    let filePathsToUnlink = [];

    const result = await prisma.$transaction(async (tx) => {
      // Cari dan hapus DB record AnalysisRun dan RasterLayer final_score lama, simpan file_path
      const oldRasters = await tx.rasterLayer.findMany({
        where: { tipe_raster: "final_score" }
      });
      filePathsToUnlink = oldRasters.map(r => r.file_path);

      await tx.analysisRun.deleteMany({});
      await tx.rasterLayer.deleteMany({
        where: { tipe_raster: "final_score" }
      });

      // Buat Run baru
      const newRun = await tx.analysisRun.create({
        data: {
          nama_run: `WLC Run ${new Date().toLocaleString()}`,
          status: "success",
        }
      });

      // Simpan layer final_score baru
      const newLayer = await tx.rasterLayer.create({
        data: {
          id_indikator: null,
          id_analysis_run: newRun.id_analysis_run,
          tipe_raster: "final_score",
          file_path: finalRelPath,
          crs: finalMetadata.crs,
          min_value: finalMetadata.min_value,
          max_value: finalMetadata.max_value,
          mean_value: finalMetadata.mean_value,
          nodata_value: -9999,
        }
      });

      // Ambil seluruh grid DB
      const gridsDb = await tx.grid.findMany({
        select: { id_grid: true, kode_grid: true }
      });

      const wlcPayload = gridScores.map(gs => {
        const gridDb = gridsDb.find(g => g.kode_grid === gs.kode_grid);
        if (!gridDb) {
          throw new BadRequestError(`Grid ${gs.kode_grid} tidak ditemukan di database.`);
        }

        return {
          id_analysis_run: newRun.id_analysis_run,
          id_grid: gridDb.id_grid,
          skor_wlc: gs.skor_wlc,
          kelas_kesesuaian: gs.kelas_kesesuaian,
          ranking: gs.ranking ?? null,
          nilai_indikator: gs.nilai_indikator
        };
      });

      await tx.hasilWlc.createMany({
        data: wlcPayload
      });

      return {
        run: newRun,
        layer: newLayer,
        totalGrids: wlcPayload.length
      };
    });

    // 9. Hapus file fisik raster lama dari penyimpanan setelah transaksi DB sukses
    for (const filePath of filePathsToUnlink) {
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      if (fs.existsSync(absolutePath)) {
        try {
          fs.unlinkSync(absolutePath);
        } catch (err) {
          console.warn(`  [WARNING] Gagal menghapus file final_score lama ${filePath}: ${err.message}`);
        }
      }
    }

    return result;
  }

  /**
   * Mengambil berkas raster WLC final_score yang aktif
   */
  static async getActiveWlc() {
    const active = await prisma.rasterLayer.findFirst({
      where: {
        tipe_raster: "final_score",
      }
    });

    if (!active) {
      throw new NotFoundError("Hasil kalkulasi WLC belum tersedia.");
    }

    const result = {
      ...active,
      versi: active.id_analysis_run,
      width: null,
      height: null,
      jumlah_pixel: null
    };

    try {
      const absolutePath = path.isAbsolute(active.file_path)
        ? active.file_path
        : path.join(process.cwd(), active.file_path);

      if (fs.existsSync(absolutePath)) {
        const metadata = await GeotiffHelper.readMetadataOnly(absolutePath);
        result.width = metadata.width;
        result.height = metadata.height;
        result.jumlah_pixel = metadata.jumlah_pixel;
      }
    } catch (err) {
      console.error("Gagal membaca metadata GeoTIFF WLC aktif:", err.message);
    }

    return result;
  }

  /**
   * Mengambil seluruh grid spasial PostGIS yang digabungkan dengan skor WLC aktif,
   * HANYA grid yang berada DI DALAM wilayah studi (memiliki kecamatan & kelurahan terisi).
   * Mentransformasikan geom (SRID 32749) ke WGS84 (SRID 4326) dalam format GeoJSON.
   */
  static async getWlcGrids() {
    const activeRun = await prisma.analysisRun.findFirst({
      orderBy: { id_analysis_run: "desc" }
    });

    if (!activeRun) {
      throw new NotFoundError("Kalkulasi WLC aktif belum dijalankan.");
    }

    // Gunakan raw query untuk mengekstrak geometri PostGIS ke GeoJSON EPSG 4326 beserta data nilai indikator
    // HANYA grid yang BERADA DI DALAM wilayah studi (memiliki kecamatan terisi)
    const rawData = await prisma.$queryRawUnsafe(`
      SELECT
        g.id_grid,
        g.kode_grid,
        g.kecamatan,
        g.kelurahan,
        h.skor_wlc,
        h.kelas_kesesuaian,
        h.ranking,
        h.nilai_indikator,
        ST_AsGeoJSON(ST_Transform(g.geom, 4326))::json as geojson
      FROM grid g
      INNER JOIN hasil_wlc h ON g.id_grid = h.id_grid
      WHERE h.id_analysis_run = $1
        AND g.kecamatan IS NOT NULL  -- Hanya grid di dalam wilayah studi
      ORDER BY g.id_grid ASC
    `, activeRun.id_analysis_run);

    const features = rawData.map(row => ({
      type: "Feature",
      properties: {
        gridId: row.id_grid,
        gridCode: row.kode_grid,
        kecamatan: row.kecamatan,
        kelurahan: row.kelurahan,
        scoreDefault: Number(row.skor_wlc),
        suitabilityClass: row.kelas_kesesuaian,
        rank: row.ranking,
        indicatorScores: row.nilai_indikator // Menampung objek JSON nilai asli indikator
      },
      geometry: row.geojson
    }));

    return {
      type: "FeatureCollection",
      features
    };
  }

  /**
   * Mengambil GeoJSON batas wilayah studi asli untuk divisualisasikan garis batasnya di Leaflet.
   */
  static async getBoundaryGeoJson() {
    const geojsonPath = path.join(__dirname, "../prisma/seeder/batas_wilayah.geojson");
    if (!fs.existsSync(geojsonPath)) {
      throw new NotFoundError("File batas_wilayah.geojson tidak ditemukan.");
    }
    const rawData = fs.readFileSync(geojsonPath, "utf-8");
    return JSON.parse(rawData);
  }
}

module.exports = WlcService;
