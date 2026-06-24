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
      kode_indikator: indikator.kode_indikator,
      nama_indikator: indikator.nama_indikator,
      satuan: indikator.satuan,
      jenis_indikator: indikator.jenis_indikator,
      tipe_nilai: indikator.tipe_nilai,
      sumber_data: indikator.sumber_data,
      metode_pengolahan: indikator.metode_pengolahan,
      deskripsi: indikator.deskripsi,
      urutan: indikator.urutan,
      is_active: indikator.is_active,
      kriteria: indikator.kriteria
        ? {
            id: indikator.kriteria.id_kriteria,
            kode_kriteria: indikator.kriteria.kode_kriteria,
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

    if (!kriteria.is_active) {
      throw new BadRequestError("Kriteria tidak aktif.");
    }

    return parsedIdKriteria;
  }

  static async createIndikator(payload) {
    const {
      id_kriteria,
      kode_indikator,
      nama_indikator,
      satuan,
      jenis_indikator,
      tipe_nilai,
      sumber_data,
      metode_pengolahan,
      deskripsi,
      urutan,
    } = payload;

    if (!id_kriteria) {
      throw new BadRequestError("ID kriteria wajib diisi.");
    }

    if (!nama_indikator || nama_indikator.trim() === "") {
      throw new BadRequestError("Nama indikator wajib diisi.");
    }

    const parsedIdKriteria = await this.validateKriteria(id_kriteria);

    if (kode_indikator) {
      const existingKode = await prisma.indikator.findUnique({
        where: { kode_indikator },
      });

      if (existingKode) {
        throw new BadRequestError("Kode indikator sudah digunakan.");
      }
    }

    const created = await prisma.indikator.create({
      data: {
        id_kriteria: parsedIdKriteria,
        kode_indikator,
        nama_indikator,
        satuan,
        jenis_indikator,
        tipe_nilai,
        sumber_data,
        metode_pengolahan,
        deskripsi,
        urutan,
        is_active: true,
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
        { urutan: "asc" },
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
      orderBy: [{ urutan: "asc" }, { id_indikator: "asc" }],
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
      kode_indikator,
      nama_indikator,
      satuan,
      jenis_indikator,
      tipe_nilai,
      sumber_data,
      metode_pengolahan,
      deskripsi,
      urutan,
      is_active,
    } = payload;

    let parsedIdKriteria = undefined;

    if (id_kriteria !== undefined) {
      parsedIdKriteria = await this.validateKriteria(id_kriteria);
    }

    if (nama_indikator !== undefined && nama_indikator.trim() === "") {
      throw new BadRequestError("Nama indikator tidak boleh kosong.");
    }

    if (kode_indikator && kode_indikator !== existing.kode_indikator) {
      const existingKode = await prisma.indikator.findUnique({
        where: { kode_indikator },
      });

      if (existingKode) {
        throw new BadRequestError("Kode indikator sudah digunakan.");
      }
    }

    const updated = await prisma.indikator.update({
      where: { id_indikator },
      data: {
        id_kriteria: parsedIdKriteria,
        kode_indikator,
        nama_indikator,
        satuan,
        jenis_indikator,
        tipe_nilai,
        sumber_data,
        metode_pengolahan,
        deskripsi,
        urutan,
        is_active,
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

    const updated = await prisma.indikator.update({
      where: { id_indikator },
      data: {
        is_active: false,
      },
      include: {
        kriteria: true,
      },
    });

    return this.formatIndikator(updated);
  }
}

module.exports = IndikatorService;
