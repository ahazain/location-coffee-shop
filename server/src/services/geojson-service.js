const prisma = require("../prisma/prisma-client");
const GeojsonHelper = require("../helpers/geojson-helper");
const {
  BadRequestError,
  NotFoundError,
} = require("../utils/error-handling-util");

class GeojsonService {
  static parseId(id, fieldName = "ID") {
    const parsedId = Number(id);

    if (!id || Number.isNaN(parsedId)) {
      throw new BadRequestError(`${fieldName} tidak valid.`);
    }

    return parsedId;
  }

  static async getActiveIndicatorMap(tx) {
    const indicators = await tx.indikator.findMany({
      where: {
        is_active: true,
        NOT: {
          jenis_indikator: "constraint",
        },
      },
      select: {
        id_indikator: true,
        kode_indikator: true,
        nama_indikator: true,
        jenis_indikator: true,
      },
      orderBy: {
        id_indikator: "asc",
      },
    });

    const indicatorMap = new Map();

    for (const indicator of indicators) {
      indicatorMap.set(indicator.kode_indikator, indicator);
    }

    return indicatorMap;
  }

  static async upsertGrid(tx, feature) {
    const properties = GeojsonHelper.getProperties(feature);
    const geometry = GeojsonHelper.getGeometry(feature);

    const kodeGrid = GeojsonHelper.getKodeGrid(properties);
    const kecamatan = properties.kecamatan || properties.Kecamatan || null;
    const kelurahan = properties.kelurahan || properties.Kelurahan || null;
    const luasGrid = GeojsonHelper.parseNumber(
      properties.luas_grid || properties.luas || properties.area,
    );

    const geometryJson = JSON.stringify(geometry);

    await tx.$executeRaw`
      INSERT INTO grid (
        kode_grid,
        kecamatan,
        kelurahan,
        luas_grid,
        geom,
        created_at,
        updated_at
      )
      VALUES (
        ${kodeGrid},
        ${kecamatan},
        ${kelurahan},
        ${luasGrid},
        ST_SetSRID(ST_GeomFromGeoJSON(${geometryJson}), 4326),
        NOW(),
        NOW()
      )
      ON CONFLICT (kode_grid)
      DO UPDATE SET
        kecamatan = EXCLUDED.kecamatan,
        kelurahan = EXCLUDED.kelurahan,
        luas_grid = EXCLUDED.luas_grid,
        geom = EXCLUDED.geom,
        updated_at = NOW();
    `;

    const grid = await tx.grid.findUnique({
      where: {
        kode_grid: kodeGrid,
      },
      select: {
        id_grid: true,
        kode_grid: true,
      },
    });

    if (!grid) {
      throw new BadRequestError(`Grid ${kodeGrid} gagal disimpan.`);
    }

    return grid;
  }

  static async upsertNilaiIndikator(tx, { id_grid, id_indikator, nilai_asli }) {
    await tx.nilaiIndikator.upsert({
      where: {
        id_grid_id_indikator: {
          id_grid,
          id_indikator,
        },
      },
      update: {
        nilai_asli,
      },
      create: {
        id_grid,
        id_indikator,
        nilai_asli,
      },
    });
  }

  static async updateStatistikIndikator(tx, id_indikator) {
    const nilaiRows = await tx.nilaiIndikator.findMany({
      where: {
        id_indikator,
      },
      select: {
        nilai_asli: true,
      },
    });

    const values = nilaiRows.map((row) => Number(row.nilai_asli));
    const stats = GeojsonHelper.calculateStats(values);

    await tx.statistikIndikator.upsert({
      where: {
        id_indikator,
      },
      update: {
        nilai_min: stats.nilai_min,
        nilai_max: stats.nilai_max,
        nilai_mean: stats.nilai_mean,
        nilai_median: stats.nilai_median,
        nilai_std: stats.nilai_std,
        jumlah_data: stats.jumlah_data,
      },
      create: {
        id_indikator,
        nilai_min: stats.nilai_min,
        nilai_max: stats.nilai_max,
        nilai_mean: stats.nilai_mean,
        nilai_median: stats.nilai_median,
        nilai_std: stats.nilai_std,
        jumlah_data: stats.jumlah_data,
      },
    });

    return stats;
  }

  static async importGrid({ file }) {
    if (!file) {
      throw new BadRequestError("File GeoJSON wajib diunggah.");
    }

    const geojson = GeojsonHelper.readGeojsonFile(file.path);

    const result = await prisma.$transaction(async (tx) => {
      const indicatorMap = await this.getActiveIndicatorMap(tx);

      let totalGrid = 0;
      let totalNilaiIndikator = 0;

      const touchedIndicatorIds = new Set();

      for (const feature of geojson.features) {
        const properties = GeojsonHelper.getProperties(feature);
        const grid = await this.upsertGrid(tx, feature);

        totalGrid += 1;

        for (const [propertyName, propertyValue] of Object.entries(
          properties,
        )) {
          if (!indicatorMap.has(propertyName)) {
            continue;
          }

          const indicator = indicatorMap.get(propertyName);
          const nilaiAsli = GeojsonHelper.parseNumber(propertyValue);

          if (nilaiAsli === null) {
            continue;
          }

          await this.upsertNilaiIndikator(tx, {
            id_grid: grid.id_grid,
            id_indikator: indicator.id_indikator,
            nilai_asli: nilaiAsli,
          });

          touchedIndicatorIds.add(indicator.id_indikator);
          totalNilaiIndikator += 1;
        }
      }

      const statistik = [];

      for (const idIndikator of touchedIndicatorIds) {
        const stats = await this.updateStatistikIndikator(tx, idIndikator);

        statistik.push({
          id_indikator: idIndikator,
          ...stats,
        });
      }

      return {
        total_feature: geojson.features.length,
        total_grid_diproses: totalGrid,
        total_nilai_indikator_diproses: totalNilaiIndikator,
        total_indikator_terdampak: touchedIndicatorIds.size,
        indikator_terdampak: Array.from(touchedIndicatorIds),
        statistik,
      };
    });

    return result;
  }

  static async importIndikator({ id_indikator, file, replace = false }) {
    if (!file) {
      throw new BadRequestError("File GeoJSON wajib diunggah.");
    }

    const parsedIdIndikator = this.parseId(id_indikator, "ID indikator");

    const geojson = GeojsonHelper.readGeojsonFile(file.path);

    const result = await prisma.$transaction(async (tx) => {
      const indikator = await tx.indikator.findUnique({
        where: {
          id_indikator: parsedIdIndikator,
        },
      });

      if (!indikator) {
        throw new NotFoundError("Indikator tidak ditemukan.");
      }

      if (!indikator.is_active) {
        throw new BadRequestError("Indikator tidak aktif.");
      }

      if (indikator.jenis_indikator === "constraint") {
        throw new BadRequestError(
          "Indikator constraint tidak diimport sebagai nilai_indikator fuzzy. Gunakan modul constraint.",
        );
      }

      if (replace) {
        await tx.nilaiIndikator.deleteMany({
          where: {
            id_indikator: parsedIdIndikator,
          },
        });
      }

      let totalDiproses = 0;
      let totalDilewati = 0;

      for (const feature of geojson.features) {
        const properties = GeojsonHelper.getProperties(feature);
        const kodeGrid = GeojsonHelper.getKodeGrid(properties);

        const grid = await tx.grid.findUnique({
          where: {
            kode_grid: kodeGrid,
          },
          select: {
            id_grid: true,
            kode_grid: true,
          },
        });

        if (!grid) {
          totalDilewati += 1;
          continue;
        }

        const rawValue =
          properties[indikator.kode_indikator] ??
          properties.nilai_asli ??
          properties.value ??
          properties.nilai;

        const nilaiAsli = GeojsonHelper.parseNumber(rawValue);

        if (nilaiAsli === null) {
          totalDilewati += 1;
          continue;
        }

        await this.upsertNilaiIndikator(tx, {
          id_grid: grid.id_grid,
          id_indikator: parsedIdIndikator,
          nilai_asli: nilaiAsli,
        });

        totalDiproses += 1;
      }

      const stats = await this.updateStatistikIndikator(tx, parsedIdIndikator);

      return {
        id_indikator: parsedIdIndikator,
        kode_indikator: indikator.kode_indikator,
        nama_indikator: indikator.nama_indikator,
        mode: replace ? "replace" : "upsert",
        total_feature: geojson.features.length,
        total_nilai_diproses: totalDiproses,
        total_dilewati: totalDilewati,
        statistik: stats,
      };
    });

    return result;
  }
}

module.exports = GeojsonService;
