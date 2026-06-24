import dotenv from "dotenv";

dotenv.config();

const dbMode = process.env.DB_MODE || "local";

const requiredEnvVariables = [
  "NODE_ENV",
  "PORT",
  "CLIENT_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_ACCESS_EXPIRES_IN",
  "JWT_REFRESH_EXPIRES_IN",
];

if (dbMode === "mongodb") {
  requiredEnvVariables.push("MONGODB_URI");
}

const missingVariables = requiredEnvVariables.filter((key) => !process.env[key]);

if (missingVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVariables.join(", ")}`
  );
}

if (!["local", "mongodb"].includes(dbMode)) {
  throw new Error("Invalid DB_MODE. Use either local or mongodb.");
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",

  port: Number(process.env.PORT || 5000),

  dbMode,
  localDbFile: process.env.LOCAL_DB_FILE || "./data/local-db.json",
  mongoUri: process.env.MONGODB_URI || "",

  clientUrl: process.env.CLIENT_URL,

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  cookieSecure: process.env.COOKIE_SECURE === "true",
  cookieSameSite: process.env.COOKIE_SAME_SITE || "lax",

  seedTenantName:
    process.env.SEED_TENANT_NAME || "THAKUR VIRENDRA SINGH MEMORIAL SCHOOL",
  seedTenantCode: process.env.SEED_TENANT_CODE || "TVSMS",
  seedBranchName: process.env.SEED_BRANCH_NAME || "Main Branch",
  seedBranchCode: process.env.SEED_BRANCH_CODE || "MAIN",

  superAdminFullName: process.env.SUPER_ADMIN_FULL_NAME || "Super Admin",
  superAdminUsername: process.env.SUPER_ADMIN_USERNAME || "superadmin",
  superAdminEmail:
    process.env.SUPER_ADMIN_EMAIL || "admin@tvsmemorialschool.local",
  superAdminMobile: process.env.SUPER_ADMIN_MOBILE || "9999999999",
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || "Admin@123",
});