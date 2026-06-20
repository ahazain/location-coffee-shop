require("dotenv").config();
const envConfig = require("./src/configs/env-config");
const express = require("express");
const app = express();
const port = envConfig.port;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.get("/", (req, res) => {
  res.send("the system works !!!");
});

app.listen(port, () => {
  console.log(`LOPE YOU ${port}`);
});

module.exports = app;
