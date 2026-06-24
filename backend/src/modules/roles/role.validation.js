import { z } from "zod";
import { ALL_PERMISSION_KEYS } from "../../constants/permissions.js";

const idSchema = z
  .string({ required_error: "Role ID is required" })
  .trim()
  .min(3, "Invalid role ID");

export const roleIdValidation = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: idSchema,
  }),
});

export const updateRolePermissionsValidation = z.object({
  body: z.object({
    permissions: z
      .array(z.enum(ALL_PERMISSION_KEYS), {
        required_error: "Permissions are required",
      })
      .default([]),
  }),
  query: z.object({}).passthrough(),
  params: z.object({
    id: idSchema,
  }),
});