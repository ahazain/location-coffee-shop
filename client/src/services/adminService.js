import { mapService } from "./mapService";
import { wlcService } from "./api/wlcService";

export const adminService = {
  async getMapPreview() {
    const grids = await mapService.getDefaultMap();
    const active = await wlcService.getActive();

    // Check if there is an active WLC
    if (!active) {
      return {
        map: null,
        previewStatus: {
          statusLabel: "Belum Dihitung",
          draftVersion: "-",
        },
        publishStatus: {
          statusLabel: "Belum Dipublikasikan",
        },
        canPublish: false,
      };
    }

    const currentVersion = active.versi;
    const publishedVersion = localStorage.getItem("wlc_map_published_version");
    const isPublished = publishedVersion === String(currentVersion);

    return {
      map: grids,
      previewStatus: {
        statusLabel: "Draft Siap",
        draftVersion: `Versi ${currentVersion}`,
      },
      publishStatus: {
        statusLabel: isPublished ? `Terpublikasi (Versi ${currentVersion})` : "Belum Dipublikasikan",
      },
      canPublish: !isPublished,
    };
  },

  async publishMap() {
    try {
      const active = await wlcService.getActive();
      if (!active) {
        throw new Error("Tidak ada data draft WLC untuk dipublikasikan.");
      }
      localStorage.setItem("wlc_map_published_version", String(active.versi));
      return { ok: true, message: "Peta berhasil dipublikasikan ke halaman publik." };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }
};
