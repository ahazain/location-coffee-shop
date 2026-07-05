const prisma = require("../prisma/prisma-client");
const {
  BadRequestError,
  NotFoundError,
} = require("../utils/error-handling-util");

class IndikatorService {
  static parseId(id, fieldName = "ID") {
    const parsedId = Number(id);

    if (!id || Number.isNaN(parsedId)) {
      throw new BadRequestError(`${fieldName} tidak valid.`);
    }

    return parsedId;
  }

  static formatIndikator(indikator) {
    return {
      id: indikator.id_indikator,
      id_kriteria: indikator.id_kriteria,
      kode_indikator: String(indikator.id_indikator),
      nama_indikator: indikator.nama_indikator,
      satuan: indikator.satuan,
      tipe_nilai: indikator.tipe_nilai,
      deskripsi: indikator.deskripsi,
      kriteria: indikator.kriteria
        ? {
            id: indikator.kriteria.id_kriteria,
            kode_kriteria: String(indikator.kriteria.id_kriteria),
            nama_kriteria: indikator.kriteria.nama_kriteria,
          }
        : undefined,
      created_at: indikator.created_at,
      updated_at: indikator.updated_at,
    };
  }

  static async validateKriteria(id_kriteria) {
    const parsedIdKriteria = this.parseId(id_kriteria, "ID kriteria");

    const kriteria = await prisma.kriteria.findUnique({
      where: { id_kriteria: parsedIdKriteria },
    });

    if (!kriteria) {
      throw new NotFoundError("Kriteria tidak ditemukan.");
    }

    return parsedIdKriteria;
  }

  static async createIndikator(payload) {
    const {
      id_kriteria,
      nama_indikator,
      satuan,
      tipe_nilai,
      deskripsi,
    } = payload;

    if (!id_kriteria) {
      throw new BadRequestError("ID kriteria wajib diisi.");
    }

    if (!nama_indikator || nama_indikator.trim() === "") {
      throw new BadRequestError("Nama indikator wajib diisi.");
    }

    const parsedIdKriteria = await this.validateKriteria(id_kriteria);

    const created = await prisma.indikator.create({
      data: {
        id_kriteria: parsedIdKriteria,
        nama_indikator,
        satuan,
        tipe_nilai,
        deskripsi,
      },
      include: {
        kriteria: true,
      },
    });

    return this.formatIndikator(created);
  }

  static async getAllIndikator() {
    const data = await prisma.indikator.findMany({
      include: {
        kriteria: true,
      },
      orderBy: [
        { id_kriteria: "asc" },
        { id_indikator: "asc" },
      ],
    });

    return {
      total: data.length,
      data_indikator: data.map((item) => this.formatIndikator(item)),
    };
  }

  static async getIndikatorById({ id }) {
    const id_indikator = this.parseId(id, "ID indikator");

    const indikator = await prisma.indikator.findUnique({
      where: { id_indikator },
      include: {
        kriteria: true,
      },
    });

    if (!indikator) {
      throw new NotFoundError("Indikator tidak ditemukan.");
    }

    return this.formatIndikator(indikator);
  }

  static async getIndikatorByKriteria({ id_kriteria }) {
    const parsedIdKriteria = await this.validateKriteria(id_kriteria);

    const data = await prisma.indikator.findMany({
      where: {
        id_kriteria: parsedIdKriteria,
      },
      include: {
        kriteria: true,
      },
      orderBy: [{ id_indikator: "asc" }],
    });

    return {
      id_kriteria: parsedIdKriteria,
      total: data.length,
      data_indikator: data.map((item) => this.formatIndikator(item)),
    };
  }

  static async updateIndikator({ id, payload }) {
    const id_indikator = this.parseId(id, "ID indikator");

    const existing = await prisma.indikator.findUnique({
      where: { id_indikator },
    });

    if (!existing) {
      throw new NotFoundError("Indikator tidak ditemukan.");
    }

    const {
      id_kriteria,
      nama_indikator,
      satuan,
      tipe_nilai,
      deskripsi,
    } = payload;

    let parsedIdKriteria = undefined;

    if (id_kriteria !== undefined) {
      parsedIdKriteria = await this.validateKriteria(id_kriteria);
    }

    if (nama_indikator !== undefined && nama_indikator.trim() === "") {
      throw new BadRequestError("Nama indikator tidak boleh kosong.");
    }

    const updated = await prisma.indikator.update({
      where: { id_indikator },
      data: {
        id_kriteria: parsedIdKriteria,
        nama_indikator,
        satuan,
        tipe_nilai,
        deskripsi,
      },
      include: {
        kriteria: true,
      },
    });

    return this.formatIndikator(updated);
  }

  static async deleteIndikator({ id }) {
    const id_indikator = this.parseId(id, "ID indikator");

    const existing = await prisma.indikator.findUnique({
      where: { id_indikator },
    });

    if (!existing) {
      throw new NotFoundError("Indikator tidak ditemukan.");
    }

    const deleted = await prisma.indikator.delete({
      where: { id_indikator },
      include: {
        kriteria: true,
      },
    });

    return this.formatIndikator(deleted);
  }
}

module.exports = IndikatorService;
