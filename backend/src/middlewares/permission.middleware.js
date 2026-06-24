import { ALL_PERMISSION_KEYS } from "../constants/permissions.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { hasPermission } from "../utils/permissions.js";

const validatePermissionKeys = (permissionKeys) => {
  const invalidKeys = permissionKeys.filter(
    (permissionKey) => !ALL_PERMISSION_KEYS.includes(permissionKey)
  );

  if (invalidKeys.length > 0) {
    throw new ApiError(
      500,
      `Invalid permission configured on route: ${invalidKeys.join(", ")}`
    );
  }
};

const ensureAuthenticatedContext = (req) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication is required");
  }
};

export const authorize = (...permissionKeys) => {
  return asyncHandler(async (req, res, next) => {
    ensureAuthenticatedContext(req);
    validatePermissionKeys(permissionKeys);

    const allowed = permissionKeys.every((permissionKey) =>
      hasPermission({ user: req.user, role: req.role, permissionKey })
    );

    if (!allowed) {
      throw new ApiError(403, "You do not have permission to perform this action");
    }

    next();
  });
};

export const authorizeAny = (...permissionKeys) => {
  return asyncHandler(async (req, res, next) => {
    ensureAuthenticatedContext(req);
    validatePermissionKeys(permissionKeys);

    const allowed = permissionKeys.some((permissionKey) =>
      hasPermission({ user: req.user, role: req.role, permissionKey })
    );

    if (!allowed) {
      throw new ApiError(403, "You do not have permission to access this resource");
    }

    next();
  });
};