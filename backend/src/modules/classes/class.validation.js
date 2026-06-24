import { z } from "zod";

const idSchema = z
  .string({ required_error: "Class ID is required" })
  .trim()
  .min(3, "Invalid class ID");

const statusSchema = z.enum(["active", "inactive"]);

const classNameSchema = z
  .string({ required_error: "Class name is required" })
  .trim()
  .min(1, "Class name is required")
  .max(50, "Class name must not exceed 50 characters");

const classCodeSchema = z
  .string({ required_error: "Class code is required" })
  .trim()
  .min(2, "Class code must be at least 2 characters")
  .max(50, "Class code must not exceed 50 characters")
  .regex(/^[A-Za-z0-9_-]+$/, "Class code can contain letters, numbers, underscore and hyphen only");

export const listClassesValidation = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    search: z.string().trim().optional().default(""),
    status: z.enum(["active", "inactive", "all"]).optional().default("all"),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  }),
});

export const createClassValidation = z.object({
  body: z.object({
    name: classNameSchema,
    displayName: z.string().trim().min(1).max(80).optional(),
    code: classCodeSchema,
    sortOrder: z.coerce.number().int().min(1, "Sort order must be at least 1"),
    status: statusSchema.optional().default("active"),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateClassValidation = z.object({
  body: z.object({
    name: classNameSchema.optional(),
    displayName: z.string().trim().min(1).max(80).optional(),
    code: classCodeSchema.optional(),
    sortOrder: z.coerce.number().int().min(1).optional(),
    status: statusSchema.optional(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({
    id: idSchema,
  }),
});

export const classIdValidation = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: idSchema,
  }),
});
