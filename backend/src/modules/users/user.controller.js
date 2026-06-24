import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createUser,
  deleteUser,
  disableUser,
  enableUser,
  forceLogoutUser,
  getUserById,
  listUserSessions,
  listUsers,
  resetUserPassword,
  updateUser,
} from "./user.service.js";

export const listUsersController = asyncHandler(async (req, res) => {
  const result = await listUsers({ actor: req.user, query: req.validated.query });

  return res
    .status(200)
    .json(new ApiResponse(200, result.users, "Users loaded successfully", result.meta));
});

export const createUserController = asyncHandler(async (req, res) => {
  const user = await createUser({ actor: req.user, payload: req.validated.body });

  return res.status(201).json(new ApiResponse(201, user, "User created successfully"));
});

export const getUserController = asyncHandler(async (req, res) => {
  const user = await getUserById({ actor: req.user, id: req.validated.params.id });

  return res.status(200).json(new ApiResponse(200, user, "User loaded successfully"));
});

export const updateUserController = asyncHandler(async (req, res) => {
  const user = await updateUser({
    actor: req.user,
    id: req.validated.params.id,
    payload: req.validated.body,
  });

  return res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
});

export const disableUserController = asyncHandler(async (req, res) => {
  const result = await disableUser({ actor: req.user, id: req.validated.params.id });

  return res.status(200).json(new ApiResponse(200, result, "User disabled successfully"));
});

export const enableUserController = asyncHandler(async (req, res) => {
  const user = await enableUser({ actor: req.user, id: req.validated.params.id });

  return res.status(200).json(new ApiResponse(200, user, "User enabled successfully"));
});

export const deleteUserController = asyncHandler(async (req, res) => {
  const result = await deleteUser({ actor: req.user, id: req.validated.params.id });

  return res.status(200).json(new ApiResponse(200, result, "User deleted successfully"));
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  const result = await resetUserPassword({
    actor: req.user,
    id: req.validated.params.id,
    newPassword: req.validated.body.newPassword,
  });

  return res.status(200).json(new ApiResponse(200, result, "Password reset successfully"));
});

export const listUserSessionsController = asyncHandler(async (req, res) => {
  const sessions = await listUserSessions({ actor: req.user, id: req.validated.params.id });

  return res.status(200).json(new ApiResponse(200, sessions, "User sessions loaded"));
});

export const forceLogoutController = asyncHandler(async (req, res) => {
  const result = await forceLogoutUser({ actor: req.user, id: req.validated.params.id });

  return res.status(200).json(new ApiResponse(200, result, "User logged out successfully"));
});