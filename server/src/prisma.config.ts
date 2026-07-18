// prisma.config.ts — Prisma v7 configuration
// Prisma v7: koneksi URL dipindahkan ke sini (bukan di schema.prisma)
import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // datasource.url diperlukan oleh prisma migrate
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  // adapter diperlukan oleh PrismaClient
  adapter() {
    const connectionString = process.env.DATABASE_URL!;
    return new PrismaPg(connectionString);
  },
});
