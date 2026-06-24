const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
