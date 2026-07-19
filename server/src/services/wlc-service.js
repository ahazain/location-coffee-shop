const path = require("path");
const fs = require("fs");
const prisma = require("../prisma/prisma-client");
const GeotiffHelper = require("../helpers/geotiff-helper");
const {
  BadRequestError,
  NotFoundError,
} = require("../utils/error-handling-util");

class WlcService {
  /**
   * Pemetaan manual ID indikator ke string kode untuk response nilai_indikator di frontend.
   */
  static mapIndikatorIdToKode(id) {
    return `ind_${id}`;
  }

  /**
   * Mengamankan keberadaan grid sel 29x33 di database PostGIS jika tabel kosong.
   */
  static async ensureGridsExist(refRaster) {
    const count = await prisma.grid.count();
    if (count > 0) {
      return;
    }

    console.log(
      `[WLC] Menghasilkan 957 grid spasial baru SRID 32749 berbasis extent: ${refRaster.width}x${refRaster.height}...`,
    );
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

    await prisma.$transaction(async (tx) => {
      for (const grid of grids) {
        await tx.$executeRawUnsafe(
          `INSERT INTO grid (kode_grid, geom, created_at, updated_at) VALUES ($1, ST_GeomFromText($2, 32749), NOW(), NOW())`,
          grid.kode_grid,
          grid.wkt,
        );
      }
    });

    console.log(
      `[WLC] Berhasil menginisialisasi ${grids.length} grid spasial.`,
    );

    try {
      const geojsonPath = path.join(
        __dirname,
        "../prisma/seeder/batas_wilayah.geojson",
      );
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
               WHERE ST_Intersects(ST_SetSRID(ST_GeomFromGeoJSON($3), 32749), ST_Centroid(geom))`,
              kecamatan,
              kelurahan,
              geomStr,
            );
          }
        }
        console.log("[WLC] Pemetaan kecamatan & kelurahan selesai.");
      } else {
        console.log(
          "[WLC] Peringatan: batas_wilayah.geojson tidak ditemukan, data kecamatan/kelurahan bernilai null.",
        );
      }
    } catch (error) {
      console.error(
        "[WLC] Gagal memetakan kecamatan & kelurahan dari GeoJSON:",
        error.message,
      );
    }
  }

  /**
   * Menghitung kelas kesesuaian lokasi berdasarkan Equal Interval (3 Kelas).
   * Nilai yang dikembalikan HARUS sama persis dengan member enum KelasKesesuaian
   * pada schema.prisma: KURANG_SESUAI | CUKUP_SESUAI | SESUAI.
   * (Prisma Client menerima nama member enum, bukan nilai @map di database.)
   *
   * Skor 0.667 - 1.000        -> SESUAI
   * Skor 0.333 - 0.667        -> CUKUP_SESUAI
   * Skor < 0.333 atau terkena mask kendala -> KURANG_SESUAI
   */
  static classifySuitability(score, isConstrained) {
    if (isConstrained || score === 0 || score < 0.333333) {
      return "KURANG_SESUAI";
    }
    if (score < 0.666667) {
      return "CUKUP_SESUAI";
    }
    return "SESUAI";
  }

  /**
   * Mengklasifikasikan data menggunakan algoritma Jenks Natural Breaks (Fisher-Jenks).
   * Membagi data numerik menjadi numClass kelompok yang homogen secara internal.
   * Mengembalikan array batas kelas: [min, break1, break2, max]
   */
  static getJenksBreaks(data, numClass) {
    if (!data || data.length === 0) return [];
    
    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;
    
    if (n <= numClass) {
      const res = [sorted[0]];
      for (let i = 0; i < numClass; i++) {
        res.push(sorted[Math.min(i, n - 1)]);
      }
      return res;
    }
    
    const mat1 = Array.from({ length: n + 1 }, () => Array(numClass + 1).fill(0));
    const mat2 = Array.from({ length: n + 1 }, () => Array(numClass + 1).fill(0));
    
    for (let i = 1; i <= numClass; i++) {
      mat1[1][i] = 1;
      mat2[1][i] = 0;
      for (let j = 2; j <= n; j++) {
        mat2[j][i] = Infinity;
      }
    }

    let v = 0;
    for (let l = 2; l <= n; l++) {
      let s1 = 0;
      let s2 = 0;
      let w = 0;
      for (let m = 1; m <= l; m++) {
        const i3 = l - m + 1;
        const val = sorted[i3 - 1];
        s1 += val;
        s2 += val * val;
        w += 1;
        v = s2 - (s1 * s1) / w;
        const i4 = i3 - 1;
        if (i4 !== 0) {
          for (let j = 2; j <= numClass; j++) {
            if (mat2[l][j] >= v + mat2[i4][j - 1]) {
              mat1[l][j] = i3;
              mat2[l][j] = v + mat2[i4][j - 1];
            }
          }
        }
      }
      mat1[l][1] = 1;
      mat2[l][1] = v;
    }

    let k = n;
    const kclass = [];
    kclass[numClass] = sorted[n - 1];
    kclass[0] = sorted[0];

    for (let j = numClass; j >= 2; j--) {
      const id = mat1[k][j] - 2;
      kclass[j - 1] = sorted[id];
      k = mat1[k][j] - 1;
    }

    return kclass;
  }
  /**
     * Melakukan kalkulasi spasial WLC utama berbasis Bobot Konsensus AHP.
     *
     * "Bobot konsensus" di sini dihitung dengan merata-ratakan bobot_akhir
     * seluruh pakar (id_pakar bukan null) per indikator — lihat getConsensusWeight().
     * Bukan query khusus id_pakar = null.
  */
  static async calculateWlcConsensus() {
    const activeWeights = await prisma.bobotIndikator.findMany({
      where: { id_pakar: { not: null } },
    });

    if (activeWeights.length === 0) {
      throw new BadRequestError(
        "Bobot konsensus AHP belum lengkap dihitung. Selesaikan penilaian AHP pakar dan hitung konsensus terlebih dahulu.",
      );
    }

    const consensusWeights = {};
    activeWeights.forEach((w) => {
      if (!consensusWeights[w.id_indikator]) {
        consensusWeights[w.id_indikator] = [];
      }
      consensusWeights[w.id_indikator].push(Number(w.bobot_akhir));
    });

    const getConsensusWeight = (indicatorId) => {
      const list = consensusWeights[indicatorId];
      if (!list || list.length === 0) return 0.0;
      const sum = list.reduce((a, b) => a + b, 0);
      return sum / list.length;
    };

    const activeIndicators = await prisma.indikator.findMany();

    if (activeIndicators.length === 0) {
      throw new BadRequestError(
        "Tidak ada indikator yang terdaftar di database.",
      );
    }

    const fuzzyRastersData = [];
    const rawRastersData = [];
    let refRaster = null;

    for (const ind of activeIndicators) {
      // Enum TipeNilaiIndikator: KEPADATAN | JARAK | INTENSITAS | MASK
      const isConstraint = ind.tipe_nilai === "MASK";

      const rawRaster = await prisma.rasterLayer.findFirst({
        where: {
          id_indikator: ind.id_indikator,
          tipe_raster: "RAW", // Enum TipeRaster: RAW | FUZZY | FINAL_SCORE
        },
      });

      if (!rawRaster) {
        throw new BadRequestError(
          `Berkas raster raw untuk indikator "${ind.nama_indikator}" tidak ditemukan.`,
        );
      }

      const rawAbsPath = path.isAbsolute(rawRaster.file_path)
        ? rawRaster.file_path
        : path.join(process.cwd(), rawRaster.file_path);

      if (!fs.existsSync(rawAbsPath)) {
        throw new NotFoundError(
          `Berkas raster raw tidak ditemukan di disk: ${rawRaster.file_path}`,
        );
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
        absPath: rawAbsPath,
      };
      rawRastersData.push(rawDataObj);

      if (!isConstraint) {
        const fuzzyRaster = await prisma.rasterLayer.findFirst({
          where: {
            id_indikator: ind.id_indikator,
            tipe_raster: "FUZZY",
          },
        });

        if (!fuzzyRaster) {
          throw new BadRequestError(
            `Berkas raster fuzzy untuk indikator "${ind.nama_indikator}" belum diproses. Silakan selesaikan normalisasi fuzzy terlebih dahulu.`,
          );
        }

        const fuzzyAbsPath = path.isAbsolute(fuzzyRaster.file_path)
          ? fuzzyRaster.file_path
          : path.join(process.cwd(), fuzzyRaster.file_path);

        if (!fs.existsSync(fuzzyAbsPath)) {
          throw new NotFoundError(
            `Berkas raster fuzzy tidak ditemukan di disk: ${fuzzyRaster.file_path}`,
          );
        }

        const fuzzyPixels =
          await GeotiffHelper.readPixelsForFuzzy(fuzzyAbsPath);
        const fuzzyMetadata =
          await GeotiffHelper.readMetadataOnly(fuzzyAbsPath);

        const weight = getConsensusWeight(ind.id_indikator);

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
          absPath: fuzzyAbsPath,
        });
      }

      if (rawDataObj.width === 29 && rawDataObj.height === 33) {
        refRaster = rawDataObj;
      }
    }

    if (!refRaster) {
      refRaster = rawRastersData[0];
    }

    await this.ensureGridsExist(refRaster);

    const refWidth = refRaster.width;
    const refHeight = refRaster.height;
    const refMinX = refRaster.min_x;
    const refMaxY = refRaster.max_y;
    const refResX = refRaster.res_x;
    const refResY = refRaster.res_y;

    const wlcValues = new Array(refWidth * refHeight).fill(-9999.0);
    const gridScores = [];

    const sampleRasterAt = (rd, x, y) => {
      const inside =
        x >= rd.min_x &&
        x <= rd.min_x + rd.width * rd.res_x &&
        y <= rd.max_y &&
        y >= rd.max_y - rd.height * rd.res_y;

      if (inside) {
        const colIdx = Math.floor((x - rd.min_x) / rd.res_x);
        const rowIdx = Math.floor((rd.max_y - y) / rd.res_y);
        if (
          colIdx >= 0 &&
          colIdx < rd.width &&
          rowIdx >= 0 &&
          rowIdx < rd.height
        ) {
          const px = rd.pixelValues[rowIdx * rd.width + colIdx];
          if (
            px !== null &&
            px !== rd.noDataValue &&
            !Number.isNaN(px) &&
            Number.isFinite(px)
          ) {
            return px;
          }
        }
      }
      return null;
    };

    for (let r = 0; r < refHeight; r++) {
      for (let c = 0; c < refWidth; c++) {
        const gridIndex = r * refWidth + c;
        const kode_grid = `GRID-${String(gridIndex + 1).padStart(3, "0")}`;

        const x = refMinX + (c + 0.5) * refResX;
        const y = refMaxY - (r + 0.5) * refResY;

        const refVal = sampleRasterAt(refRaster, x, y);
        if (refVal === null) {
          wlcValues[gridIndex] = -9999.0;
          continue;
        }

        const nilaiIndikatorRaw = {};
        let scoreSum = 0.0;
        let weightSum = 0.0;
        let constraintProduct = 1.0;
        const fuzzyEntries = []; // cache: hindari sampling ganda per indikator non-MASK

        for (const rdRaw of rawRastersData) {
          const rawVal = sampleRasterAt(rdRaw, x, y);
          const val = rawVal !== null ? rawVal : 0.0;

          nilaiIndikatorRaw[rdRaw.kode_indikator] =
            rdRaw.jenis === "MASK"
              ? val <= 0
                ? 0
                : 1
              : Number(val.toFixed(3));

          let fuzzyVal = 0.0;
          if (rdRaw.jenis === "MASK") {
            fuzzyVal = val <= 0 ? 0.0 : 1.0;
            constraintProduct *= fuzzyVal;
          } else {
            const rdFuzzy = fuzzyRastersData.find(
              (f) => f.id_indikator === rdRaw.id_indikator,
            );
            if (rdFuzzy) {
              const fVal = sampleRasterAt(rdFuzzy, x, y);
              fuzzyVal = fVal !== null ? fVal : 0.0;
            }
            // Bulatkan fuzzyVal SEKALI di sini (nilai kanonis), lalu pakai
            // nilai yang SAMA ini untuk ditampilkan (fuzzy_*) maupun untuk
            // menghitung terbobot_*. Jangan ada dua versi presisi berbeda
            // dari angka yang sama beredar di response.
            fuzzyVal = Number(fuzzyVal.toFixed(4));
            const weight = getConsensusWeight(rdRaw.id_indikator);
            fuzzyEntries.push({ kode: rdRaw.kode_indikator, fuzzyVal, weight });
          }

          nilaiIndikatorRaw["fuzzy_" + rdRaw.kode_indikator] = fuzzyVal;
        }

        // Hitung total weightSum terlebih dahulu
        for (const { weight } of fuzzyEntries) {
          weightSum += weight;
        }

        // Bobot & terbobot dibulatkan LEBIH DULU per indikator (ini yang
        // ditampilkan sebagai breakdown resmi ke user).
        let roundedTerbobotSum = 0;
        for (const { kode, fuzzyVal, weight } of fuzzyEntries) {
          const normalizedWeight = weightSum > 0 ? weight / weightSum : 0;
          const weightedScoreRounded = Number(
            (fuzzyVal * normalizedWeight).toFixed(4),
          );
          nilaiIndikatorRaw["bobot_" + kode] = Number(
            normalizedWeight.toFixed(4),
          );
          nilaiIndikatorRaw["terbobot_" + kode] = weightedScoreRounded;
          roundedTerbobotSum += weightedScoreRounded;
        }

        // skor_wlc WAJIB diturunkan dari penjumlahan terbobot_i yang SAMA
        // dengan yang ditampilkan ke user, bukan dihitung ulang terpisah
        // dari scoreSum presisi penuh. Ini memastikan Σ(terbobot_i) selalu
        // identik dengan skor_wlc, bukan hanya mendekati.
        const adjustedScore =
          Number(roundedTerbobotSum.toFixed(4)) * constraintProduct;

        wlcValues[gridIndex] = adjustedScore;

        gridScores.push({
          kode_grid,
          skor_wlc: adjustedScore,
          is_constrained: constraintProduct === 0,
          nilai_indikator: nilaiIndikatorRaw,
        });
      }
    }

    // 1. Kumpulkan nilai skor WLC yang valid (tidak constrained dan skor > 0)
    const validScores = gridScores
      .filter((gs) => !gs.is_constrained && gs.skor_wlc > 0)
      .map((gs) => gs.skor_wlc);

    // 2. Hitung Jenks Natural Breaks untuk 3 kelas (mengasilkan 2 batas kelas)
    let break1 = 0.333333;
    let break2 = 0.666667;
    
    if (validScores.length >= 3) {
      const breaks = this.getJenksBreaks(validScores, 3);
      if (breaks && breaks.length === 4) {
        break1 = breaks[1];
        break2 = breaks[2];
        console.log(`[WLC] Jenks Natural Breaks calculated: break1=${break1.toFixed(4)}, break2=${break2.toFixed(4)}`);
      }
    }

    // 3. Terapkan kelas kesesuaian berdasarkan batas kelas Jenks
    gridScores.forEach((gs) => {
      if (gs.is_constrained || gs.skor_wlc === 0) {
        gs.kelas_kesesuaian = "KURANG_SESUAI";
      } else if (gs.skor_wlc <= break1) {
        gs.kelas_kesesuaian = "KURANG_SESUAI";
      } else if (gs.skor_wlc <= break2) {
        gs.kelas_kesesuaian = "CUKUP_SESUAI";
      } else {
        gs.kelas_kesesuaian = "SESUAI";
      }
    });

    const rankable = gridScores
      .filter((gs) => gs.skor_wlc > 0)
      .sort((a, b) => b.skor_wlc - a.skor_wlc);

    rankable.forEach((gs, idx) => {
      const original = gridScores.find((o) => o.kode_grid === gs.kode_grid);
      if (original) {
        original.ranking = idx + 1;
      }
    });

    const finalScoreDir = path.join(
      process.cwd(),
      "storage",
      "geotiff",
      "final_score",
    );
    if (!fs.existsSync(finalScoreDir)) {
      fs.mkdirSync(finalScoreDir, { recursive: true });
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}_final_suitability.tif`;
    const finalAbsPath = path.join(finalScoreDir, fileName);
    const finalRelPath = `storage/geotiff/final_score/${fileName}`;

    await GeotiffHelper.writeGeoTIFF(
      finalAbsPath,
      wlcValues,
      refRaster.absPath,
      -9999,
    );

    const finalMetadata = await GeotiffHelper.readMetadataOnly(finalAbsPath);


    let filePathsToUnlink = [];

    const result = await prisma.$transaction(async (tx) => {
      const oldRasters = await tx.rasterLayer.findMany({
        where: { tipe_raster: "FINAL_SCORE" },
      });
      filePathsToUnlink = oldRasters.map((r) => r.file_path);

      await tx.hasilWlc.deleteMany({});
      await tx.rasterLayer.deleteMany({
        where: { tipe_raster: "FINAL_SCORE" },
      });

      // kode_layer bersifat @unique dan wajib pada schema RasterLayer.
      const newLayer = await tx.rasterLayer.create({
        data: {
          id_indikator: null,
          kode_layer: `FINAL-SCORE-${timestamp}`,
          tipe_raster: "FINAL_SCORE",
          file_path: finalRelPath,
          crs: finalMetadata.crs,
          min_value: finalMetadata.min_value,
          max_value: finalMetadata.max_value,
          mean_value: finalMetadata.mean_value,
          nodata_value: -9999,
        },
      });

      const gridsDb = await tx.grid.findMany({
        select: { id_grid: true, kode_grid: true },
      });

      const wlcPayload = gridScores.map((gs) => {
        const gridDb = gridsDb.find((g) => g.kode_grid === gs.kode_grid);
        if (!gridDb) {
          throw new BadRequestError(
            `Grid ${gs.kode_grid} tidak ditemukan di database.`,
          );
        }

        return {
          id_grid: gridDb.id_grid,
          skor_wlc: gs.skor_wlc,
          kelas_kesesuaian: gs.kelas_kesesuaian,
          ranking: gs.ranking ?? null,
          nilai_indikator: gs.nilai_indikator,
        };
      });

      await tx.hasilWlc.createMany({
        data: wlcPayload,
      });

      return {
        layer: newLayer,
        totalGrids: wlcPayload.length,
      };
    });

    for (const filePath of filePathsToUnlink) {
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      if (fs.existsSync(absolutePath)) {
        try {
          fs.unlinkSync(absolutePath);
        } catch (err) {
          console.warn(
            `  [WARNING] Gagal menghapus file final_score lama ${filePath}: ${err.message}`,
          );
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
        tipe_raster: "FINAL_SCORE",
      },
    });

    if (!active) {
      throw new NotFoundError("Hasil kalkulasi WLC belum tersedia.");
    }

    const result = {
      ...active,
      width: null,
      height: null,
      jumlah_pixel: null,
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
   *
   * Karena HasilWlc.id_grid bersifat @unique (satu hasil per grid, tanpa konsep
   * "run"), query di bawah tidak lagi memfilter berdasarkan id_analysis_run.
   */
  static async getWlcGrids() {
    const rawData = await prisma.$queryRawUnsafe(
      `
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
      WHERE g.kecamatan IS NOT NULL  -- Hanya grid di dalam wilayah studi
      ORDER BY g.id_grid ASC
    `,
    );

    if (rawData.length === 0) {
      throw new NotFoundError("Kalkulasi WLC aktif belum dijalankan.");
    }

    const mapDbClassToUi = (dbClass) => {
      if (!dbClass) return "";
      const normalized = dbClass.toLowerCase();
      if (normalized === "sesuai") return "Sesuai";
      if (normalized === "cukup_sesuai") return "Cukup Sesuai";
      if (normalized === "kurang_sesuai") return "Kurang Sesuai";
      return dbClass;
    };

    const features = rawData.map((row) => ({
      type: "Feature",
      properties: {
        gridId: row.id_grid,
        gridCode: row.kode_grid,
        kecamatan: row.kecamatan,
        kelurahan: row.kelurahan,
        scoreDefault: Number(row.skor_wlc),
        suitabilityClass: mapDbClassToUi(row.kelas_kesesuaian),
        rank: row.ranking,
        indicatorScores: row.nilai_indikator,
      },
      geometry: row.geojson,
    }));

    return {
      type: "FeatureCollection",
      features,
    };
  }

  /**
   * (Sementara) Mengambil gridId dan nilai fuzzy untuk wilayah studi saja
   */
  static async getSementaraFuzzy() {
    const rawData = await prisma.$queryRawUnsafe(
      `
      SELECT
        g.id_grid,
        g.kode_grid,
        g.kecamatan,
        g.kelurahan,
        h.nilai_indikator
      FROM grid g
      INNER JOIN hasil_wlc h ON g.id_grid = h.id_grid
      WHERE g.kecamatan IS NOT NULL
      ORDER BY g.id_grid ASC
    `,
    );

    return rawData.map((row) => {
      const fuzzyValues = {};
      if (row.nilai_indikator) {
        Object.keys(row.nilai_indikator).forEach((key) => {
          if (key.startsWith("fuzzy_")) {
            fuzzyValues[key] = row.nilai_indikator[key];
          }
        });
      }
      return {
        gridId: row.id_grid,
        gridCode: row.kode_grid,
        kecamatan: row.kecamatan,
        kelurahan: row.kelurahan,
        fuzzyValues,
      };
    });
  }

  /**
   * Mengambil GeoJSON batas wilayah studi asli untuk divisualisasikan garis batasnya di Leaflet.
   */
  static async getBoundaryGeoJson() {
    const geojsonPath = path.join(
      __dirname,
      "../prisma/seeder/batas_wilayah.geojson",
    );
    if (!fs.existsSync(geojsonPath)) {
      throw new NotFoundError("File batas_wilayah.geojson tidak ditemukan.");
    }
    const rawData = fs.readFileSync(geojsonPath, "utf-8");
    return JSON.parse(rawData);
  }
}

module.exports = WlcService;
