import { env } from "./env.js";

const normalizeOrigin = (origin) => {
  return String(origin || "")
    .trim()
    .replace(/\/$/, "");
};

const configuredClientUrl = normalizeOrigin(env.clientUrl);

const allowedOrigins = new Set(
  [
    configuredClientUrl,

    // Local development
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",

    // Production frontend
    "https://school-erp-sigma-black.vercel.app",
  ].filter(Boolean),
);

const isVercelPreviewUrl = (origin) => {
  const normalizedOrigin = normalizeOrigin(origin);

  return (
    normalizedOrigin.startsWith("https://") &&
    normalizedOrigin.endsWith(".vercel.app")
  );
};

export const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    if (isVercelPreviewUrl(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],

  exposedHeaders: ["Content-Disposition"],
};
