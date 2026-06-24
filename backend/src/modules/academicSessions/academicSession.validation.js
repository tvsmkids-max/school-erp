import { z } from "zod";

const idSchema = z
  .string({ required_error: "Academic session ID is required" })
  .trim()
  .min(3, "Invalid academic session ID");

const dateStringSchema = z
  .string({ required_error: "Date is required" })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

const statusSchema = z.enum(["active", "inactive"]);

export const listAcademicSessionsValidation = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    search: z.string().trim().optional().default(""),
    status: z.enum(["active", "inactive", "all"]).optional().default("all"),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  }),
});

export const createAcademicSessionValidation = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Session name is required" })
      .trim()
      .min(4, "Session name must be at least 4 characters")
      .max(20, "Session name must not exceed 20 characters"),
    startDate: dateStringSchema,
    endDate: dateStringSchema,
    isCurrent: z.boolean().optional().default(false),
    status: statusSchema.optional().default("active"),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateAcademicSessionValidation = z.object({
  body: z.object({
    name: z.string().trim().min(4).max(20).optional(),
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
    status: statusSchema.optional(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({
    id: idSchema,
  }),
});

export const academicSessionIdValidation = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: idSchema,
  }),
});
