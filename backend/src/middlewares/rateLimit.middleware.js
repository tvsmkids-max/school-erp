import rateLimit from "express-rate-limit";
import { ApiResponse } from "../utils/ApiResponse.js";

const rateLimitHandler = (req, res) => {
  return res
    .status(429)
    .json(new ApiResponse(429, null, "Too many requests. Please try again later."));
};

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: rateLimitHandler,
});