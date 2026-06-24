import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getRoleById, listRoles, updateRolePermissions } from "./role.service.js";

export const listRolesController = asyncHandler(async (req, res) => {
  const roles = await listRoles({ actor: req.user });

  return res.status(200).json(new ApiResponse(200, roles, "Roles loaded successfully"));
});

export const getRoleController = asyncHandler(async (req, res) => {
  const role = await getRoleById({ actor: req.user, id: req.validated.params.id });

  return res.status(200).json(new ApiResponse(200, role, "Role loaded successfully"));
});

export const updateRolePermissionsController = asyncHandler(async (req, res) => {
  const role = await updateRolePermissions({
    actor: req.user,
    id: req.validated.params.id,
    permissions: req.validated.body.permissions,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, role, "Role permissions updated successfully"));
});