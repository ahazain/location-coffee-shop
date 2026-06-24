const { BaseError } = require("../utils/error-handling-util");

class ResponseHelper {
  static success(res, data, message = "Success", statusCode = 200) {
    res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
    });
  }

  static created(res, data, message = "Created", statusCode = 201) {
    res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
    });
  }

  static error(res, error) {
    console.error(error);
    const statusCode = error instanceof BaseError ? error.statusCode : 500;
    const message = error.message || "Internal Server Error";
    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
    });
  }
}

module.exports = ResponseHelper;
