import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getCurrentUserProfile,
  getOwnActiveSessions,
  loginUser,
  logoutAllUserSessions,
  logoutCurrentSession,
  refreshUserSession,
} from "./auth.service.js";

const getRefreshTokenFromRequest = (req) => {
  return req.cookies?.refreshToken || req.body?.refreshToken || null;
};

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.validated.body;

  const result = await loginUser({ username, password, req });

  res.cookie("refreshToken", result.refreshToken, result.refreshCookieOptions);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        accessToken: result.accessToken,
        user: result.user,
      },
      "Login successful"
    )
  );
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);

  const result = await refreshUserSession({ refreshToken, req });

  res.cookie("refreshToken", result.refreshToken, result.refreshCookieOptions);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        accessToken: result.accessToken,
        user: result.user,
      },
      "Token refreshed successfully"
    )
  );
});

export const logout = asyncHandler(async (req, res) => {
  const result = await logoutCurrentSession({
    userId: req.user._id,
    sessionId: req.auth.session._id,
  });

  res.clearCookie("refreshToken", result.clearCookieOptions);

  return res.status(200).json(new ApiResponse(200, null, "Logout successful"));
});

export const logoutAll = asyncHandler(async (req, res) => {
  const result = await logoutAllUserSessions({ userId: req.user._id });

  res.clearCookie("refreshToken", result.clearCookieOptions);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        revokedCount: result.revokedCount,
      },
      "All sessions logged out successfully"
    )
  );
});

export const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUserProfile({ user: req.user });

  return res.status(200).json(new ApiResponse(200, user, "Current user loaded"));
});

export const sessions = asyncHandler(async (req, res) => {
  const activeSessions = await getOwnActiveSessions({ userId: req.user._id });

  return res
    .status(200)
    .json(new ApiResponse(200, activeSessions, "Active sessions loaded"));
});