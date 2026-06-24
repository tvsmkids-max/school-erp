import { env } from "../config/env.js";
import { initLocalDb, readLocalDb, writeLocalDb } from "../config/localDb.js";
import { ROLE_KEYS } from "../constants/roles.js";
import { createId } from "../utils/id.js";
import { hashPassword } from "../utils/password.js";
import { logger } from "../utils/logger.js";

const now = () => new Date().toISOString();

const seedSuperAdmin = async () => {
  await initLocalDb(env.localDbFile);

  const db = await readLocalDb();

  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.tenants)) db.tenants = [];
  if (!Array.isArray(db.branches)) db.branches = [];
  if (!Array.isArray(db.roles)) db.roles = [];

  const tenant = db.tenants.find((item) => item.code === env.seedTenantCode);

  if (!tenant) {
    throw new Error("Tenant not found. Run npm run seed:foundation first.");
  }

  const branch = db.branches.find(
    (item) => item.tenantId === tenant._id && item.code === env.seedBranchCode,
  );

  if (!branch) {
    throw new Error("Branch not found. Run npm run seed:foundation first.");
  }

  const superAdminRole = db.roles.find(
    (item) =>
      item.tenantId === tenant._id && item.key === ROLE_KEYS.SUPER_ADMIN,
  );

  if (!superAdminRole) {
    throw new Error(
      "Super Admin role not found. Run npm run seed:foundation first.",
    );
  }

  const normalizedUsername = env.superAdminUsername.trim().toLowerCase();

  const existingUser = db.users.find(
    (item) =>
      item.tenantId === tenant._id &&
      item.username === normalizedUsername &&
      item.isDeleted === false,
  );

  if (existingUser) {
    logger.info(`Super Admin already exists: ${normalizedUsername}`);
    return;
  }

  const passwordHash = await hashPassword(env.superAdminPassword);

  db.users.push({
    _id: createId("user"),
    tenantId: tenant._id,
    branchId: branch._id,
    fullName: env.superAdminFullName,
    username: normalizedUsername,
    email: env.superAdminEmail.trim().toLowerCase(),
    mobile: env.superAdminMobile,
    passwordHash,
    roleId: superAdminRole._id,
    roleKey: ROLE_KEYS.SUPER_ADMIN,
    assignedClasses: [],
    assignedSections: [],
    allowedPermissions: [],
    deniedPermissions: [],
    status: "active",
    passwordChangedAt: now(),
    lastLoginAt: null,
    lastLoginIp: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    isDeleted: false,
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now(),
  });

  await writeLocalDb(db);

  logger.info("Super Admin created successfully");
  logger.info(`Username: ${normalizedUsername}`);
  logger.info("Password: value from SUPER_ADMIN_PASSWORD in .env");
};

seedSuperAdmin()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Super Admin seed failed: ${error.message}`);
    process.exit(1);
  });
