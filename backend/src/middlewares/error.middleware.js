import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

export const errorMiddleware = (error, req, res, next) => {
  let normalizedError = error;

  if (!(normalizedError instanceof ApiError)) {
    if (error.message && error.message.startsWith("CORS blocked")) {
      normalizedError = new ApiError(403, error.message);
    } else {
      normalizedError = new ApiError(
        error.statusCode || 500,
        error.message || "Internal server error"
      );
    }
  }

  const statusCode = normalizedError.statusCode || 500;

  logger.error(normalizedError.message, {
    statusCode,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    stack: env.isDevelopment ? normalizedError.stack : undefined,
  });

  return res.status(statusCode).json({
    success: false,
    message: normalizedError.message,
    errors: normalizedError.errors || [],
    ...(env.isDevelopment ? { stack: normalizedError.stack } : {}),
  });
};