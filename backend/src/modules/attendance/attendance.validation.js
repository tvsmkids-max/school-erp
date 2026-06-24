import { z } from "zod";
import { ATTENDANCE_STATUS } from "../../constants/attendanceStatus.js";

const idSchema = z
  .string({ required_error: "ID is required" })
  .trim()
  .min(3, "Invalid ID");

const dateSchema = z
  .string({ required_error: "Date is required" })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

const statusEnum = z.enum(Object.values(ATTENDANCE_STATUS));

export const dailyAttendanceValidation = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    date: dateSchema,
    academicSessionId: idSchema,
    classId: idSchema,
    sectionId: z.string().trim().optional().default(""),
    status: z.enum([...Object.values(ATTENDANCE_STATUS), "all"]).optional().default("all"),
    search: z.string().trim().optional().default(""),
  }),
});

export const markAttendanceValidation = z.object({
  body: z.object({
    date: dateSchema,
    academicSessionId: idSchema,
    classId: idSchema,
    sectionId: z.string().trim().optional().or(z.literal("")),
    records: z
      .array(
        z.object({
          studentId: idSchema,
          status: statusEnum,
          remarks: z.string().trim().max(200).optional().or(z.literal("")),
        })
      )
      .min(1, "At least one attendance record is required"),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const studentAttendanceSummaryValidation = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    studentId: idSchema,
    startDate: dateSchema,
    endDate: dateSchema,
  }),
});
