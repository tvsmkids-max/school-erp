import { env } from "../config/env.js";
import { readLocalDb } from "../config/localDb.js";
import { Role, User, UserSession } from "../models/nativeModels.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/token.js";

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.replace("Bearer ", "").trim();
};

const authenticateMongoUser = async ({ decoded }) => {
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
    isActive: true,
    revokedAt: null,
  }).lean();

  if (!session) {
    throw new ApiError(401, "Session is no longer active");
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    throw new ApiError(401, "Session has expired");
  }

  const role = await Role.findOne({
    _id: user.roleId,
    tenantId: user.tenantId,
  }).lean();

  if (!role) {
    throw new ApiError(403, "User role not found");
  }

  return {
    user,
    role,
    session,
  };
};

const authenticateJsonBridgeUser = async ({ decoded }) => {
  const db = await readLocalDb();

  const user = db.users.find(
    (item) => item._id === decoded.sub && item.isDeleted === false,
  );

  if (!user) {
    throw new ApiError(401, "User account not found");
  }

  if (user.status !== "active") {
    throw new ApiError(403, "User account is not active");
  }

  const session = db.user_sessions.find(
    (item) =>
      item._id === decoded.sessionId &&
      item.userId === user._id &&
      item.isActive === true &&
      !item.revokedAt,
  );

  if (!session) {
    throw new ApiError(401, "Session is no longer active");
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    throw new ApiError(401, "Session has expired");
  }

  const role = db.roles.find((item) => item._id === user.roleId) || null;

  if (!role) {
    throw new ApiError(403, "User role not found");
  }

  return {
    user,
    role,
    session,
  };
};

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    throw new ApiError(401, "Authentication token is required");
  }

  let decoded;

  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token");
  }

  const authContext =
    env.dbMode === "mongodb"
      ? await authenticateMongoUser({ decoded })
      : await authenticateJsonBridgeUser({ decoded });

  req.user = authContext.user;
  req.role = authContext.role;
  req.auth = {
    tokenPayload: decoded,
    session: authContext.session,
  };

  next();
});
