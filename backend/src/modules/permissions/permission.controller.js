import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getGroupedPermissionCatalog,
  getMyPermissions,
  getPermissionCatalog,
} from "./permission.service.js";

export const listPermissionCatalog = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, getPermissionCatalog(), "Permission catalog loaded"));
});

export const listGroupedPermissionCatalog = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      getGroupedPermissionCatalog(),
      "Grouped permission catalog loaded"
    )
  );
});

export const listMyPermissions = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      getMyPermissions({ user: req.user, role: req.role }),
      "Current user permissions loaded"
    )
  );
});