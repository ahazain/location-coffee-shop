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
      kode_kriteria: String(kriteria.id_kriteria),
      nama_kriteria: kriteria.nama_kriteria,
      deskripsi: kriteria.deskripsi,
      created_at: kriteria.created_at,
      updated_at: kriteria.updated_at,
    };
  }

  static async createKriteria({ nama_kriteria, deskripsi }) {
    if (!nama_kriteria || nama_kriteria.trim() === "") {
      throw new BadRequestError("Nama kriteria wajib diisi.");
    }

    const created = await prisma.kriteria.create({
      data: {
        nama_kriteria,
        deskripsi,
      },
    });

    return this.formatKriteria(created);
  }

  static async getAllKriteria() {
    const data = await prisma.kriteria.findMany({
      orderBy: [
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
        kode_indikator: String(item.id_indikator),
        nama_indikator: item.nama_indikator,
        satuan: item.satuan,
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

    const { nama_kriteria, deskripsi } = payload;

    if (nama_kriteria !== undefined && nama_kriteria.trim() === "") {
      throw new BadRequestError("Nama kriteria tidak boleh kosong.");
    }

    const updated = await prisma.kriteria.update({
      where: { id_kriteria },
      data: {
        nama_kriteria,
        deskripsi,
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

    const deleted = await prisma.kriteria.delete({
      where: { id_kriteria },
    });

    return this.formatKriteria(deleted);
  }
}

module.exports = KriteriaService;