import { z } from "zod";
import { STUDENT_STATUS } from "../../constants/studentStatus.js";

const idSchema = z
  .string({ required_error: "ID is required" })
  .trim()
  .min(3, "Invalid ID");

const dateSchema = z
  .string({ required_error: "Date is required" })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

export const attendanceAnalyticsValidation = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    startDate: dateSchema,
    endDate: dateSchema,
    academicSessionId: idSchema,
    classId: idSchema,
    sectionId: z.string().trim().optional().default(""),
    gender: z.enum(["all", "male", "female", "other"]).optional().default("all"),
    category: z.string().trim().optional().default(""),
    studentStatus: z
      .enum(["all", ...Object.values(STUDENT_STATUS)])
      .optional()
      .default("active"),
    lowAttendanceThreshold: z.coerce
      .number()
      .min(1)
      .max(100)
      .optional()
      .default(75),
  }),
});