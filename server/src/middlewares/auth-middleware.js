const jwt = require("jsonwebtoken");
const envConfig = require("../configs/env-config");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Akses ditolak. Token tidak disediakan.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, envConfig.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: "Token tidak valid atau telah kedaluwarsa.",
    });
  }
};
