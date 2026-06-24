import dotenv from "dotenv";
import mongoose from "mongoose";

import { env } from "../config/env.js";
import { ALL_PERMISSION_KEYS, PERMISSIONS } from "../constants/permissions.js";
import { ROLE_KEYS } from "../constants/roles.js";
import { getFlatStudentFields } from "../constants/studentFields.js";
import {
  Branch,
  Permission,
  Role,
  StudentFieldConfig,
  Tenant,
} from "../models/nativeModels.js";
import { createId } from "../utils/id.js";
import { logger } from "../utils/logger.js";

dotenv.config();

const connect = async () => {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI missing in .env");
  }

  await mongoose.connect(env.mongoUri);
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

  return createdCount;
};

const syncSuperAdminPermissions = async (tenantId) => {
  const result = await Role.updateOne(
    {
      tenantId,
      key: ROLE_KEYS.SUPER_ADMIN,
    },
    {
      $set: {
        permissions: [...ALL_PERMISSION_KEYS],
      },
    },
  );

  return result.matchedCount > 0;
};

const seedStudentFieldConfig = async (tenant, branch) => {
  let createdCount = 0;
  const fields = getFlatStudentFields();

  for (const field of fields) {
    const exists = await StudentFieldConfig.findOne({
      tenantId: tenant._id,
      branchId: branch._id,
      fieldKey: field.fieldKey,
    }).lean();

    if (!exists) {
      await StudentFieldConfig.create({
        _id: createId("studentField"),
        tenantId: tenant._id,
        branchId: branch._id,
        groupKey: field.groupKey,
        groupLabel: field.groupLabel,
        fieldKey: field.fieldKey,
        label: field.label,
        isVisible: field.defaultVisible,
        isMandatory: field.defaultMandatory,
        isReadOnly: field.defaultReadOnly,
        sortOrder: field.sortOrder,
        status: "active",
        createdBy: null,
        updatedBy: null,
      });

      createdCount += 1;
    }
  }

  return createdCount;
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

  const permissionCount = await seedPermissions();
  const roleUpdated = await syncSuperAdminPermissions(tenant._id);
  const fieldConfigCount = await seedStudentFieldConfig(tenant, branch);

  logger.info(
    `Native student permissions ready. New created: ${permissionCount}`,
  );
  logger.info(
    `Native Super Admin role permission sync: ${roleUpdated ? "updated" : "not found"}`,
  );
  logger.info(
    `Native student field config ready. New created: ${fieldConfigCount}`,
  );
  logger.info("Native student foundation seed completed successfully");

  await mongoose.disconnect();
};

run().catch(async (error) => {
  logger.error(`Native student foundation seed failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
