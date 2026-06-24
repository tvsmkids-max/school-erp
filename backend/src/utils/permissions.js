import { ROLE_KEYS } from "../constants/roles.js";
import { ALL_PERMISSION_KEYS } from "../constants/permissions.js";

export const getEffectivePermissions = ({ user, role }) => {
  if (!user) {
    return [];
  }

  if (user.roleKey === ROLE_KEYS.SUPER_ADMIN) {
    return [...ALL_PERMISSION_KEYS];
  }

  const rolePermissions = Array.isArray(role?.permissions) ? role.permissions : [];
  const allowedPermissions = Array.isArray(user.allowedPermissions)
    ? user.allowedPermissions
    : [];
  const deniedPermissions = Array.isArray(user.deniedPermissions)
    ? user.deniedPermissions
    : [];

  const permissionSet = new Set([...rolePermissions, ...allowedPermissions]);

  for (const deniedPermission of deniedPermissions) {
    permissionSet.delete(deniedPermission);
  }

  return [...permissionSet].sort();
};

export const hasPermission = ({ user, role, permissionKey }) => {
  if (user?.roleKey === ROLE_KEYS.SUPER_ADMIN) {
    return true;
  }

  const permissions = getEffectivePermissions({ user, role });
  return permissions.includes(permissionKey);
};