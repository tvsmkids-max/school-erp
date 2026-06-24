import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getMenuForUser } from "./menu.service.js";

export const getMyMenu = asyncHandler(async (req, res) => {
  const menu = getMenuForUser({ user: req.user, role: req.role });

  return res.status(200).json(new ApiResponse(200, menu, "Menu loaded successfully"));
});