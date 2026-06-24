import dotenv from "dotenv";
import mongoose from "mongoose";

import { env } from "../config/env.js";
import { ROLE_KEYS } from "../constants/roles.js";
import { Branch, Role, Tenant, User } from "../models/nativeModels.js";
import { createId } from "../utils/id.js";
import { logger } from "../utils/logger.js";
import { hashPassword } from "../utils/password.js";

dotenv.config();

const now = () => new Date().toISOString();

const connect = async () => {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI missing in .env");
  }

  await mongoose.connect(env.mongoUri);
};

const run = async () => {
  await connect();

  const tenant = await Tenant.findOne({ code: env.seedTenantCode }).lean();

  if (!tenant) {
    throw new Error(
      "Tenant not found. Run npm run seed:native:foundation first.",
    );
  }

  const branch = await Branch.findOne({
    tenantId: tenant._id,
    code: env.seedBranchCode,
  }).lean();

  if (!branch) {
    throw new Error(
      "Branch not found. Run npm run seed:native:foundation first.",
    );
  }

  const superAdminRole = await Role.findOne({
    tenantId: tenant._id,
    key: ROLE_KEYS.SUPER_ADMIN,
  }).lean();

  if (!superAdminRole) {
    throw new Error(
      "Super Admin role not found. Run native foundation seed first.",
    );
  }

  const normalizedUsername = env.superAdminUsername.trim().toLowerCase();

  const existingUser = await User.findOne({
    tenantId: tenant._id,
    username: normalizedUsername,
    isDeleted: false,
  }).lean();

  if (existingUser) {
    logger.info(`Super Admin already exists: ${normalizedUsername}`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await hashPassword(env.superAdminPassword);

  await User.create({
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
  });

  logger.info("Native Super Admin created successfully");
  logger.info(`Username: ${normalizedUsername}`);
  logger.info("Password: value from SUPER_ADMIN_PASSWORD in .env");

  await mongoose.disconnect();
};

run().catch(async (error) => {
  logger.error(`Native Super Admin seed failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
