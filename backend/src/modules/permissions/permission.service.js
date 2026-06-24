import { env } from "../../config/env.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { Permission } from "../../models/nativeModels.js";
import { getEffectivePermissions } from "../../utils/permissions.js";
import { ApiError } from "../../utils/ApiError.js";

const ensureMongoMode = () => {
  if (env.dbMode !== "mongodb") {
    throw new ApiError(
      500,
      "Native permission service requires DB_MODE=mongodb.",
    );
  }
};

const sortPermissions = (permissions) => {
  return [...permissions].sort(
    (a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0),
  );
};

const sanitizePermission = (permission) => ({
  module: permission.module,
  moduleKey: permission.moduleKey,
  action: permission.action,
  actionKey: permission.actionKey,
  permissionKey: permission.permissionKey,
  description: permission.description,
  menuGroup: permission.menuGroup,
  isMenuPermission: permission.isMenuPermission,
  displayOrder: permission.displayOrder,
});

export const getPermissionCatalog = async () => {
  ensureMongoMode();

  let permissions = await Permission.find({
    status: "active",
  }).lean();

  if (permissions.length === 0) {
    permissions = PERMISSIONS;
  }

  return sortPermissions(permissions).map(sanitizePermission);
};

export const getGroupedPermissionCatalog = async () => {
  ensureMongoMode();

  const permissions = await getPermissionCatalog();
  const grouped = {};

  for (const permission of permissions) {
    if (!grouped[permission.moduleKey]) {
      grouped[permission.moduleKey] = {
        module: permission.module,
        moduleKey: permission.moduleKey,
        permissions: [],
      };
    }

    grouped[permission.moduleKey].permissions.push(permission);
  }

  return Object.values(grouped);
};

export const getMyPermissions = ({ user, role }) => {
  return getEffectivePermissions({ user, role });
};
