import { z } from "zod";
import { ALL_PERMISSION_KEYS } from "../../constants/permissions.js";

const objectIdLike = z
  .string({ required_error: "ID is required" })
  .trim()
  .min(3, "Invalid ID");

const optionalEmail = z
  .string()
  .trim()
  .email("Invalid email address")
  .optional()
  .or(z.literal(""));

const optionalMobile = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Mobile number must be a valid 10-digit Indian mobile number")
  .optional()
  .or(z.literal(""));

const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const permissionArray = z
  .array(z.enum(ALL_PERMISSION_KEYS))
  .optional()
  .default([]);

const optionalPermissionArray = z.array(z.enum(ALL_PERMISSION_KEYS)).optional();

const idArray = z.array(z.string().trim().min(3, "Invalid ID")).optional().default([]);

const optionalIdArray = z.array(z.string().trim().min(3, "Invalid ID")).optional();

const statusSchema = z.enum(["active", "disabled", "locked"]);

export const listUsersValidation = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    search: z.string().trim().optional().default(""),
    status: z.enum(["active", "disabled", "locked", "all"]).optional().default("all"),
    roleKey: z.string().trim().optional().default("all"),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    sortBy: z
      .enum(["fullName", "username", "roleKey", "status", "lastLoginAt", "createdAt"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const createUserValidation = z.object({
  body: z
    .object({
      fullName: z
        .string({ required_error: "Full name is required" })
        .trim()
        .min(2, "Full name must be at least 2 characters")
        .max(100, "Full name must not exceed 100 characters"),
      username: z
        .string({ required_error: "Username is required" })
        .trim()
        .toLowerCase()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must not exceed 30 characters")
        .regex(/^[a-z0-9._-]+$/, "Username can contain lowercase letters, numbers, dot, underscore, hyphen only"),
      email: optionalEmail,
      mobile: optionalMobile,
      password: passwordSchema,
      roleId: objectIdLike,
      assignedClasses: idArray,
      assignedSections: idArray,
      allowedPermissions: permissionArray,
      deniedPermissions: permissionArray,
      status: statusSchema.optional().default("active"),
    })
    .refine(
      (data) => {
        const allowed = new Set(data.allowedPermissions || []);
        return !(data.deniedPermissions || []).some((permission) => allowed.has(permission));
      },
      {
        message: "Same permission cannot be both allowed and denied",
        path: ["deniedPermissions"],
      }
    ),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateUserValidation = z.object({
  body: z
    .object({
      fullName: z.string().trim().min(2).max(100).optional(),
      email: optionalEmail,
      mobile: optionalMobile,
      roleId: objectIdLike.optional(),
      assignedClasses: optionalIdArray,
      assignedSections: optionalIdArray,
      allowedPermissions: optionalPermissionArray,
      deniedPermissions: optionalPermissionArray,
      status: statusSchema.optional(),
    })
    .refine(
      (data) => {
        const allowed = new Set(data.allowedPermissions || []);
        return !(data.deniedPermissions || []).some((permission) => allowed.has(permission));
      },
      {
        message: "Same permission cannot be both allowed and denied",
        path: ["deniedPermissions"],
      }
    ),
  query: z.object({}).passthrough(),
  params: z.object({
    id: objectIdLike,
  }),
});

export const userIdValidation = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: objectIdLike,
  }),
});

export const resetPasswordValidation = z.object({
  body: z.object({
    newPassword: passwordSchema,
  }),
  query: z.object({}).passthrough(),
  params: z.object({
    id: objectIdLike,
  }),
});