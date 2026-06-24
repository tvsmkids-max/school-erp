import { MENU_REGISTRY } from "../../constants/menu.js";
import { getEffectivePermissions } from "../../utils/permissions.js";

const hasAnyPermission = (permissionSet, requiredAnyPermissions = []) => {
  if (requiredAnyPermissions.length === 0) {
    return true;
  }

  return requiredAnyPermissions.some((permissionKey) =>
    permissionSet.has(permissionKey),
  );
};

const sortByOrder = (items) => {
  return [...items].sort(
    (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0),
  );
};

export const getMenuForUser = ({ user, role }) => {
  const permissions = getEffectivePermissions({ user, role });
  const permissionSet = new Set(permissions);

  return sortByOrder(MENU_REGISTRY)
    .map((menuGroup) => {
      const children = sortByOrder(menuGroup.children || []).filter((child) =>
        hasAnyPermission(permissionSet, child.requiredAnyPermissions),
      );

      const groupAllowed = hasAnyPermission(
        permissionSet,
        menuGroup.requiredAnyPermissions,
      );

      if (!groupAllowed && children.length === 0) {
        return null;
      }

      if ((menuGroup.children || []).length > 0 && children.length === 0) {
        return null;
      }

      return {
        key: menuGroup.key,
        label: menuGroup.label,
        path: menuGroup.path,
        icon: menuGroup.icon,
        sortOrder: menuGroup.sortOrder,
        children: children.map((child) => ({
          key: child.key,
          label: child.label,
          path: child.path,
          icon: child.icon,
          sortOrder: child.sortOrder,
        })),
      };
    })
    .filter(Boolean);
};
