import { env } from "../../config/env.js";
import { ROLE_KEYS } from "../../constants/roles.js";
import { Role, User, UserSession } from "../../models/nativeModels.js";
import { ApiError } from "../../utils/ApiError.js";
import { createId } from "../../utils/id.js";
import { comparePassword } from "../../utils/password.js";
import { getEffectivePermissions } from "../../utils/permissions.js";
import {
  clearRefreshCookieOptions,
  createRefreshTokenId,
  getRefreshTokenExpiryDate,
  hashToken,
  refreshCookieOptions,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/token.js";

const now = () => new Date().toISOString();

const ensureMongoMode = () => {
  if (env.dbMode !== "mongodb") {
    throw new ApiError(500, "Native auth service requires DB_MODE=mongodb.");
  }
};

const sanitizeUser = (user, role, permissions) => ({
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
  permissions,
  status: user.status,
  lastLoginAt: user.lastLoginAt,
});

const getRequestIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown"
  );
};

const getUserAgent = (req) => {
  return req.headers["user-agent"] || "unknown";
};

const getUserRole = async (user) => {
  return Role.findOne({
    _id: user.roleId,
    tenantId: user.tenantId,
    status: "active",
  }).lean();
};

const createTokenPair = ({ user, sessionId, refreshTokenId }) => {
  const accessToken = signAccessToken({ user, sessionId });
  const refreshToken = signRefreshToken({ user, sessionId, refreshTokenId });

  return {
    accessToken,
    refreshToken,
  };
};

export const loginUser = async ({ username, password, req }) => {
  ensureMongoMode();

  const normalizedUsername = username.trim().toLowerCase();

  const user = await User.findOne({
    username: normalizedUsername,
    isDeleted: false,
  }).lean();

  if (!user) {
    throw new ApiError(401, "Invalid username or password");
  }

  if (user.status !== "active") {
    throw new ApiError(403, "User account is not active");
  }

  if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
    throw new ApiError(423, "User account is temporarily locked");
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    const failedLoginAttempts = Number(user.failedLoginAttempts || 0) + 1;

    const patch = {
      failedLoginAttempts,
      updatedAt: now(),
    };

    if (failedLoginAttempts >= 5) {
      patch.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }

    await User.updateOne({ _id: user._id }, { $set: patch });

    throw new ApiError(401, "Invalid username or password");
  }

  const role = await getUserRole(user);

  if (!role || role.status !== "active") {
    throw new ApiError(403, "User role is not active");
  }

  const sessionId = createId("session");
  const refreshTokenId = createRefreshTokenId();
  const tokenPair = createTokenPair({ user, sessionId, refreshTokenId });
  const refreshExpiry = getRefreshTokenExpiryDate();

  await UserSession.create({
    _id: sessionId,
    tenantId: user.tenantId,
    branchId: user.branchId,
    userId: user._id,
    refreshTokenHash: hashToken(tokenPair.refreshToken),
    refreshTokenId,
    userAgent: getUserAgent(req),
    ipAddress: getRequestIp(req),
    expiresAt: refreshExpiry.toISOString(),
    revokedAt: null,
    revokedBy: null,
    revokeReason: null,
    isActive: true,
  });

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: now(),
        lastLoginIp: getRequestIp(req),
        updatedAt: now(),
      },
    },
  );

  const updatedUser = await User.findById(user._id).lean();
  const permissions = getEffectivePermissions({ user: updatedUser, role });

  return {
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
    refreshCookieOptions: refreshCookieOptions(),
    user: sanitizeUser(updatedUser, role, permissions),
  };
};

export const refreshUserSession = async ({ refreshToken, req }) => {
  ensureMongoMode();

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findOne({
    _id: decoded.sub,
    isDeleted: false,
  }).lean();

  if (!user) {
    throw new ApiError(401, "User account not found");
  }

  if (user.status !== "active") {
    throw new ApiError(403, "User account is not active");
  }

  const session = await UserSession.findOne({
    _id: decoded.sessionId,
    userId: user._id,
    refreshTokenId: decoded.refreshTokenId,
    isActive: true,
    revokedAt: null,
  }).lean();

  if (!session) {
    throw new ApiError(401, "Session is no longer active");
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await UserSession.updateOne(
      { _id: session._id },
      {
        $set: {
          isActive: false,
          revokedAt: now(),
          revokeReason: "expired",
        },
      },
    );

    throw new ApiError(401, "Session has expired");
  }

  if (session.refreshTokenHash !== hashToken(refreshToken)) {
    await UserSession.updateOne(
      { _id: session._id },
      {
        $set: {
          isActive: false,
          revokedAt: now(),
          revokeReason: "refresh_token_reuse_detected",
        },
      },
    );

    throw new ApiError(401, "Invalid refresh token");
  }

  const role = await getUserRole(user);

  if (!role || role.status !== "active") {
    throw new ApiError(403, "User role is not active");
  }

  const newRefreshTokenId = createRefreshTokenId();

  const tokenPair = createTokenPair({
    user,
    sessionId: session._id,
    refreshTokenId: newRefreshTokenId,
  });

  const refreshExpiry = getRefreshTokenExpiryDate();

  await UserSession.updateOne(
    { _id: session._id },
    {
      $set: {
        refreshTokenHash: hashToken(tokenPair.refreshToken),
        refreshTokenId: newRefreshTokenId,
        expiresAt: refreshExpiry.toISOString(),
        userAgent: getUserAgent(req),
        ipAddress: getRequestIp(req),
      },
    },
  );

  const permissions = getEffectivePermissions({ user, role });

  return {
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
    refreshCookieOptions: refreshCookieOptions(),
    user: sanitizeUser(user, role, permissions),
  };
};

export const logoutCurrentSession = async ({ userId, sessionId }) => {
  ensureMongoMode();

  await UserSession.updateOne(
    {
      _id: sessionId,
      userId,
      isActive: true,
    },
    {
      $set: {
        isActive: false,
        revokedAt: now(),
        revokeReason: "user_logout",
      },
    },
  );

  return {
    clearCookieOptions: clearRefreshCookieOptions(),
  };
};

export const logoutAllUserSessions = async ({ userId }) => {
  ensureMongoMode();

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
        revokeReason: "user_logout_all",
      },
    },
  );

  return {
    revokedCount: result.modifiedCount,
    clearCookieOptions: clearRefreshCookieOptions(),
  };
};

export const getCurrentUserProfile = async ({ user }) => {
  ensureMongoMode();

  const freshUser = await User.findOne({
    _id: user._id,
    isDeleted: false,
  }).lean();

  if (!freshUser) {
    throw new ApiError(401, "User account not found");
  }

  const role = await getUserRole(freshUser);
  const permissions = getEffectivePermissions({ user: freshUser, role });

  return sanitizeUser(freshUser, role, permissions);
};

export const getOwnActiveSessions = async ({ userId }) => {
  ensureMongoMode();

  const sessions = await UserSession.find({
    userId,
    isActive: true,
    revokedAt: null,
  })
    .sort({ createdAt: -1 })
    .lean();

  return sessions
    .filter((session) => new Date(session.expiresAt).getTime() > Date.now())
    .map((session) => ({
      _id: session._id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }));
};
