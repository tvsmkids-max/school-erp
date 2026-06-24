import dotenv from "dotenv";
import mongoose from "mongoose";

import { env } from "../config/env.js";
import { SYSTEM_ROLES, ROLE_KEYS } from "../constants/roles.js";
import { PERMISSIONS, ALL_PERMISSION_KEYS } from "../constants/permissions.js";
import { SEEDED_CLASSES } from "../constants/classes.js";
import {
  AcademicSession,
  Branch,
  ClassModel,
  Permission,
  Role,
  Tenant,
} from "../models/nativeModels.js";
import { createId } from "../utils/id.js";
import { logger } from "../utils/logger.js";

dotenv.config();

const now = () => new Date().toISOString();

const connect = async () => {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI missing in .env");
  }

  await mongoose.connect(env.mongoUri);
};

const createCurrentAcademicSession = (tenantId, branchId) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  let startYear;

  if (currentMonth >= 6) {
    startYear = currentYear;
  } else {
    startYear = currentYear - 1;
  }

  const endYear = startYear + 1;
  const shortEndYear = String(endYear).slice(-2);

  return {
    _id: createId("session"),
    tenantId,
    branchId,
    name: `${startYear}-${shortEndYear}`,
    startDate: `${startYear}-06-01`,
    endDate: `${endYear}-03-31`,
    isCurrent: true,
    status: "active",
    isDeleted: false,
    createdBy: null,
    updatedBy: null,
  };
};

const seedTenant = async () => {
  let tenant = await Tenant.findOne({ code: env.seedTenantCode }).lean();

  if (!tenant) {
    await Tenant.create({
      _id: createId("tenant"),
      name: env.seedTenantName,
      board: "MPBSE",
      code: env.seedTenantCode,
      status: "active",
      settings: {
        timezone: "Asia/Kolkata",
        academicSessionStartMonth: 6,
        academicSessionEndMonth: 3,
      },
    });

    tenant = await Tenant.findOne({ code: env.seedTenantCode }).lean();
    logger.info(`Tenant created: ${tenant.name}`);
  } else {
    logger.info(`Tenant already exists: ${tenant.name}`);
  }

  return tenant;
};

const seedBranch = async (tenant) => {
  let branch = await Branch.findOne({
    tenantId: tenant._id,
    code: env.seedBranchCode,
  }).lean();

  if (!branch) {
    await Branch.create({
      _id: createId("branch"),
      tenantId: tenant._id,
      name: env.seedBranchName,
      code: env.seedBranchCode,
      address: "",
      city: "",
      state: "Madhya Pradesh",
      pinCode: "",
      status: "active",
    });

    branch = await Branch.findOne({
      tenantId: tenant._id,
      code: env.seedBranchCode,
    }).lean();

    logger.info(`Branch created: ${branch.name}`);
  } else {
    logger.info(`Branch already exists: ${branch.name}`);
  }

  return branch;
};

const seedPermissions = async () => {
  let createdCount = 0;

  for (const permission of PERMISSIONS) {
    const exists = await Permission.findOne({
      permissionKey: permission.permissionKey,
    }).lean();

    if (!exists) {
      await Permission.create({
        _id: createId("permission"),
        ...permission,
        status: "active",
      });

      createdCount += 1;
    }
  }

  logger.info(`Permissions ready. New created: ${createdCount}`);
};

const seedRoles = async (tenant) => {
  let createdCount = 0;

  for (const role of SYSTEM_ROLES) {
    const exists = await Role.findOne({
      tenantId: tenant._id,
      key: role.key,
    }).lean();

    if (!exists) {
      await Role.create({
        _id: createId("role"),
        tenantId: tenant._id,
        name: role.name,
        key: role.key,
        description: role.description,
        permissions:
          role.key === ROLE_KEYS.SUPER_ADMIN ? [...ALL_PERMISSION_KEYS] : [],
        isSystemRole: true,
        sortOrder: role.sortOrder,
        status: "active",
        createdBy: null,
        updatedBy: null,
      });

      createdCount += 1;
    }
  }

  await Role.updateOne(
    {
      tenantId: tenant._id,
      key: ROLE_KEYS.SUPER_ADMIN,
    },
    {
      $set: {
        permissions: [...ALL_PERMISSION_KEYS],
      },
    },
  );

  logger.info(`Roles ready. New created: ${createdCount}`);
  logger.info("Super Admin permissions synced");
};

const seedClasses = async (tenant, branch) => {
  let createdCount = 0;

  for (const classItem of SEEDED_CLASSES) {
    const exists = await ClassModel.findOne({
      tenantId: tenant._id,
      branchId: branch._id,
      code: classItem.code,
      isDeleted: false,
    }).lean();

    if (!exists) {
      await ClassModel.create({
        _id: createId("class"),
        tenantId: tenant._id,
        branchId: branch._id,
        ...classItem,
        status: "active",
        isDeleted: false,
        createdBy: null,
        updatedBy: null,
      });

      createdCount += 1;
    }
  }

  logger.info(`Classes ready. New created: ${createdCount}`);
};

const seedAcademicSession = async (tenant, branch) => {
  const currentExists = await AcademicSession.findOne({
    tenantId: tenant._id,
    branchId: branch._id,
    isCurrent: true,
    isDeleted: false,
  }).lean();

  if (currentExists) {
    logger.info("Current academic session already exists");
    return;
  }

  const session = createCurrentAcademicSession(tenant._id, branch._id);

  await AcademicSession.create(session);

  logger.info(`Academic session created: ${session.name}`);
};

const run = async () => {
  await connect();

  const tenant = await seedTenant();
  const branch = await seedBranch(tenant);

  await seedPermissions();
  await seedRoles(tenant);
  await seedClasses(tenant, branch);
  await seedAcademicSession(tenant, branch);

  logger.info("Native foundation seed completed successfully");

  await mongoose.disconnect();
};

run().catch(async (error) => {
  logger.error(`Native foundation seed failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
