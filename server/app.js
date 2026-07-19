require("dotenv").config();
const envConfig = require("./src/configs/env-config");
const express = require("express");
const cors = require("cors");
const pakarRoute = require("./src/routes/pakar-route");
const ahpRoute = require("./src/routes/ahp-route");
const kriteriaRoute = require("./src/routes/kriteria-route");
const indikatorRoute = require("./src/routes/indikator-route");
const fuzzyRoute = require("./src/routes/fuzzy-route");
const geotiffRoute = require("./src/routes/geotiff-route");
const wlcRoute = require("./src/routes/wlc-route");
const validationRoute = require("./src/routes/validation-route");
const authRoute = require("./src/routes/auth-route");
const app = express();
const port = envConfig.port;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("the system works !!!");
});

app.use("/auth", authRoute);

app.use("/ahp/pakar", pakarRoute);
app.use("/ahp", ahpRoute);
app.use("/kriteria", kriteriaRoute);
app.use("/indikator", indikatorRoute);
app.use("/fuzzy", fuzzyRoute);
app.use("/geotiff", geotiffRoute);
app.use("/wlc", wlcRoute);
app.use("/wlc/validation", validationRoute);

// Error handling middleware should be the last middleware
app.use((err, req, res, next) => {
  console.error("Error details:", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// app.listen(port, () => {
//   console.log(`LOPE YOU ${port}`);
// });
app.listen(port, "0.0.0.0", () => {
  console.log(`LOPE YOU ${port}`);
});

module.exports = app; // trigger restart for regenerated prisma client
