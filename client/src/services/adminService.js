import { datasetSummary } from "../data/datasets";
import { fuzzyConfigByIndicator } from "../data/fuzzyConfig";
import { indicators } from "../data/indicators";
import {
  adminPipelineSteps,
  datasetValidationChecklist,
  initialProcessingLogs,
  uploadLayerOptions,
} from "../data/adminWorkflow";
import { calculateWlcBreakdown } from "../utils/wlc";
import { mapService } from "./mapService";
import { weightService } from "./weightService";

const STORAGE_KEY = "coffee_shop_admin_mock_backend_v4";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function makeId(prefix) {
  const randomPart = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8).toUpperCase()
    : Math.random().toString(36).slice(2, 10).toUpperCase();

  return `${prefix}-${randomPart}`;
}

function nowLabel() {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function getSourceLayerForIndicator(indicatorCode) {
  return uploadLayerOptions.find((layer) => layer.affectedIndicators.includes(indicatorCode));
}

function createInitialLayerRegistry() {
  return Object.fromEntries(
    uploadLayerOptions.map((layer, index) => [
      layer.id,
      {
        id: layer.id,
        name: layer.label,
        category: layer.category,
        uploadMode: layer.uploadMode,
        backendAction: layer.backendAction,
        allowedGeometry: layer.allowedGeometry,
        acceptedFormats: layer.acceptedFormats,
        version: `L-${String(index + 1).padStart(3, "0")}-v1`,
        records: layer.id === "coffee-existing" ? 57 : 0,
        status: "Tervalidasi",
        lastUpdated: "Data awal dummy",
        lastFileName: "dataset_awal.geojson",
      },
    ]),
  );
}

function buildPreviewRows(indicatorCode) {
  const seed = indicatorCode.length;

  return [0, 1, 2, 3].map((item) => {
    const rawValue = Number(((seed + item * 2.35) % 9.5 + 0.5).toFixed(2));
    const fuzzyValue = Number(Math.min(1, Math.max(0, rawValue / 10)).toFixed(2));

    return {
      gridCode: `GRID-${String(item + 1).padStart(3, "0")}`,
      rawValue,
      fuzzyValue,
    };
  });
}

function createInitialIndicatorRegistry() {
  return Object.fromEntries(
    indicators.map((indicator) => {
      const sourceLayer = getSourceLayerForIndicator(indicator.code);

      return [
        indicator.code,
        {
          code: indicator.code,
          sourceLayerId: sourceLayer?.id || "unknown",
          sourceLayerName: sourceLayer?.label || "Layer sumber belum dipetakan",
          status: "up_to_date",
          statusLabel: "Sudah terbaru",
          version: "FZ-v1",
          lastFuzzyAt: "Data awal dummy",
          reason: "Nilai fuzzy awal tersedia dari data dummy.",
          rawMin: 0,
          rawMax: indicator.fuzzyType === "decreasing" ? 800 : 10,
          optimum: indicator.fuzzyType === "optimum" ? 5 : null,
          fuzzyMin: 0,
          fuzzyMax: 1,
          averageFuzzy: Number((0.45 + indicator.code.length / 100).toFixed(2)),
          previewRows: buildPreviewRows(indicator.code),
        },
      ];
    }),
  );
}

function createInitialState() {
  return {
    layers: createInitialLayerRegistry(),
    indicatorRegistry: createInitialIndicatorRegistry(),
    uploads: [],
    logs: initialProcessingLogs,
    ahpRespondents: [],
    wlc: {
      status: "up_to_date",
      statusLabel: "WLC awal tersedia",
      lastRun: "Data awal dummy",
      sourceDataset: "Dataset awal dummy",
      sourceFuzzy: "Semua indikator awal sudah fuzzy",
      sourceAhp: "AHP default awal",
      draftVersion: "WLC-v1",
      needsRunReason: "Tidak ada perubahan sejak data awal.",
    },
    publish: {
      status: "published",
      statusLabel: "Peta default awal aktif",
      publishedVersion: "PUBLISH-v1",
      lastPublished: "Data awal dummy",
    },
  };
}

function readState() {
  if (!canUseStorage()) return createInitialState();

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    const state = createInitialState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }

  try {
    return { ...createInitialState(), ...JSON.parse(raw) };
  } catch {
    const state = createInitialState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }
}

function writeState(state) {
  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  return state;
}

function addLog(state, title, detail, status) {
  state.logs = [
    {
      id: makeId("LOG"),
      title,
      detail,
      status,
      time: nowLabel(),
    },
    ...(state.logs || []),
  ].slice(0, 8);
}

function fileHasGeoJsonExtension(fileName = "") {
  return fileName.toLowerCase().endsWith(".geojson") || fileName.toLowerCase().endsWith(".json");
}

function summarizeGeometryTypes(features = []) {
  return [...new Set(features.map((feature) => feature?.geometry?.type).filter(Boolean))];
}

function allIndicatorsUpToDate(state) {
  return Object.values(state.indicatorRegistry).every((item) => item.status !== "needs_fuzzy");
}

function getStatusVariant(status) {
  if (["needs_fuzzy", "blocked_fuzzy", "needs_run"].includes(status)) return "amber";
  if (["failed", "invalid"].includes(status)) return "red";
  if (["up_to_date", "ready_preview", "published"].includes(status)) return "green";
  return "stone";
}

function buildDatasetRows(state) {
  return Object.values(state.layers).map((layer) => ({
    id: layer.id,
    name: layer.name,
    type: layer.allowedGeometry,
    records: layer.records,
    freshness: layer.lastUpdated,
    status: layer.status,
    version: layer.version,
    lastFileName: layer.lastFileName,
  }));
}

function buildUploadHistory(state) {
  return state.uploads.map((upload) => ({
    id: upload.id,
    fileName: upload.fileName,
    uploadedBy: "Admin",
    uploadedAt: upload.uploadedAt,
    status: upload.statusLabel,
    affectedIndicators: upload.affectedIndicators,
  }));
}

function buildProcessingSummary(state) {
  const pendingFuzzy = Object.values(state.indicatorRegistry).filter((item) => item.status === "needs_fuzzy");
  const readyFuzzy = Object.values(state.indicatorRegistry).filter((item) => item.status === "up_to_date");

  return {
    pendingFuzzyCount: pendingFuzzy.length,
    readyFuzzyCount: readyFuzzy.length,
    latestUpload: state.uploads[0] || null,
    wlcStatus: state.wlc.status,
    wlcStatusLabel: state.wlc.statusLabel,
    publishStatusLabel: state.publish.statusLabel,
    canRunWlc: pendingFuzzy.length === 0,
  };
}

async function parseGeoJsonFile(file) {
  if (!file) {
    throw new Error("Pilih file GeoJSON terlebih dahulu.");
  }

  if (!fileHasGeoJsonExtension(file.name)) {
    throw new Error("Format file tidak diterima. Gunakan .geojson atau .json yang berisi GeoJSON.");
  }

  const text = await file.text();
  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("File tidak dapat dibaca sebagai JSON. Pastikan file berisi GeoJSON valid.");
  }

  if (parsed.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
    throw new Error("GeoJSON harus bertipe FeatureCollection dan memiliki array features.");
  }

  if (parsed.features.length === 0) {
    throw new Error("GeoJSON tidak memiliki fitur spasial.");
  }

  const invalidGeometry = parsed.features.some((feature) => !feature?.geometry?.type);
  if (invalidGeometry) {
    throw new Error("Ada fitur yang tidak memiliki geometry valid.");
  }

  return parsed;
}

export const adminService = {
  async login({ username, password }) {
    const isFilled = Boolean(username?.trim()) && Boolean(password?.trim());

    if (!isFilled) {
      return {
        ok: false,
        message: "Username dan password wajib diisi.",
      };
    }

    return {
      ok: true,
      token: "dummy-admin-token",
      profile: {
        name: "Admin Sistem Lokasi Coffee Shop",
        role: "Administrator",
      },
    };
  },

  async getDashboardSummary() {
    const state = readState();
    const map = await mapService.getDefaultMap();
    const ahp = await weightService.getAhpProcess();
    const processingSummary = buildProcessingSummary(state);

    return {
      datasetSummary,
      mapSummary: map.summary,
      indicatorCount: indicators.length,
      layerCount: Object.keys(state.layers).length,
      respondentCount: ahp.respondentProfiles.length + state.ahpRespondents.length,
      publishedMapStatus: state.publish.statusLabel,
      ahpStatus: ahp.combinedCriteriaResult.isConsistent ? "AHP default konsisten" : "AHP perlu review",
      pendingDatasetJobs: state.uploads.filter((item) => item.status === "uploaded").length,
      pendingFuzzyJobs: processingSummary.pendingFuzzyCount,
      canRunWlc: processingSummary.canRunWlc,
      pipelineSteps: adminPipelineSteps,
      processingLogs: state.logs,
      processingSummary,
    };
  },

  async getIndicators() {
    return indicators;
  },

  async getDatasets() {
    const state = readState();

    return {
      datasetSummary,
      datasetLayers: buildDatasetRows(state),
      uploadHistory: buildUploadHistory(state),
      uploadLayerOptions,
      datasetValidationChecklist,
      processingLogs: state.logs,
      processingSummary: buildProcessingSummary(state),
    };
  },

  async uploadDataset({ layerId, file, notes }) {
    const layerOption = uploadLayerOptions.find((layer) => layer.id === layerId);

    if (!layerOption) {
      return { ok: false, message: "Jenis layer tidak ditemukan." };
    }

    try {
      const geojson = await parseGeoJsonFile(file);
      const geometryTypes = summarizeGeometryTypes(geojson.features);
      const state = readState();
      const currentLayer = state.layers[layerId];
      const featureCount = geojson.features.length;
      const nextVersion = `${layerId.toUpperCase()}-${new Date().getTime()}`;
      const statusLabel = layerOption.backendAction === "append" ? "Data ditambahkan" : "Versi layer diganti";

      state.layers[layerId] = {
        ...currentLayer,
        version: nextVersion,
        records: layerOption.backendAction === "append" ? Number(currentLayer?.records || 0) + featureCount : featureCount,
        status: "Tervalidasi — perlu fuzzy indikator terdampak",
        lastUpdated: nowLabel(),
        lastFileName: file.name,
        geometryTypes,
      };

      layerOption.affectedIndicators
        .filter((indicatorCode) => indicatorCode !== "constraint_mask")
        .forEach((indicatorCode) => {
          const current = state.indicatorRegistry[indicatorCode];
          state.indicatorRegistry[indicatorCode] = {
            ...current,
            status: "needs_fuzzy",
            statusLabel: "Perlu fuzzy ulang",
            reason: `Layer ${layerOption.label} diperbarui melalui ${file.name}.`,
            sourceLayerId: layerOption.id,
            sourceLayerName: layerOption.label,
          };
        });

      state.wlc = {
        ...state.wlc,
        status: "blocked_fuzzy",
        statusLabel: "Menunggu fuzzy indikator terdampak",
        needsRunReason: `Dataset ${layerOption.label} berubah. Fuzzy indikator terdampak harus diperbarui dulu.`,
        sourceDataset: `${layerOption.label} — ${file.name}`,
      };

      state.publish = {
        ...state.publish,
        status: "stale",
        statusLabel: "Peta publik belum memakai update terbaru",
      };

      const uploadRecord = {
        id: makeId("UPL"),
        layerId,
        layerName: layerOption.label,
        fileName: file.name,
        size: file.size,
        featureCount,
        geometryTypes,
        notes,
        uploadedAt: nowLabel(),
        status: "uploaded",
        statusLabel,
        affectedIndicators: layerOption.affectedIndicators,
      };

      state.uploads = [uploadRecord, ...state.uploads].slice(0, 12);
      addLog(
        state,
        `Upload ${layerOption.label}`,
        `${featureCount} fitur GeoJSON diproses. Indikator terdampak: ${layerOption.affectedIndicators.join(", ")}.`,
        "Perlu fuzzy ulang",
      );

      writeState(state);

      return {
        ok: true,
        message: `${file.name} berhasil diproses. Lanjutkan fuzzy indikator terdampak.`,
        upload: uploadRecord,
      };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  },

  async getFuzzyProcess() {
    const state = readState();
    const rows = indicators.map((indicator) => {
      const registry = state.indicatorRegistry[indicator.code];

      return {
        ...indicator,
        ...registry,
        fuzzyConfig: fuzzyConfigByIndicator[indicator.code],
        outputScale: "0 - 1",
        statusVariant: getStatusVariant(registry?.status),
      };
    });

    return {
      rows,
      pendingRows: rows.filter((row) => row.status === "needs_fuzzy"),
      processingSummary: buildProcessingSummary(state),
      processingLogs: state.logs,
    };
  },

  async runFuzzyIndicator(indicatorCode) {
    const state = readState();
    const indicator = indicators.find((item) => item.code === indicatorCode);
    const registry = state.indicatorRegistry[indicatorCode];

    if (!indicator || !registry) {
      return { ok: false, message: "Indikator tidak ditemukan." };
    }

    const versionNumber = Number(String(registry.version || "FZ-v1").split("v").pop()) || 1;
    const updatedRegistry = {
      ...registry,
      status: "up_to_date",
      statusLabel: "Sudah terbaru",
      version: `FZ-v${versionNumber + 1}`,
      lastFuzzyAt: nowLabel(),
      reason: `Fuzzy ${indicator.name} sudah diperbarui dari layer ${registry.sourceLayerName}.`,
      rawMin: 0,
      rawMax: indicator.fuzzyType === "decreasing" ? 800 : 12,
      optimum: indicator.fuzzyType === "optimum" ? 5 : null,
      fuzzyMin: 0,
      fuzzyMax: 1,
      averageFuzzy: Number((0.5 + Math.random() * 0.25).toFixed(2)),
      previewRows: buildPreviewRows(indicatorCode).map((row) => ({
        ...row,
        fuzzyValue: Number(Math.min(1, Math.max(0, row.fuzzyValue + Math.random() * 0.18)).toFixed(2)),
      })),
    };

    state.indicatorRegistry[indicatorCode] = updatedRegistry;

    if (allIndicatorsUpToDate(state)) {
      state.wlc = {
        ...state.wlc,
        status: "needs_run",
        statusLabel: "Siap dihitung ulang",
        sourceFuzzy: "Semua indikator terdampak sudah fuzzy terbaru",
        needsRunReason: "Nilai fuzzy berubah, WLC perlu dihitung ulang agar peta memakai nilai terbaru.",
      };
    }

    addLog(state, `Fuzzy ${indicator.name}`, "Nilai indikator dinormalisasi ke skala 0 sampai 1 dan siap digunakan sebagai Xi pada WLC.", "Fuzzy selesai");
    writeState(state);

    return {
      ok: true,
      message: `${indicator.name} selesai difuzzy.`,
      indicator: updatedRegistry,
    };
  },

  async runAllPendingFuzzy() {
    const state = readState();
    const pendingCodes = Object.values(state.indicatorRegistry)
      .filter((item) => item.status === "needs_fuzzy")
      .map((item) => item.code);

    for (const indicatorCode of pendingCodes) {
      await this.runFuzzyIndicator(indicatorCode);
    }

    return {
      ok: true,
      message: pendingCodes.length ? `${pendingCodes.length} indikator selesai difuzzy.` : "Tidak ada indikator yang perlu fuzzy ulang.",
    };
  },

  async getAhpProcess() {
    const state = readState();
    const ahp = await weightService.getAhpProcess();

    return {
      ...ahp,
      respondentProfiles: [
        ...ahp.respondentProfiles,
        ...state.ahpRespondents.map((item) => item.profile),
      ],
      adminAddedRespondents: state.ahpRespondents,
      ahpVersionNote: state.ahpRespondents.length
        ? `${state.ahpRespondents.length} responden tambahan tersimpan di mock backend. WLC perlu dihitung ulang setelah bobot default diperbarui.`
        : "Belum ada responden tambahan dari admin.",
    };
  },

  async saveAhpRespondent(payload) {
    const state = readState();
    const respondent = {
      id: makeId("AHP-R"),
      savedAt: nowLabel(),
      profile: {
        id: makeId("RESP"),
        coffeeShop: payload.profile.coffeeShop || "Coffee shop baru",
        role: payload.profile.role || "Responden",
        experience: payload.profile.experience || "-",
        note: payload.profile.name
          ? `Diinput admin dari kuesioner ${payload.profile.name}.`
          : "Diinput admin dari kuesioner responden baru.",
      },
      criteriaCr: payload.criteriaResult?.cr,
      isConsistent: payload.isConsistent,
      criteriaWeights: payload.criteriaResult?.weightsPercent,
      globalIndicatorWeights: payload.globalIndicatorWeights,
    };

    state.ahpRespondents = [respondent, ...state.ahpRespondents];
    state.wlc = {
      ...state.wlc,
      status: "needs_run",
      statusLabel: "Bobot AHP berubah — WLC perlu ulang",
      needsRunReason: "Responden AHP baru disimpan. Bobot default perlu diterapkan ulang ke WLC.",
      sourceAhp: "AHP default + responden tambahan admin",
    };
    state.publish = {
      ...state.publish,
      status: "stale",
      statusLabel: "Peta publik belum memakai bobot AHP terbaru",
    };

    addLog(state, "Responden AHP baru disimpan", `CR kriteria responden: ${respondent.criteriaCr}. WLC perlu dihitung ulang.`, "AHP tersimpan");
    writeState(state);

    return {
      ok: true,
      message: "Responden AHP tersimpan di mock backend. Lanjutkan hitung WLC ulang.",
      respondent,
    };
  },

  async getWlcProcess() {
    const state = readState();
    const weights = await weightService.getDefaultWeights();
    const map = await mapService.getDefaultMap();
    const topGrid = map.summary.topGrid;
    const pendingFuzzy = Object.values(state.indicatorRegistry).filter((item) => item.status === "needs_fuzzy");

    return {
      weights,
      map,
      topGrid,
      breakdown: calculateWlcBreakdown(topGrid.indicatorScores, weights.globalIndicatorWeights),
      runStatus: {
        ...state.wlc,
        pendingFuzzy,
        canRun: pendingFuzzy.length === 0,
        statusVariant: getStatusVariant(state.wlc.status),
      },
      processingLogs: state.logs,
    };
  },

  async runWlc() {
    const state = readState();
    const pendingFuzzy = Object.values(state.indicatorRegistry).filter((item) => item.status === "needs_fuzzy");

    if (pendingFuzzy.length) {
      return {
        ok: false,
        message: `WLC belum bisa dijalankan. Masih ada ${pendingFuzzy.length} indikator yang perlu fuzzy ulang.`,
        pendingFuzzy,
      };
    }

    state.wlc = {
      ...state.wlc,
      status: "ready_preview",
      statusLabel: "WLC selesai — siap preview",
      lastRun: nowLabel(),
      draftVersion: makeId("WLC"),
      sourceDataset: state.uploads[0]?.fileName ? `Update terakhir: ${state.uploads[0].fileName}` : "Dataset awal dummy",
      sourceFuzzy: "Semua indikator fuzzy terbaru",
      sourceAhp: state.ahpRespondents.length ? "AHP default dengan responden tambahan" : "AHP default awal",
      needsRunReason: "Hasil WLC terbaru sudah tersedia sebagai draft.",
    };

    addLog(state, "WLC dihitung ulang", "Skor, kelas kesesuaian, ranking, dan peta draft diperbarui.", "Siap preview");
    writeState(state);

    return { ok: true, message: "WLC berhasil dihitung ulang. Silakan cek preview peta.", wlc: state.wlc };
  },

  async getMapPreview() {
    const state = readState();
    const map = await mapService.getDefaultMap();

    return {
      map,
      previewStatus: state.wlc,
      publishStatus: state.publish,
      canPublish: state.wlc.status === "ready_preview" || state.wlc.status === "up_to_date" || state.wlc.status === "published",
    };
  },

  async publishMap() {
    const state = readState();

    if (!["ready_preview", "up_to_date", "published"].includes(state.wlc.status)) {
      return {
        ok: false,
        message: "Peta belum bisa dipublish. Jalankan WLC ulang terlebih dahulu.",
      };
    }

    state.publish = {
      status: "published",
      statusLabel: "Peta default terbaru sudah dipublish",
      publishedVersion: makeId("PUBLISH"),
      lastPublished: nowLabel(),
    };
    state.wlc = {
      ...state.wlc,
      status: "published",
      statusLabel: "WLC terbaru sudah dipublish",
    };

    addLog(state, "Peta dipublish", "Draft WLC terbaru dijadikan peta default untuk pelaku usaha.", "Published");
    writeState(state);

    return { ok: true, message: "Peta berhasil dipublish sebagai peta default pelaku usaha." };
  },

  async resetMockBackend() {
    const state = createInitialState();
    writeState(state);
    return state;
  },
};
