import crypto from "crypto";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { env } from "../config/env.js";

const parseExpiryToMilliseconds = (expiry) => {
  const value = String(expiry).trim();
  const match = value.match(/^(\d+)([smhd])$/);

  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  const unitMap = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * unitMap[unit];
};

export const createRefreshTokenId = () => {
  return `rt_${nanoid(32)}`;
};

export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const getRefreshTokenExpiryDate = () => {
  return new Date(Date.now() + parseExpiryToMilliseconds(env.jwtRefreshExpiresIn));
};

export const signAccessToken = ({ user, sessionId }) => {
  return jwt.sign(
    {
      type: "access",
      sub: user._id,
      tenantId: user.tenantId,
      branchId: user.branchId,
      roleKey: user.roleKey,
      sessionId,
    },
    env.jwtAccessSecret,
    {
      expiresIn: env.jwtAccessExpiresIn,
    }
  );
};

export const signRefreshToken = ({ user, sessionId, refreshTokenId }) => {
  return jwt.sign(
    {
      type: "refresh",
      sub: user._id,
      tenantId: user.tenantId,
      branchId: user.branchId,
      roleKey: user.roleKey,
      sessionId,
      refreshTokenId,
    },
    env.jwtRefreshSecret,
    {
      expiresIn: env.jwtRefreshExpiresIn,
    }
  );
};

export const verifyAccessToken = (token) => {
  const decoded = jwt.verify(token, env.jwtAccessSecret);

  if (decoded.type !== "access") {
    throw new Error("Invalid access token type");
  }

  return decoded;
};

export const verifyRefreshToken = (token) => {
  const decoded = jwt.verify(token, env.jwtRefreshSecret);

  if (decoded.type !== "refresh") {
    throw new Error("Invalid refresh token type");
  }

  return decoded;
};

export const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
  path: "/api/v1/auth",
  expires: getRefreshTokenExpiryDate(),
});

export const clearRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
  path: "/api/v1/auth",
});