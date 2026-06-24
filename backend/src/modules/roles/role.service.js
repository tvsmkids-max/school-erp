import { env } from "../../config/env.js";
import { ROLE_KEYS } from "../../constants/roles.js";
import { ActivityLog, Role } from "../../models/nativeModels.js";
import { ApiError } from "../../utils/ApiError.js";
import { createId } from "../../utils/id.js";

const ensureMongoMode = () => {
  if (env.dbMode !== "mongodb") {
    throw new ApiError(500, "Native role service requires DB_MODE=mongodb.");
  }
};

const uniqueArray = (items = []) => {
  return [...new Set(items.filter(Boolean))];
};

const sanitizeRole = (role) => ({
  _id: role._id,
  tenantId: role.tenantId,
  name: role.name,
  key: role.key,
  description: role.description,
  permissions: role.permissions || [],
  isSystemRole: role.isSystemRole,
  sortOrder: role.sortOrder,
  status: role.status,
  createdBy: role.createdBy,
  updatedBy: role.updatedBy,
  createdAt: role.createdAt,
  updatedAt: role.updatedAt,
});

const addActivityLog = async ({ actor, action, message, entityId }) => {
  await ActivityLog.create({
    _id: createId("log"),
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    userId: actor._id,
    module: "Role Management",
    action,
    message,
    entityType: "Role",
    entityId,
    ipAddress: null,
    userAgent: null,
    createdAt: new Date().toISOString(),
  });
};

const findRoleById = async (actor, id) => {
  return Role.findOne({
    _id: id,
    tenantId: actor.tenantId,
  }).lean();
};

export const listRoles = async ({ actor }) => {
  ensureMongoMode();

  const roles = await Role.find({
    tenantId: actor.tenantId,
  })
    .sort({ sortOrder: 1 })
    .lean();

  return roles.map(sanitizeRole);
};

export const getRoleById = async ({ actor, id }) => {
  ensureMongoMode();

  const role = await findRoleById(actor, id);

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  return sanitizeRole(role);
};

export const updateRolePermissions = async ({ actor, id, permissions }) => {
  ensureMongoMode();

  const role = await findRoleById(actor, id);

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  if (role.key === ROLE_KEYS.SUPER_ADMIN) {
    throw new ApiError(
      400,
      "Super Admin permissions are protected and cannot be changed",
    );
  }

  const nextPermissions = uniqueArray(permissions).sort();

  await Role.updateOne(
    { _id: role._id },
    {
      $set: {
        permissions: nextPermissions,
        updatedBy: actor._id,
      },
    },
  );

  const updated = await Role.findById(role._id).lean();

  await addActivityLog({
    actor,
    action: "ROLE_PERMISSIONS_UPDATED",
    message: `Permissions updated for role: ${updated.name}`,
    entityId: updated._id,
  });

  return sanitizeRole(updated);
};
