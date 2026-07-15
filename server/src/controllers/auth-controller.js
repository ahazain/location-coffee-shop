const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma/prisma-client");
const envConfig = require("../configs/env-config");

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Email dan password wajib diisi.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Email atau password salah.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Email atau password salah.",
      });
    }

    const token = jwt.sign(
      { id_user: user.id_user, email: user.email, role: user.role, nama: user.nama },
      envConfig.jwtSecret,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Login berhasil.",
      data: {
        token,
        profile: {
          name: user.nama,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { nama, email, password } = req.body;

    if (!nama || !email || !password) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Nama, email, dan password wajib diisi.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Email sudah terdaftar.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        nama,
        email,
        password: hashedPassword,
        role: "admin",
      },
    });

    const token = jwt.sign(
      { id_user: newUser.id_user, email: newUser.email, role: newUser.role, nama: newUser.nama },
      envConfig.jwtSecret,
      { expiresIn: "1d" }
    );

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Registrasi berhasil.",
      data: {
        token,
        profile: {
          name: newUser.nama,
          email: newUser.email,
          role: newUser.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
