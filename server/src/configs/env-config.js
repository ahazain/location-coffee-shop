require("dotenv").config();

module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || "supersecretkey1234567890",
};
