const path = require("path");
const fs = require("fs");
const prisma = require("../prisma/prisma-client");
const GeotiffHelper = require("../helpers/geotiff-helper");
const { BadRequestError, NotFoundError } = require("../utils/error-handling-util");

class WlcService {
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

    // 2. Ambil seluruh indikator aktif
    const activeIndicators = await prisma.indikator.findMany({
      where: { is_active: true }
    });

    if (activeIndicators.length === 0) {
      throw new BadRequestError("Tidak ada indikator aktif yang terdaftar di database.");
    }

    // 3. Baca data piksel untuk setiap raster aktif (Fuzzy dan Raw)
    const fuzzyRastersData = [];
    const rawRastersData = [];
    let refRaster = null;

    for (const ind of activeIndicators) {
      const isConstraint = ind.jenis_indikator === "constraint";

      // A. Muat Raw Raster (untuk ekstraksi nilai asli di pop-up dan constraint masking)
      const rawRaster = await prisma.rasterLayer.findFirst({
        where: {
          id_indikator: ind.id_indikator,
          tipe_raster: "raw",
          is_active: true
        }
      });

      if (!rawRaster) {
        throw new BadRequestError(`Berkas raster raw untuk indikator "${ind.nama_indikator}" belum aktif atau tidak ditemukan.`);
      }

      const rawAbsPath = path.isAbsolute(rawRaster.file_path)
        ? rawRaster.file_path
        : path.join(process.cwd(), rawRaster.file_path);

      if (!fs.existsSync(rawAbsPath)) {
        throw new NotFoundError(`Berkas raster raw tidak ditemukan di disk: ${rawRaster.file_path}`);
      }

      const rawPixels = await GeotiffHelper.readPixelsForFuzzy(rawAbsPath);
      const rawDataObj = {
        id_indikator: ind.id_indikator,
        kode_indikator: ind.kode_indikator,
        jenis: ind.jenis_indikator,
        pixelValues: rawPixels.pixelValues,
        width: rawPixels.width,
        height: rawPixels.height,
        noDataValue: rawPixels.noDataValue,
        min_x: Number(rawRaster.extent.min_x),
        max_y: Number(rawRaster.extent.max_y),
        res_x: Number(rawRaster.resolution_x),
        res_y: Number(rawRaster.resolution_y),
        absPath: rawAbsPath
      };
      rawRastersData.push(rawDataObj);

      // B. Muat Fuzzy Raster (hanya untuk indikator kriteria non-constraint 1 s.d 13)
      if (!isConstraint) {
        const fuzzyRaster = await prisma.rasterLayer.findFirst({
          where: {
            id_indikator: ind.id_indikator,
            tipe_raster: "fuzzy",
            is_active: true
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
        
        // Cari bobot akhir indikator ini
        const wRecord = weights.find(w => w.id_indikator === ind.id_indikator);
        const weight = wRecord ? Number(wRecord.bobot_akhir) : 0.0;

        fuzzyRastersData.push({
          id_indikator: ind.id_indikator,
          kode_indikator: ind.kode_indikator,
          pixelValues: fuzzyPixels.pixelValues,
          width: fuzzyPixels.width,
          height: fuzzyPixels.height,
          noDataValue: fuzzyPixels.noDataValue,
          min_x: Number(fuzzyRaster.extent.min_x),
          max_y: Number(fuzzyRaster.extent.max_y),
          res_x: Number(fuzzyRaster.resolution_x),
          res_y: Number(fuzzyRaster.resolution_y),
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

    // 4. Pastikan grid sel PostGIS sudah terisi
    await this.ensureGridsExist(refRaster);

    const refWidth = refRaster.width;
    const refHeight = refRaster.height;
    const refMinX = refRaster.min_x;
    const refMaxY = refRaster.max_y;
    const refResX = refRaster.res_x;
    const refResY = refRaster.res_y;

    const wlcValues = new Array(refWidth * refHeight).fill(0.0);
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
      return 0.0;
    };

    // 5. Hitung WLC per sel grid acuan
    for (let r = 0; r < refHeight; r++) {
      for (let c = 0; c < refWidth; c++) {
        const gridIndex = r * refWidth + c;
        const kode_grid = `GRID-${String(gridIndex + 1).padStart(3, "0")}`;

        // Titik pusat koordinat geografis sel grid
        const x = refMinX + (c + 0.5) * refResX;
        const y = refMaxY - (r + 0.5) * refResY;

        // A. Ekstraksi seluruh nilai raw asli indikator untuk data pop-up peta
        const nilaiIndikatorRaw = {};
        for (const rdRaw of rawRastersData) {
          const rawVal = sampleRasterAt(rdRaw, x, y);
          // Simpan nilai biner 0/1 untuk constraint, desimal dibulatkan 3 angka di belakang koma untuk kemudahan pembacaan
          nilaiIndikatorRaw[rdRaw.kode_indikator] = rdRaw.jenis === "constraint"
            ? (rawVal <= 0 ? 0 : 1)
            : Number(rawVal.toFixed(3));
        }

        // B. Kalkulasi WLC menggunakan fuzzy rasters
        let scoreSum = 0.0;
        let weightSum = 0.0;
        let constraintProduct = 1.0;

        // B1. Kriteria standard
        for (const rdFuzzy of fuzzyRastersData) {
          const fuzzyVal = sampleRasterAt(rdFuzzy, x, y);
          scoreSum += fuzzyVal * rdFuzzy.weight;
          weightSum += rdFuzzy.weight;
        }

        // B2. Constraint mask (Indikator 14 sawah dan Indikator 15 sempadan_sungai)
        const constraintRasters = rawRastersData.filter(rd => rd.jenis === "constraint");
        for (const rdConst of constraintRasters) {
          const rawVal = sampleRasterAt(rdConst, x, y);
          const constraintVal = rawVal <= 0 ? 0.0 : 1.0;
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
    const result = await prisma.$transaction(async (tx) => {
      // Dapatkan versi baru
      const agg = await tx.rasterLayer.aggregate({
        where: { tipe_raster: "final_score" },
        _max: { versi: true }
      });
      const nextVersi = agg._max.versi ? agg._max.versi + 1 : 1;

      // Deaktivasi run dan layer final_score lama
      await tx.analysisRun.updateMany({
        where: { tipe_run: "default", is_active: true },
        data: { is_active: false }
      });

      await tx.rasterLayer.updateMany({
        where: { tipe_raster: "final_score", is_active: true },
        data: { is_active: false }
      });

      // Buat Run baru
      const newRun = await tx.analysisRun.create({
        data: {
          tipe_run: "default",
          nama_run: `WLC Run v${nextVersi}`,
          status: "success",
          keterangan: "Kalkulasi WLC konsensus rata-rata pakar utama",
          versi: nextVersi,
          is_active: true
        }
      });

      // Simpan layer final_score baru
      const newLayer = await tx.rasterLayer.create({
        data: {
          id_indikator: null,
          id_analysis_run: newRun.id_analysis_run,
          tipe_raster: "final_score",
          file_path: finalRelPath,
          original_filename: fileName,
          crs: finalMetadata.crs,
          resolution_x: finalMetadata.resolution_x,
          resolution_y: finalMetadata.resolution_y,
          width: finalMetadata.width,
          height: finalMetadata.height,
          band_count: finalMetadata.band_count,
          extent: finalMetadata.extent,
          min_value: finalMetadata.min_value,
          max_value: finalMetadata.max_value,
          mean_value: finalMetadata.mean_value,
          std_value: finalMetadata.std_value,
          nodata_value: finalMetadata.nodata_value,
          jumlah_pixel: finalMetadata.jumlah_pixel,
          jumlah_pixel_valid: finalMetadata.jumlah_pixel_valid,
          jumlah_pixel_nodata: finalMetadata.jumlah_pixel_nodata,
          versi: nextVersi,
          is_active: true
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

    return result;
  }

  /**
   * Mengambil berkas raster WLC final_score yang sedang aktif
   */
  static async getActiveWlc() {
    const active = await prisma.rasterLayer.findFirst({
      where: {
        tipe_raster: "final_score",
        is_active: true
      }
    });

    if (!active) {
      throw new NotFoundError("Hasil kalkulasi WLC belum tersedia.");
    }

    return active;
  }

  /**
   * Mengambil seluruh grid spasial PostGIS yang digabungkan dengan skor WLC aktif,
   * lalu mentransformasikan geom (SRID 32749) ke WGS84 (SRID 4326) dalam format GeoJSON.
   */
  static async getWlcGrids() {
    const activeRun = await prisma.analysisRun.findFirst({
      where: {
        tipe_run: "default",
        is_active: true
      }
    });

    if (!activeRun) {
      throw new NotFoundError("Kalkulasi WLC aktif belum dijalankan.");
    }

    // Gunakan raw query untuk mengekstrak geometri PostGIS ke GeoJSON EPSG 4326 beserta data nilai indikator
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
}

module.exports = WlcService;
