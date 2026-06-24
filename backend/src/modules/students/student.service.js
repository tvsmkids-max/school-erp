import { env } from "../../config/env.js";
import { STUDENT_STATUS } from "../../constants/studentStatus.js";
import { ApiError } from "../../utils/ApiError.js";
import { createId } from "../../utils/id.js";
import {
  AcademicSession,
  ActivityLog,
  ClassModel,
  Section,
  Student,
  StudentFieldConfig,
} from "../../models/nativeModels.js";

const now = () => new Date().toISOString();

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const clean = (value) => {
  return value === undefined || value === null ? "" : String(value).trim();
};

const ensureMongoMode = () => {
  if (env.dbMode !== "mongodb") {
    throw new ApiError(
      500,
      "Native student service requires DB_MODE=mongodb. Switch backend .env to DB_MODE=mongodb.",
    );
  }
};

const studentFields = [
  "scholarNumber",
  "studentName",
  "gender",
  "dob",
  "mobileNumber",
  "classId",
  "sectionId",
  "rollNumber",
  "admissionDate",
  "academicSessionId",
  "aadhaarNumber",
  "samagraId",
  "penNumber",
  "fatherName",
  "motherName",
  "guardianName",
  "parentMobile",
  "address",
  "city",
  "state",
  "pin",
  "photoUrl",
  "category",
  "religion",
  "bloodGroup",
  "status",
];

const buildStudentPayload = (payload) => {
  const built = {};

  for (const field of studentFields) {
    if (payload[field] !== undefined) {
      built[field] =
        typeof payload[field] === "string"
          ? clean(payload[field])
          : payload[field];
    }
  }

  return built;
};

const addActivityLog = async ({ actor, action, message, entityId }) => {
  await ActivityLog.create({
    _id: createId("log"),
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    userId: actor._id,
    module: "Student Management",
    action,
    message,
    entityType: "Student",
    entityId,
    ipAddress: null,
    userAgent: null,
    createdAt: now(),
  });
};

const getLookups = async (actor, student) => {
  const [classRecord, sectionRecord, sessionRecord] = await Promise.all([
    ClassModel.findOne({
      _id: student.classId,
      tenantId: actor.tenantId,
      branchId: actor.branchId,
      isDeleted: false,
    }).lean(),

    student.sectionId
      ? Section.findOne({
          _id: student.sectionId,
          tenantId: actor.tenantId,
          branchId: actor.branchId,
          isDeleted: false,
        }).lean()
      : null,

    AcademicSession.findOne({
      _id: student.academicSessionId,
      tenantId: actor.tenantId,
      branchId: actor.branchId,
      isDeleted: false,
    }).lean(),
  ]);

  return {
    classRecord,
    sectionRecord,
    sessionRecord,
  };
};

const sanitizeStudent = (student, lookups = {}) => ({
  _id: student._id,
  tenantId: student.tenantId,
  branchId: student.branchId,

  scholarNumber: student.scholarNumber,
  studentName: student.studentName,
  gender: student.gender,
  dob: student.dob,
  mobileNumber: student.mobileNumber,

  classId: student.classId,
  className:
    lookups.classRecord?.displayName || lookups.classRecord?.name || null,

  sectionId: student.sectionId || "",
  sectionName: lookups.sectionRecord?.name || "",

  rollNumber: student.rollNumber || "",
  admissionDate: student.admissionDate,

  academicSessionId: student.academicSessionId,
  academicSessionName: lookups.sessionRecord?.name || null,

  aadhaarNumber: student.aadhaarNumber || "",
  samagraId: student.samagraId || "",
  penNumber: student.penNumber || "",

  fatherName: student.fatherName || "",
  motherName: student.motherName || "",
  guardianName: student.guardianName || "",
  parentMobile: student.parentMobile || "",

  address: student.address || "",
  city: student.city || "",
  state: student.state || "",
  pin: student.pin || "",

  photoUrl: student.photoUrl || "",
  category: student.category || "",
  religion: student.religion || "",
  bloodGroup: student.bloodGroup || "",

  status: student.status,
  isDeleted: student.isDeleted,
  createdBy: student.createdBy,
  updatedBy: student.updatedBy,
  createdAt: student.createdAt,
  updatedAt: student.updatedAt,
});

const validateReferences = async (actor, payload) => {
  const classRecord = await ClassModel.findOne({
    _id: payload.classId,
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
  }).lean();

  if (!classRecord) {
    throw new ApiError(400, "Invalid class selected", [
      { field: "classId", message: "Class not found" },
    ]);
  }

  let sectionRecord = null;

  if (payload.sectionId) {
    sectionRecord = await Section.findOne({
      _id: payload.sectionId,
      classId: payload.classId,
      tenantId: actor.tenantId,
      branchId: actor.branchId,
      isDeleted: false,
    }).lean();

    if (!sectionRecord) {
      throw new ApiError(400, "Invalid section selected", [
        { field: "sectionId", message: "Section not found for selected class" },
      ]);
    }
  }

  const sessionRecord = await AcademicSession.findOne({
    _id: payload.academicSessionId,
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
  }).lean();

  if (!sessionRecord) {
    throw new ApiError(400, "Invalid academic session selected", [
      { field: "academicSessionId", message: "Academic session not found" },
    ]);
  }

  return {
    classRecord,
    sectionRecord,
    sessionRecord,
  };
};

const validateUniqueScholarNumber = async (
  actor,
  scholarNumber,
  excludeId = null,
) => {
  const query = {
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    scholarNumber,
    isDeleted: false,
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const exists = await Student.findOne(query).lean();

  if (exists) {
    throw new ApiError(409, "Scholar number already exists", [
      { field: "scholarNumber", message: "Scholar number already exists" },
    ]);
  }
};

const validateDynamicMandatoryFields = async (actor, payload) => {
  const configs = await StudentFieldConfig.find({
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    status: "active",
    isVisible: true,
    isMandatory: true,
  }).lean();

  const errors = [];

  for (const config of configs) {
    // Section is intentionally optional for now.
    if (config.fieldKey === "sectionId") {
      continue;
    }

    const value = payload[config.fieldKey];

    if (value === undefined || value === null || String(value).trim() === "") {
      errors.push({
        field: config.fieldKey,
        message: `${config.label} is required`,
      });
    }
  }

  if (errors.length > 0) {
    throw new ApiError(400, "Mandatory student fields missing", errors);
  }
};

export const listStudents = async ({ actor, query }) => {
  ensureMongoMode();

  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const skip = (page - 1) * limit;
  const search = normalizeText(query.search);

  const mongoQuery = {
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
  };

  if (query.status && query.status !== "all") {
    mongoQuery.status = query.status;
  }

  if (query.academicSessionId) {
    mongoQuery.academicSessionId = query.academicSessionId;
  }

  if (query.classId) {
    mongoQuery.classId = query.classId;
  }

  if (query.sectionId) {
    mongoQuery.sectionId = query.sectionId;
  }

  if (query.gender && query.gender !== "all") {
    mongoQuery.gender = query.gender;
  }

  if (query.category) {
    mongoQuery.category = {
      $regex: query.category,
      $options: "i",
    };
  }

  if (query.religion) {
    mongoQuery.religion = {
      $regex: query.religion,
      $options: "i",
    };
  }

  if (query.admissionFrom || query.admissionTo) {
    mongoQuery.admissionDate = {};

    if (query.admissionFrom) {
      mongoQuery.admissionDate.$gte = query.admissionFrom;
    }

    if (query.admissionTo) {
      mongoQuery.admissionDate.$lte = query.admissionTo;
    }
  }

  if (query.aadhaarStatus && query.aadhaarStatus !== "all") {
    mongoQuery.aadhaarNumber =
      query.aadhaarStatus === "available"
        ? { $nin: ["", null] }
        : { $in: ["", null] };
  }

  if (query.samagraStatus && query.samagraStatus !== "all") {
    mongoQuery.samagraId =
      query.samagraStatus === "available"
        ? { $nin: ["", null] }
        : { $in: ["", null] };
  }

  if (query.penStatus && query.penStatus !== "all") {
    mongoQuery.penNumber =
      query.penStatus === "available"
        ? { $nin: ["", null] }
        : { $in: ["", null] };
  }

  if (search) {
    mongoQuery.$or = [
      { scholarNumber: { $regex: search, $options: "i" } },
      { studentName: { $regex: search, $options: "i" } },
      { rollNumber: { $regex: search, $options: "i" } },
      { fatherName: { $regex: search, $options: "i" } },
      { motherName: { $regex: search, $options: "i" } },
      { parentMobile: { $regex: search, $options: "i" } },
    ];
  }

  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  const [students, total] = await Promise.all([
    Student.find(mongoQuery)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),

    Student.countDocuments(mongoQuery),
  ]);

  const sanitizedStudents = [];

  for (const student of students) {
    const lookups = await getLookups(actor, student);
    sanitizedStudents.push(sanitizeStudent(student, lookups));
  }

  return {
    students: sanitizedStudents,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createStudent = async ({ actor, payload }) => {
  ensureMongoMode();

  const studentPayload = buildStudentPayload(payload);

  await validateDynamicMandatoryFields(actor, studentPayload);
  await validateUniqueScholarNumber(actor, studentPayload.scholarNumber);

  const lookups = await validateReferences(actor, studentPayload);

  const student = await Student.create({
    _id: createId("student"),
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    ...studentPayload,
    sectionId: studentPayload.sectionId || "",
    status: studentPayload.status || STUDENT_STATUS.ACTIVE,
    isDeleted: false,
    createdBy: actor._id,
    updatedBy: actor._id,
  });

  await addActivityLog({
    actor,
    action: "STUDENT_CREATED",
    message: `Student created: ${student.studentName} (${student.scholarNumber})`,
    entityId: student._id,
  });

  return sanitizeStudent(student.toObject(), lookups);
};

export const getStudentById = async ({ actor, id }) => {
  ensureMongoMode();

  const student = await Student.findOne({
    _id: id,
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
  }).lean();

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const lookups = await getLookups(actor, student);

  return sanitizeStudent(student, lookups);
};

export const updateStudent = async ({ actor, id, payload }) => {
  ensureMongoMode();

  const student = await Student.findOne({
    _id: id,
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
  }).lean();

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const studentPayload = buildStudentPayload(payload);

  const merged = {
    ...student,
    ...studentPayload,
    sectionId:
      studentPayload.sectionId !== undefined
        ? studentPayload.sectionId
        : student.sectionId || "",
  };

  await validateDynamicMandatoryFields(actor, merged);

  if (studentPayload.scholarNumber !== undefined) {
    await validateUniqueScholarNumber(
      actor,
      studentPayload.scholarNumber,
      student._id,
    );
  }

  const lookups = await validateReferences(actor, merged);

  await Student.updateOne(
    { _id: id },
    {
      $set: {
        ...studentPayload,
        sectionId: merged.sectionId || "",
        updatedBy: actor._id,
      },
    },
  );

  const updatedStudent = await Student.findById(id).lean();

  await addActivityLog({
    actor,
    action: "STUDENT_UPDATED",
    message: `Student updated: ${updatedStudent.studentName} (${updatedStudent.scholarNumber})`,
    entityId: updatedStudent._id,
  });

  return sanitizeStudent(updatedStudent, lookups);
};

export const updateStudentStatus = async ({ actor, id, status }) => {
  ensureMongoMode();

  const student = await Student.findOne({
    _id: id,
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
  }).lean();

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  await Student.updateOne(
    { _id: id },
    {
      $set: {
        status,
        updatedBy: actor._id,
      },
    },
  );

  const updatedStudent = await Student.findById(id).lean();
  const lookups = await getLookups(actor, updatedStudent);

  await addActivityLog({
    actor,
    action: "STUDENT_STATUS_UPDATED",
    message: `Student status updated: ${updatedStudent.studentName} -> ${status}`,
    entityId: updatedStudent._id,
  });

  return sanitizeStudent(updatedStudent, lookups);
};

export const deleteStudent = async ({ actor, id }) => {
  ensureMongoMode();

  const student = await Student.findOne({
    _id: id,
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
  }).lean();

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  await Student.updateOne(
    { _id: id },
    {
      $set: {
        isDeleted: true,
        status: STUDENT_STATUS.INACTIVE,
        updatedBy: actor._id,
      },
    },
  );

  await addActivityLog({
    actor,
    action: "STUDENT_DELETED",
    message: `Student deleted: ${student.studentName} (${student.scholarNumber})`,
    entityId: student._id,
  });

  return { deleted: true };
};

export const bulkUpdateStudentStatus = async ({
  actor,
  studentIds,
  status,
}) => {
  ensureMongoMode();

  const uniqueIds = [...new Set(studentIds)];

  const result = await Student.updateMany(
    {
      _id: { $in: uniqueIds },
      tenantId: actor.tenantId,
      branchId: actor.branchId,
      isDeleted: false,
    },
    {
      $set: {
        status,
        updatedBy: actor._id,
      },
    },
  );

  await addActivityLog({
    actor,
    action: "STUDENT_BULK_STATUS_UPDATED",
    message: `Bulk student status update: ${result.modifiedCount} students -> ${status}`,
    entityId: null,
  });

  return {
    updatedCount: result.modifiedCount,
    notFoundIds: [],
  };
};

export const bulkDeleteStudents = async ({ actor, studentIds }) => {
  ensureMongoMode();

  const uniqueIds = [...new Set(studentIds)];

  const result = await Student.updateMany(
    {
      _id: { $in: uniqueIds },
      tenantId: actor.tenantId,
      branchId: actor.branchId,
      isDeleted: false,
    },
    {
      $set: {
        isDeleted: true,
        status: STUDENT_STATUS.INACTIVE,
        updatedBy: actor._id,
      },
    },
  );

  await addActivityLog({
    actor,
    action: "STUDENT_BULK_DELETED",
    message: `Bulk student delete: ${result.modifiedCount} students`,
    entityId: null,
  });

  return {
    deletedCount: result.modifiedCount,
    notFoundIds: [],
  };
};
