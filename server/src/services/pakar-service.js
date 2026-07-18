const prisma = require("../prisma/prisma-client");
const { BadRequestError, NotFoundError } = require("../utils/error-handling-util");

class PakarService {
  static parseId(id, fieldName = "ID Pakar") {
    const parsedId = Number(id);
    if (id === null || id === undefined || Number.isNaN(parsedId)) {
      throw new BadRequestError(`${fieldName} tidak valid.`);
    }
    return parsedId;
  }

  static async getAllPakar() {
    return prisma.pakar.findMany({
      orderBy: { id_pakar: "asc" }
    });
  }

  static async getPakarById(id) {
    const parsedId = this.parseId(id);
    const pakar = await prisma.pakar.findUnique({
      where: { id_pakar: parsedId }
    });

    if (!pakar) {
      throw new NotFoundError("Pakar tidak ditemukan.");
    }

    return pakar;
  }

  static async createPakar(payload) {
    const { nama_pakar, institusi, jabatan, is_active } = payload;

    if (!nama_pakar || typeof nama_pakar !== "string" || !nama_pakar.trim()) {
      throw new BadRequestError("nama_pakar wajib diisi dan berupa string.");
    }

    return prisma.pakar.create({
      data: {
        nama_pakar: nama_pakar.trim(),
        institusi: institusi ? institusi.trim() : null,
        jabatan: jabatan ? jabatan.trim() : null,
        is_active: is_active !== undefined ? Boolean(is_active) : true
      }
    });
  }

  static async updatePakar(id, payload) {
    const parsedId = this.parseId(id);
    const { nama_pakar, institusi, jabatan, is_active } = payload;

    // Check existence
    await this.getPakarById(parsedId);

    const updateData = {};
    if (nama_pakar !== undefined) {
      if (typeof nama_pakar !== "string" || !nama_pakar.trim()) {
        throw new BadRequestError("nama_pakar harus berupa string non-kosong.");
      }
      updateData.nama_pakar = nama_pakar.trim();
    }
    if (institusi !== undefined) {
      updateData.institusi = institusi ? institusi.trim() : null;
    }
    if (jabatan !== undefined) {
      updateData.jabatan = jabatan ? jabatan.trim() : null;
    }
    if (is_active !== undefined) {
      updateData.is_active = Boolean(is_active);
    }

    return prisma.pakar.update({
      where: { id_pakar: parsedId },
      data: updateData
    });
  }

  static async deletePakar(id) {
    const parsedId = this.parseId(id);

    // Check existence
    await this.getPakarById(parsedId);

    await prisma.pakar.delete({
      where: { id_pakar: parsedId }
    });

    return {
      id_pakar: parsedId,
      deleted: true
    };
  }
}

module.exports = PakarService;
