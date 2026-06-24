import { initLocalDb, readLocalDb, writeLocalDb } from "../config/localDb.js";
import { env } from "../config/env.js";
import { SYSTEM_ROLES, ROLE_KEYS } from "../constants/roles.js";
import { PERMISSIONS, ALL_PERMISSION_KEYS } from "../constants/permissions.js";
import { SEEDED_CLASSES } from "../constants/classes.js";
import { createId } from "../utils/id.js";
import { logger } from "../utils/logger.js";

const now = () => new Date().toISOString();

const ensureArray = (db, key) => {
  if (!Array.isArray(db[key])) {
    db[key] = [];
  }
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
    createdAt: now(),
    updatedAt: now(),
  };
};

const seedTenant = (db) => {
  let tenant = db.tenants.find((item) => item.code === env.seedTenantCode);

  if (!tenant) {
    tenant = {
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
      createdAt: now(),
      updatedAt: now(),
    };

    db.tenants.push(tenant);
    logger.info(`Tenant created: ${tenant.name}`);
  } else {
    logger.info(`Tenant already exists: ${tenant.name}`);
  }

  return tenant;
};

const seedBranch = (db, tenant) => {
  let branch = db.branches.find(
    (item) => item.tenantId === tenant._id && item.code === env.seedBranchCode,
  );

  if (!branch) {
    branch = {
      _id: createId("branch"),
      tenantId: tenant._id,
      name: env.seedBranchName,
      code: env.seedBranchCode,
      address: "",
      city: "",
      state: "Madhya Pradesh",
      pinCode: "",
      status: "active",
      createdAt: now(),
      updatedAt: now(),
    };

    db.branches.push(branch);
    logger.info(`Branch created: ${branch.name}`);
  } else {
    logger.info(`Branch already exists: ${branch.name}`);
  }

  return branch;
};

const seedPermissions = (db) => {
  ensureArray(db, "permissions");

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

  logger.info(`Permissions ready. New created: ${createdCount}`);
};

const seedRoles = (db, tenant) => {
  ensureArray(db, "roles");

  let createdCount = 0;

  for (const role of SYSTEM_ROLES) {
    const exists = db.roles.some(
      (item) => item.tenantId === tenant._id && item.key === role.key,
    );

    if (!exists) {
      db.roles.push({
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
        createdAt: now(),
        updatedAt: now(),
      });

      createdCount += 1;
    }
  }

  logger.info(`Roles ready. New created: ${createdCount}`);
};

const syncSuperAdminPermissions = (db, tenant) => {
  const role = db.roles.find(
    (item) =>
      item.tenantId === tenant._id && item.key === ROLE_KEYS.SUPER_ADMIN,
  );

  if (role) {
    role.permissions = [...ALL_PERMISSION_KEYS];
    role.updatedAt = now();
    logger.info("Super Admin permissions synced");
  }
};

const seedClasses = (db, tenant, branch) => {
  ensureArray(db, "classes");

  let createdCount = 0;

  for (const classItem of SEEDED_CLASSES) {
    const exists = db.classes.some(
      (item) =>
        item.tenantId === tenant._id &&
        item.branchId === branch._id &&
        item.code === classItem.code &&
        item.isDeleted === false,
    );

    if (!exists) {
      db.classes.push({
        _id: createId("class"),
        tenantId: tenant._id,
        branchId: branch._id,
        ...classItem,
        status: "active",
        isDeleted: false,
        createdBy: null,
        updatedBy: null,
        createdAt: now(),
        updatedAt: now(),
      });

      createdCount += 1;
    }
  }

  logger.info(`Classes ready. New created: ${createdCount}`);
};

const seedAcademicSession = (db, tenant, branch) => {
  ensureArray(db, "academic_sessions");

  const hasCurrentSession = db.academic_sessions.some(
    (item) =>
      item.tenantId === tenant._id &&
      item.branchId === branch._id &&
      item.isCurrent === true &&
      item.isDeleted === false,
  );

  if (hasCurrentSession) {
    logger.info("Current academic session already exists");
    return;
  }

  const session = createCurrentAcademicSession(tenant._id, branch._id);

  db.academic_sessions.push(session);

  logger.info(`Academic session created: ${session.name}`);
};

const seedFoundation = async () => {
  await initLocalDb(env.localDbFile);

  const db = await readLocalDb();

  ensureArray(db, "tenants");
  ensureArray(db, "branches");
  ensureArray(db, "users");
  ensureArray(db, "user_sessions");
  ensureArray(db, "activity_logs");
  ensureArray(db, "backup_history");

  const tenant = seedTenant(db);
  const branch = seedBranch(db, tenant);

  seedPermissions(db);
  seedRoles(db, tenant);
  syncSuperAdminPermissions(db, tenant);
  seedClasses(db, tenant, branch);
  seedAcademicSession(db, tenant, branch);

  await writeLocalDb(db);

  logger.info("Foundation seed completed successfully");
};

seedFoundation()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Foundation seed failed: ${error.message}`);
    process.exit(1);
  });
