const prisma = require("../prisma/prisma-client");
const {
  BadRequestError,
  NotFoundError,
} = require("../utils/error-handling-util");

class KriteriaService {
  static parseId(id, fieldName = "ID") {
    const parsedId = Number(id);

    if (!id || Number.isNaN(parsedId)) {
      throw new BadRequestError(`${fieldName} tidak valid.`);
    }

    return parsedId;
  }

  static formatKriteria(kriteria) {
    return {
      id: kriteria.id_kriteria,
      kode_kriteria: kriteria.kode_kriteria,
      nama_kriteria: kriteria.nama_kriteria,
      deskripsi: kriteria.deskripsi,
      urutan: kriteria.urutan,
      is_active: kriteria.is_active,
      created_at: kriteria.created_at,
      updated_at: kriteria.updated_at,
    };
  }

  static async createKriteria({ kode_kriteria, nama_kriteria, deskripsi, urutan }) {
    if (!nama_kriteria || nama_kriteria.trim() === "") {
      throw new BadRequestError("Nama kriteria wajib diisi.");
    }

    if (kode_kriteria) {
      const existingKode = await prisma.kriteria.findUnique({
        where: { kode_kriteria },
      });

      if (existingKode) {
        throw new BadRequestError("Kode kriteria sudah digunakan.");
      }
    }

    const created = await prisma.kriteria.create({
      data: {
        kode_kriteria,
        nama_kriteria,
        deskripsi,
        urutan,
        is_active: true,
      },
    });

    return this.formatKriteria(created);
  }

  static async getAllKriteria() {
    const data = await prisma.kriteria.findMany({
      orderBy: [
        { urutan: "asc" },
        { id_kriteria: "asc" },
      ],
    });

    return {
      total: data.length,
      data_kriteria: data.map((item) => this.formatKriteria(item)),
    };
  }

  static async getKriteriaById({ id }) {
    const id_kriteria = this.parseId(id, "ID kriteria");

    const kriteria = await prisma.kriteria.findUnique({
      where: { id_kriteria },
      include: {
        indikator: {
          orderBy: [
            { urutan: "asc" },
            { id_indikator: "asc" },
          ],
        },
      },
    });

    if (!kriteria) {
      throw new NotFoundError("Kriteria tidak ditemukan.");
    }

    return {
      ...this.formatKriteria(kriteria),
      indikator: kriteria.indikator.map((item) => ({
        id: item.id_indikator,
        kode_indikator: item.kode_indikator,
        nama_indikator: item.nama_indikator,
        satuan: item.satuan,
        jenis_indikator: item.jenis_indikator,
        urutan: item.urutan,
        is_active: item.is_active,
      })),
    };
  }

  static async updateKriteria({ id, payload }) {
    const id_kriteria = this.parseId(id, "ID kriteria");

    const existing = await prisma.kriteria.findUnique({
      where: { id_kriteria },
    });

    if (!existing) {
      throw new NotFoundError("Kriteria tidak ditemukan.");
    }

    const { kode_kriteria, nama_kriteria, deskripsi, urutan, is_active } = payload;

    if (nama_kriteria !== undefined && nama_kriteria.trim() === "") {
      throw new BadRequestError("Nama kriteria tidak boleh kosong.");
    }

    if (kode_kriteria && kode_kriteria !== existing.kode_kriteria) {
      const existingKode = await prisma.kriteria.findUnique({
        where: { kode_kriteria },
      });

      if (existingKode) {
        throw new BadRequestError("Kode kriteria sudah digunakan.");
      }
    }

    const updated = await prisma.kriteria.update({
      where: { id_kriteria },
      data: {
        kode_kriteria,
        nama_kriteria,
        deskripsi,
        urutan,
        is_active,
      },
    });

    return this.formatKriteria(updated);
  }

  static async deleteKriteria({ id }) {
    const id_kriteria = this.parseId(id, "ID kriteria");

    const existing = await prisma.kriteria.findUnique({
      where: { id_kriteria },
    });

    if (!existing) {
      throw new NotFoundError("Kriteria tidak ditemukan.");
    }

    const updated = await prisma.kriteria.update({
      where: { id_kriteria },
      data: {
        is_active: false,
      },
    });

    return this.formatKriteria(updated);
  }
}

module.exports = KriteriaService;