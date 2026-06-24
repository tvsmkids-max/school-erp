import { z } from "zod";
import { STUDENT_STATUS } from "../../constants/studentStatus.js";

const idSchema = z
  .string({ required_error: "ID is required" })
  .trim()
  .min(3, "Invalid ID");

const optionalIdSchema = z
  .string()
  .trim()
  .min(3, "Invalid ID")
  .optional()
  .or(z.literal(""));

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .optional()
  .or(z.literal(""));

const requiredDate = z
  .string({ required_error: "Date is required" })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

const optionalMobile = z
  .string()
  .trim()
  .regex(
    /^[6-9]\d{9}$/,
    "Mobile number must be a valid 10-digit Indian mobile number"
  )
  .optional()
  .or(z.literal(""));

const optionalAadhaar = z
  .string()
  .trim()
  .regex(/^\d{12}$/, "Aadhaar number must be 12 digits")
  .optional()
  .or(z.literal(""));

const optionalPin = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "PIN must be 6 digits")
  .optional()
  .or(z.literal(""));

const optionalText = (max = 100) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const statusEnum = z.enum(Object.values(STUDENT_STATUS));

const statusFilterEnum = z.enum([
  ...Object.values(STUDENT_STATUS),
  "all",
]);

const genderEnum = z.enum(["male", "female", "other"]);
const genderFilterEnum = z.enum(["male", "female", "other", "all"]);
const availabilityFilterEnum = z.enum(["all", "available", "missing"]);

export const listStudentsValidation = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    search: z.string().trim().optional().default(""),
    status: statusFilterEnum.optional().default("all"),
    academicSessionId: z.string().trim().optional().default(""),
    classId: z.string().trim().optional().default(""),
    sectionId: z.string().trim().optional().default(""),
    gender: genderFilterEnum.optional().default("all"),
    category: z.string().trim().optional().default(""),
    religion: z.string().trim().optional().default(""),
    admissionFrom: z.string().trim().optional().default(""),
    admissionTo: z.string().trim().optional().default(""),
    aadhaarStatus: availabilityFilterEnum.optional().default("all"),
    samagraStatus: availabilityFilterEnum.optional().default("all"),
    penStatus: availabilityFilterEnum.optional().default("all"),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    sortBy: z
      .enum([
        "studentName",
        "scholarNumber",
        "rollNumber",
        "admissionDate",
        "createdAt",
      ])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const createStudentValidation = z.object({
  body: z.object({
    scholarNumber: z
      .string({ required_error: "Scholar number is required" })
      .trim()
      .min(1, "Scholar number is required")
      .max(50, "Scholar number must not exceed 50 characters"),

    studentName: z
      .string({ required_error: "Student name is required" })
      .trim()
      .min(2, "Student name must be at least 2 characters")
      .max(120, "Student name must not exceed 120 characters"),

    gender: genderEnum,
    dob: optionalDate,
    mobileNumber: optionalMobile,

    classId: idSchema,
    sectionId: optionalIdSchema,

    rollNumber: optionalText(20),
    admissionDate: requiredDate,
    academicSessionId: idSchema,

    aadhaarNumber: optionalAadhaar,
    samagraId: optionalText(50),
    penNumber: optionalText(50),

    fatherName: optionalText(100),
    motherName: optionalText(100),
    guardianName: optionalText(100),
    parentMobile: optionalMobile,

    address: optionalText(300),
    city: optionalText(80),
    state: optionalText(80),
    pin: optionalPin,

    photoUrl: optionalText(500),
    category: optionalText(50),
    religion: optionalText(50),
    bloodGroup: optionalText(10),

    status: statusEnum.optional().default(STUDENT_STATUS.ACTIVE),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateStudentValidation = z.object({
  body: z.object({
    scholarNumber: z.string().trim().min(1).max(50).optional(),
    studentName: z.string().trim().min(2).max(120).optional(),
    gender: genderEnum.optional(),

    dob: optionalDate,
    mobileNumber: optionalMobile,

    classId: idSchema.optional(),
    sectionId: optionalIdSchema,

    rollNumber: optionalText(20),
    admissionDate: optionalDate,
    academicSessionId: idSchema.optional(),

    aadhaarNumber: optionalAadhaar,
    samagraId: optionalText(50),
    penNumber: optionalText(50),

    fatherName: optionalText(100),
    motherName: optionalText(100),
    guardianName: optionalText(100),
    parentMobile: optionalMobile,

    address: optionalText(300),
    city: optionalText(80),
    state: optionalText(80),
    pin: optionalPin,

    photoUrl: optionalText(500),
    category: optionalText(50),
    religion: optionalText(50),
    bloodGroup: optionalText(10),

    status: statusEnum.optional(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({
    id: idSchema,
  }),
});

export const studentIdValidation = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: idSchema,
  }),
});

export const updateStudentStatusValidation = z.object({
  body: z.object({
    status: statusEnum,
  }),
  query: z.object({}).passthrough(),
  params: z.object({
    id: idSchema,
  }),
});

export const bulkStudentStatusValidation = z.object({
  body: z.object({
    studentIds: z.array(idSchema).min(1, "At least one student is required"),
    status: statusEnum,
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const bulkStudentDeleteValidation = z.object({
  body: z.object({
    studentIds: z.array(idSchema).min(1, "At least one student is required"),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});