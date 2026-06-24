import { z } from "zod";

const idSchema = z
  .string({ required_error: "ID is required" })
  .trim()
  .min(3, "Invalid ID");

const statusSchema = z.enum(["active", "inactive"]);

const sectionNameSchema = z
  .string({ required_error: "Section name is required" })
  .trim()
  .min(1, "Section name is required")
  .max(20, "Section name must not exceed 20 characters");

const sectionCodeSchema = z
  .string({ required_error: "Section code is required" })
  .trim()
  .min(1, "Section code is required")
  .max(20, "Section code must not exceed 20 characters")
  .regex(/^[A-Za-z0-9_-]+$/, "Section code can contain letters, numbers, underscore and hyphen only");

export const listSectionsValidation = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    search: z.string().trim().optional().default(""),
    classId: z.string().trim().optional().default(""),
    status: z.enum(["active", "inactive", "all"]).optional().default("all"),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  }),
});

export const createSectionValidation = z.object({
  body: z.object({
    classId: idSchema,
    name: sectionNameSchema,
    code: sectionCodeSchema,
    sortOrder: z.coerce.number().int().min(1, "Sort order must be at least 1"),
    status: statusSchema.optional().default("active"),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateSectionValidation = z.object({
  body: z.object({
    classId: idSchema.optional(),
    name: sectionNameSchema.optional(),
    code: sectionCodeSchema.optional(),
    sortOrder: z.coerce.number().int().min(1).optional(),
    status: statusSchema.optional(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({
    id: idSchema,
  }),
});

export const sectionIdValidation = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: idSchema,
  }),
});
