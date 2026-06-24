import { env } from "../config/env.js";
import { initLocalDb, readLocalDb, writeLocalDb } from "../config/localDb.js";
import { PERMISSIONS, ALL_PERMISSION_KEYS } from "../constants/permissions.js";
import { ROLE_KEYS } from "../constants/roles.js";
import { getFlatStudentFields } from "../constants/studentFields.js";
import { createId } from "../utils/id.js";
import { logger } from "../utils/logger.js";

const now = () => new Date().toISOString();

const ensureArray = (db, key) => {
  if (!Array.isArray(db[key])) {
    db[key] = [];
  }
};

const seedStudentPermissions = (db) => {
  let createdCount = 0;

  for (const permission of PERMISSIONS) {
    const exists = db.permissions.some(
      (item) => item.permissionKey === permission.permissionKey,
    );

    if (!exists) {
      db.permissions.push({
        _id: createId("permission"),
        ...permission,
        status: "active",
        createdAt: now(),
        updatedAt: now(),
      });

      createdCount += 1;
    }
  }

  return createdCount;
};

const updateSuperAdminRolePermissions = (db, tenantId) => {
  const role = db.roles.find(
    (item) => item.tenantId === tenantId && item.key === ROLE_KEYS.SUPER_ADMIN,
  );

  if (!role) {
    return false;
  }

  role.permissions = [...ALL_PERMISSION_KEYS];
  role.updatedAt = now();

  return true;
};

const seedStudentFieldConfig = (db, tenant, branch) => {
  let createdCount = 0;
  const fields = getFlatStudentFields();

  for (const field of fields) {
    const exists = db.student_field_configs.some(
      (item) =>
        item.tenantId === tenant._id &&
        item.branchId === branch._id &&
        item.fieldKey === field.fieldKey,
    );

    if (!exists) {
      db.student_field_configs.push({
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
        createdAt: now(),
        updatedAt: now(),
      });

      createdCount += 1;
    }
  }

  return createdCount;
};

const seedStudentFoundation = async () => {
  await initLocalDb(env.localDbFile);

  const db = await readLocalDb();

  ensureArray(db, "students");
  ensureArray(db, "student_field_configs");
  ensureArray(db, "student_promotion_logs");
  ensureArray(db, "student_import_batches");
  ensureArray(db, "attendance_records");
  ensureArray(db, "permissions");
  ensureArray(db, "roles");
  ensureArray(db, "activity_logs");
  ensureArray(db, "backup_history");

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

  const permissionCount = seedStudentPermissions(db);
  const roleUpdated = updateSuperAdminRolePermissions(db, tenant._id);
  const fieldConfigCount = seedStudentFieldConfig(db, tenant, branch);

  await writeLocalDb(db);

  logger.info(`Student permissions ready. New created: ${permissionCount}`);
  logger.info(
    `Super Admin role permission sync: ${roleUpdated ? "updated" : "not found"}`,
  );
  logger.info(`Student field config ready. New created: ${fieldConfigCount}`);
  logger.info("Student foundation seed completed successfully");
};

seedStudentFoundation()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Student foundation seed failed: ${error.message}`);
    process.exit(1);
  });
