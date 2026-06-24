import { env } from "../../config/env.js";
import { ROLE_KEYS } from "../../constants/roles.js";
import {
  ActivityLog,
  ClassModel,
  Role,
  Section,
  User,
  UserSession,
} from "../../models/nativeModels.js";
import { ApiError } from "../../utils/ApiError.js";
import { createId } from "../../utils/id.js";
import { hashPassword } from "../../utils/password.js";
import { getEffectivePermissions } from "../../utils/permissions.js";

const now = () => new Date().toISOString();

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const uniqueArray = (items = []) => {
  return [...new Set(items.filter(Boolean))];
};

const ensureMongoMode = () => {
  if (env.dbMode !== "mongodb") {
    throw new ApiError(500, "Native user service requires DB_MODE=mongodb.");
  }
};

const sanitizeUser = (user, role = null) => ({
  _id: user._id,
  tenantId: user.tenantId,
  branchId: user.branchId,
  fullName: user.fullName,
  username: user.username,
  email: user.email,
  mobile: user.mobile,
  roleId: user.roleId,
  roleKey: user.roleKey,
  roleName: role?.name || user.roleKey,
  assignedClasses: user.assignedClasses || [],
  assignedSections: user.assignedSections || [],
  allowedPermissions: user.allowedPermissions || [],
  deniedPermissions: user.deniedPermissions || [],
  status: user.status,
  passwordChangedAt: user.passwordChangedAt,
  lastLoginAt: user.lastLoginAt,
  lastLoginIp: user.lastLoginIp,
  failedLoginAttempts: user.failedLoginAttempts || 0,
  lockedUntil: user.lockedUntil,
  isDeleted: user.isDeleted,
  createdBy: user.createdBy,
  updatedBy: user.updatedBy,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const addActivityLog = async ({
  actor,
  module,
  action,
  message,
  entityType,
  entityId,
}) => {
  await ActivityLog.create({
    _id: createId("log"),
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    userId: actor._id,
    module,
    action,
    message,
    entityType,
    entityId,
    ipAddress: null,
    userAgent: null,
    createdAt: now(),
  });
};

const findUserById = async (actor, id) => {
  return User.findOne({
    _id: id,
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
  }).lean();
};

const findRoleById = async (actor, roleId) => {
  return Role.findOne({
    _id: roleId,
    tenantId: actor.tenantId,
    status: "active",
  }).lean();
};

const validateRole = async (actor, roleId) => {
  const role = await findRoleById(actor, roleId);

  if (!role) {
    throw new ApiError(400, "Selected role is invalid or inactive", [
      { field: "roleId", message: "Invalid role selected" },
    ]);
  }

  return role;
};

const validateAssignedClasses = async (actor, assignedClasses = []) => {
  const classIds = uniqueArray(assignedClasses);

  for (const classId of classIds) {
    const classRecord = await ClassModel.findOne({
      _id: classId,
      tenantId: actor.tenantId,
      branchId: actor.branchId,
      isDeleted: false,
    }).lean();

    if (!classRecord) {
      throw new ApiError(400, "Invalid assigned class", [
        { field: "assignedClasses", message: `Class not found: ${classId}` },
      ]);
    }
  }

  return classIds;
};

const validateAssignedSections = async (actor, assignedSections = []) => {
  const sectionIds = uniqueArray(assignedSections);

  for (const sectionId of sectionIds) {
    const sectionRecord = await Section.findOne({
      _id: sectionId,
      tenantId: actor.tenantId,
      branchId: actor.branchId,
      isDeleted: false,
    }).lean();

    if (!sectionRecord) {
      throw new ApiError(400, "Invalid assigned section", [
        {
          field: "assignedSections",
          message: `Section not found: ${sectionId}`,
        },
      ]);
    }
  }

  return sectionIds;
};

const validateUniqueUserFields = async (
  actor,
  { username, email, mobile },
  excludeUserId = null,
) => {
  const baseQuery = {
    tenantId: actor.tenantId,
    isDeleted: false,
    ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
  };

  const duplicateUsername = await User.findOne({
    ...baseQuery,
    username: normalizeText(username),
  }).lean();

  if (duplicateUsername) {
    throw new ApiError(409, "Username already exists", [
      { field: "username", message: "Username already exists" },
    ]);
  }

  if (email) {
    const duplicateEmail = await User.findOne({
      ...baseQuery,
      email: normalizeText(email),
    }).lean();

    if (duplicateEmail) {
      throw new ApiError(409, "Email already exists", [
        { field: "email", message: "Email already exists" },
      ]);
    }
  }

  if (mobile) {
    const duplicateMobile = await User.findOne({
      ...baseQuery,
      mobile: String(mobile),
    }).lean();

    if (duplicateMobile) {
      throw new ApiError(409, "Mobile number already exists", [
        { field: "mobile", message: "Mobile number already exists" },
      ]);
    }
  }
};

const revokeUserSessions = async (userId, reason, revokedBy) => {
  const result = await UserSession.updateMany(
    {
      userId,
      isActive: true,
      revokedAt: null,
    },
    {
      $set: {
        isActive: false,
        revokedAt: now(),
        revokedBy,
        revokeReason: reason,
      },
    },
  );

  return result.modifiedCount;
};

export const listUsers = async ({ actor, query }) => {
  ensureMongoMode();

  const search = normalizeText(query.search);
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const skip = (page - 1) * limit;

  const mongoQuery = {
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
  };

  if (query.status && query.status !== "all") {
    mongoQuery.status = query.status;
  }

  if (query.roleKey && query.roleKey !== "all") {
    mongoQuery.roleKey = query.roleKey;
  }

  if (search) {
    mongoQuery.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
      { roleKey: { $regex: search, $options: "i" } },
    ];
  }

  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  const [users, total] = await Promise.all([
    User.find(mongoQuery)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),

    User.countDocuments(mongoQuery),
  ]);

  const roleIds = [...new Set(users.map((user) => user.roleId))];

  const roles = await Role.find({
    _id: { $in: roleIds },
  }).lean();

  const roleMap = new Map(roles.map((role) => [role._id, role]));

  return {
    users: users.map((user) => sanitizeUser(user, roleMap.get(user.roleId))),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createUser = async ({ actor, payload }) => {
  ensureMongoMode();

  const role = await validateRole(actor, payload.roleId);

  if (
    role.key === ROLE_KEYS.SUPER_ADMIN &&
    actor.roleKey !== ROLE_KEYS.SUPER_ADMIN
  ) {
    throw new ApiError(403, "Only Super Admin can create another Super Admin");
  }

  await validateUniqueUserFields(actor, {
    username: payload.username,
    email: payload.email,
    mobile: payload.mobile,
  });

  const assignedClasses = await validateAssignedClasses(
    actor,
    payload.assignedClasses,
  );
  const assignedSections = await validateAssignedSections(
    actor,
    payload.assignedSections,
  );
  const passwordHash = await hashPassword(payload.password);

  const user = await User.create({
    _id: createId("user"),
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    fullName: payload.fullName.trim(),
    username: normalizeText(payload.username),
    email: payload.email ? normalizeText(payload.email) : "",
    mobile: payload.mobile || "",
    passwordHash,
    roleId: role._id,
    roleKey: role.key,
    assignedClasses,
    assignedSections,
    allowedPermissions: uniqueArray(payload.allowedPermissions),
    deniedPermissions: uniqueArray(payload.deniedPermissions),
    status: payload.status || "active",
    passwordChangedAt: now(),
    lastLoginAt: null,
    lastLoginIp: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    isDeleted: false,
    createdBy: actor._id,
    updatedBy: actor._id,
  });

  await addActivityLog({
    actor,
    module: "User Management",
    action: "USER_CREATED",
    message: `User created: ${user.username}`,
    entityType: "User",
    entityId: user._id,
  });

  return sanitizeUser(user.toObject(), role);
};

export const getUserById = async ({ actor, id }) => {
  ensureMongoMode();

  const user = await findUserById(actor, id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const role = await Role.findById(user.roleId).lean();
  const sanitized = sanitizeUser(user, role);

  return {
    ...sanitized,
    effectivePermissions: getEffectivePermissions({ user, role }),
  };
};

export const updateUser = async ({ actor, id, payload }) => {
  ensureMongoMode();

  const user = await findUserById(actor, id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await validateUniqueUserFields(
    actor,
    {
      username: user.username,
      email: payload.email !== undefined ? payload.email : user.email,
      mobile: payload.mobile !== undefined ? payload.mobile : user.mobile,
    },
    user._id,
  );

  let role = await Role.findById(user.roleId).lean();

  const patch = {};

  if (payload.roleId) {
    role = await validateRole(actor, payload.roleId);

    if (user._id === actor._id && role.key !== actor.roleKey) {
      throw new ApiError(400, "You cannot change your own role");
    }

    patch.roleId = role._id;
    patch.roleKey = role.key;
  }

  if (payload.fullName !== undefined) patch.fullName = payload.fullName.trim();
  if (payload.email !== undefined)
    patch.email = payload.email ? normalizeText(payload.email) : "";
  if (payload.mobile !== undefined) patch.mobile = payload.mobile || "";
  if (payload.assignedClasses !== undefined) {
    patch.assignedClasses = await validateAssignedClasses(
      actor,
      payload.assignedClasses,
    );
  }
  if (payload.assignedSections !== undefined) {
    patch.assignedSections = await validateAssignedSections(
      actor,
      payload.assignedSections,
    );
  }
  if (payload.allowedPermissions !== undefined) {
    patch.allowedPermissions = uniqueArray(payload.allowedPermissions);
  }
  if (payload.deniedPermissions !== undefined) {
    patch.deniedPermissions = uniqueArray(payload.deniedPermissions);
  }
  if (payload.status !== undefined) {
    if (user._id === actor._id && payload.status !== "active") {
      throw new ApiError(400, "You cannot disable or lock your own account");
    }
    patch.status = payload.status;
  }

  patch.updatedBy = actor._id;

  await User.updateOne({ _id: user._id }, { $set: patch });

  const updated = await User.findById(user._id).lean();

  await addActivityLog({
    actor,
    module: "User Management",
    action: "USER_UPDATED",
    message: `User updated: ${updated.username}`,
    entityType: "User",
    entityId: updated._id,
  });

  return sanitizeUser(updated, role);
};

export const disableUser = async ({ actor, id }) => {
  ensureMongoMode();

  const user = await findUserById(actor, id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user._id === actor._id) {
    throw new ApiError(400, "You cannot disable your own account");
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        status: "disabled",
        updatedBy: actor._id,
      },
    },
  );

  const revokedCount = await revokeUserSessions(
    user._id,
    "user_disabled",
    actor._id,
  );
  const updated = await User.findById(user._id).lean();

  await addActivityLog({
    actor,
    module: "User Management",
    action: "USER_DISABLED",
    message: `User disabled: ${updated.username}`,
    entityType: "User",
    entityId: updated._id,
  });

  return { user: sanitizeUser(updated), revokedCount };
};

export const enableUser = async ({ actor, id }) => {
  ensureMongoMode();

  const user = await findUserById(actor, id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        status: "active",
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedBy: actor._id,
      },
    },
  );

  const updated = await User.findById(user._id).lean();

  await addActivityLog({
    actor,
    module: "User Management",
    action: "USER_ENABLED",
    message: `User enabled: ${updated.username}`,
    entityType: "User",
    entityId: updated._id,
  });

  return sanitizeUser(updated);
};

export const deleteUser = async ({ actor, id }) => {
  ensureMongoMode();

  const user = await findUserById(actor, id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user._id === actor._id) {
    throw new ApiError(400, "You cannot delete your own account");
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        isDeleted: true,
        status: "disabled",
        updatedBy: actor._id,
      },
    },
  );

  const revokedCount = await revokeUserSessions(
    user._id,
    "user_deleted",
    actor._id,
  );

  await addActivityLog({
    actor,
    module: "User Management",
    action: "USER_DELETED",
    message: `User deleted: ${user.username}`,
    entityType: "User",
    entityId: user._id,
  });

  return { revokedCount };
};

export const resetUserPassword = async ({ actor, id, newPassword }) => {
  ensureMongoMode();

  const user = await findUserById(actor, id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const passwordHash = await hashPassword(newPassword);

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        passwordHash,
        passwordChangedAt: now(),
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedBy: actor._id,
      },
    },
  );

  const revokedCount = await revokeUserSessions(
    user._id,
    "password_reset",
    actor._id,
  );
  const updated = await User.findById(user._id).lean();

  await addActivityLog({
    actor,
    module: "User Management",
    action: "USER_PASSWORD_RESET",
    message: `Password reset for user: ${updated.username}`,
    entityType: "User",
    entityId: updated._id,
  });

  return { user: sanitizeUser(updated), revokedCount };
};

export const listUserSessions = async ({ actor, id }) => {
  ensureMongoMode();

  const user = await findUserById(actor, id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return UserSession.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
};

export const forceLogoutUser = async ({ actor, id }) => {
  ensureMongoMode();

  const user = await findUserById(actor, id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const revokedCount = await revokeUserSessions(
    user._id,
    "force_logout",
    actor._id,
  );

  await addActivityLog({
    actor,
    module: "User Management",
    action: "USER_FORCE_LOGOUT",
    message: `Force logout user: ${user.username}`,
    entityType: "User",
    entityId: user._id,
  });

  return { revokedCount };
};
