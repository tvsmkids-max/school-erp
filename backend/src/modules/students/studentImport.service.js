import XLSX from "xlsx";
import { STUDENT_STATUS } from "../../constants/studentStatus.js";
import {
  AcademicSession,
  ActivityLog,
  ClassModel,
  Section,
  Student,
  StudentImportBatch,
} from "../../models/nativeModels.js";
import { ApiError } from "../../utils/ApiError.js";
import { createId } from "../../utils/id.js";

const now = () => new Date().toISOString();

export const STUDENT_IMPORT_COLUMNS = [
  "scholarNumber",
  "studentName",
  "gender",
  "dob",
  "mobileNumber",
  "classCode",
  "sectionCode",
  "rollNumber",
  "admissionDate",
  "academicSessionName",
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

const requiredColumns = [
  "scholarNumber",
  "studentName",
  "gender",
  "classCode",
  "admissionDate",
  "academicSessionName",
];

const validStatuses = Object.values(STUDENT_STATUS);
const validGenders = ["male", "female", "other"];

const normalize = (value) => String(value ?? "").trim();
const normalizeLower = (value) => normalize(value).toLowerCase();
const normalizeUpper = (value) => normalize(value).toUpperCase();

const addActivityLog = async ({ actor, action, message, entityId = null }) => {
  await ActivityLog.create({
    _id: createId("log"),
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    userId: actor._id,
    module: "Student Import",
    action,
    message,
    entityType: "StudentImportBatch",
    entityId,
    ipAddress: null,
    userAgent: null,
    createdAt: now(),
  });
};

export const createStudentImportTemplateBuffer = () => {
  const sampleRow = {
    scholarNumber: "SCH001",
    studentName: "Demo Student",
    gender: "male",
    dob: "2015-01-15",
    mobileNumber: "",
    classCode: "CLASS_1",
    sectionCode: "",
    rollNumber: "1",
    admissionDate: "2026-06-01",
    academicSessionName: "2026-27",
    aadhaarNumber: "",
    samagraId: "",
    penNumber: "",
    fatherName: "Demo Father",
    motherName: "Demo Mother",
    guardianName: "",
    parentMobile: "9876543210",
    address: "Demo Address",
    city: "Demo City",
    state: "Madhya Pradesh",
    pin: "462001",
    photoUrl: "",
    category: "General",
    religion: "Hindu",
    bloodGroup: "O+",
    status: "active",
  };

  const workbook = XLSX.utils.book_new();

  const worksheet = XLSX.utils.json_to_sheet([sampleRow], {
    header: STUDENT_IMPORT_COLUMNS,
  });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });
};

const parseExcelBuffer = (buffer) => {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: false,
  });

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new ApiError(400, "Excel file has no sheets");
  }

  const worksheet = workbook.Sheets[sheetName];

  return XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
  });
};

const validateMobile = (value, field, errors) => {
  const text = normalize(value);

  if (text && !/^[6-9]\d{9}$/.test(text)) {
    errors.push(`${field} must be valid 10-digit Indian mobile`);
  }
};

const findClass = async (actor, classCode) => {
  return ClassModel.findOne({
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    code: normalizeUpper(classCode),
    isDeleted: false,
  }).lean();
};

const findSection = async (actor, classId, sectionCode) => {
  if (!sectionCode) return null;

  return Section.findOne({
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    classId,
    code: normalizeUpper(sectionCode),
    isDeleted: false,
  }).lean();
};

const findSession = async (actor, academicSessionName) => {
  return AcademicSession.findOne({
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    name: normalize(academicSessionName),
    isDeleted: false,
  }).lean();
};

const isDuplicateScholarInDb = async (actor, scholarNumber) => {
  const existing = await Student.findOne({
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    scholarNumber: normalize(scholarNumber),
    isDeleted: false,
  }).lean();

  return Boolean(existing);
};

const validateRow = async ({ actor, row, rowNumber, scholarNumbersInFile }) => {
  const errors = [];

  for (const column of requiredColumns) {
    if (!normalize(row[column])) {
      errors.push(`${column} is required`);
    }
  }

  const scholarNumber = normalize(row.scholarNumber);

  if (scholarNumber) {
    const normalizedScholarNumber = normalizeLower(scholarNumber);

    if (scholarNumbersInFile.has(normalizedScholarNumber)) {
      errors.push("Duplicate scholarNumber inside Excel file");
    }

    scholarNumbersInFile.add(normalizedScholarNumber);

    if (await isDuplicateScholarInDb(actor, scholarNumber)) {
      errors.push("Scholar number already exists in system");
    }
  }

  const gender = normalizeLower(row.gender);

  if (gender && !validGenders.includes(gender)) {
    errors.push("gender must be male, female or other");
  }

  const status = normalizeLower(row.status) || STUDENT_STATUS.ACTIVE;

  if (status && !validStatuses.includes(status)) {
    errors.push(`status must be one of: ${validStatuses.join(", ")}`);
  }

  validateMobile(row.mobileNumber, "mobileNumber", errors);
  validateMobile(row.parentMobile, "parentMobile", errors);

  const aadhaar = normalize(row.aadhaarNumber);

  if (aadhaar && !/^\d{12}$/.test(aadhaar)) {
    errors.push("aadhaarNumber must be 12 digits");
  }

  const pin = normalize(row.pin);

  if (pin && !/^\d{6}$/.test(pin)) {
    errors.push("pin must be 6 digits");
  }

  const classRecord = await findClass(actor, row.classCode);

  if (!classRecord) {
    errors.push(`classCode not found: ${row.classCode}`);
  }

  let sectionRecord = null;

  if (classRecord && normalize(row.sectionCode)) {
    sectionRecord = await findSection(actor, classRecord._id, row.sectionCode);

    if (!sectionRecord) {
      errors.push(
        `sectionCode not found for class ${row.classCode}: ${row.sectionCode}`,
      );
    }
  }

  const sessionRecord = await findSession(actor, row.academicSessionName);

  if (!sessionRecord) {
    errors.push(`academicSessionName not found: ${row.academicSessionName}`);
  }

  const normalized = {
    scholarNumber,
    studentName: normalize(row.studentName),
    gender: gender || "male",
    dob: normalize(row.dob),
    mobileNumber: normalize(row.mobileNumber),

    classId: classRecord?._id || "",
    className: classRecord?.displayName || classRecord?.name || "",
    sectionId: sectionRecord?._id || "",
    sectionName: sectionRecord?.name || "",

    rollNumber: normalize(row.rollNumber),
    admissionDate: normalize(row.admissionDate),

    academicSessionId: sessionRecord?._id || "",
    academicSessionName: sessionRecord?.name || "",

    aadhaarNumber: normalize(row.aadhaarNumber),
    samagraId: normalize(row.samagraId),
    penNumber: normalize(row.penNumber),

    fatherName: normalize(row.fatherName),
    motherName: normalize(row.motherName),
    guardianName: normalize(row.guardianName),
    parentMobile: normalize(row.parentMobile),

    address: normalize(row.address),
    city: normalize(row.city),
    state: normalize(row.state) || "Madhya Pradesh",
    pin: normalize(row.pin),

    photoUrl: normalize(row.photoUrl),
    category: normalize(row.category),
    religion: normalize(row.religion),
    bloodGroup: normalize(row.bloodGroup),

    status,
  };

  return {
    rowNumber,
    raw: row,
    normalized,
    isValid: errors.length === 0,
    errors,
  };
};

export const previewStudentImport = async ({ actor, file }) => {
  if (!file) {
    throw new ApiError(400, "Excel file is required");
  }

  const rows = parseExcelBuffer(file.buffer);

  if (rows.length === 0) {
    throw new ApiError(400, "Excel file has no student rows");
  }

  const scholarNumbersInFile = new Set();
  const previewRows = [];

  for (let index = 0; index < rows.length; index += 1) {
    const rowResult = await validateRow({
      actor,
      row: rows[index],
      rowNumber: index + 2,
      scholarNumbersInFile,
    });

    previewRows.push(rowResult);
  }

  const validCount = previewRows.filter((row) => row.isValid).length;
  const invalidCount = previewRows.length - validCount;

  const batch = await StudentImportBatch.create({
    _id: createId("studentImport"),
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    fileName: file.originalname,
    status: "preview",
    rows: previewRows,
    totalRows: previewRows.length,
    validCount,
    invalidCount,
    importedCount: 0,
    duplicateCount: previewRows.filter((row) =>
      row.errors.some((error) => error.toLowerCase().includes("duplicate")),
    ).length,
    importedStudentIds: [],
    skippedAtCommit: [],
    createdBy: actor._id,
    committedBy: null,
    committedAt: null,
    rollbackBy: null,
    rollbackAt: null,
    rollbackCount: 0,
  });

  await addActivityLog({
    actor,
    action: "STUDENT_IMPORT_PREVIEW_CREATED",
    message: `Student import preview created: ${validCount} valid, ${invalidCount} invalid`,
    entityId: batch._id,
  });

  return batch.toObject();
};

export const commitStudentImport = async ({ actor, batchId }) => {
  const batch = await StudentImportBatch.findOne({
    _id: batchId,
    tenantId: actor.tenantId,
    branchId: actor.branchId,
  }).lean();

  if (!batch) {
    throw new ApiError(404, "Import batch not found");
  }

  if (batch.status === "imported") {
    throw new ApiError(400, "Import batch already committed");
  }

  if (batch.status === "rolled_back") {
    throw new ApiError(400, "Rolled back batch cannot be committed again");
  }

  const importedStudentIds = [];
  const skippedRows = [];

  for (const row of batch.rows || []) {
    if (!row.isValid) {
      skippedRows.push({
        rowNumber: row.rowNumber,
        reason: "Row invalid in preview",
      });
      continue;
    }

    if (await isDuplicateScholarInDb(actor, row.normalized.scholarNumber)) {
      skippedRows.push({
        rowNumber: row.rowNumber,
        reason: "Scholar number already exists at commit",
      });
      continue;
    }

    const student = await Student.create({
      _id: createId("student"),
      tenantId: actor.tenantId,
      branchId: actor.branchId,
      ...row.normalized,
      isDeleted: false,
      createdBy: actor._id,
      updatedBy: actor._id,
    });

    importedStudentIds.push(student._id);
  }

  await StudentImportBatch.updateOne(
    { _id: batch._id },
    {
      $set: {
        status: "imported",
        importedCount: importedStudentIds.length,
        importedStudentIds,
        skippedAtCommit: skippedRows,
        committedBy: actor._id,
        committedAt: now(),
      },
    },
  );

  const updatedBatch = await StudentImportBatch.findById(batch._id).lean();

  await addActivityLog({
    actor,
    action: "STUDENT_IMPORT_COMMITTED",
    message: `Student import committed: ${importedStudentIds.length} imported, ${skippedRows.length} skipped`,
    entityId: batch._id,
  });

  return updatedBatch;
};

export const rollbackStudentImport = async ({ actor, batchId }) => {
  const batch = await StudentImportBatch.findOne({
    _id: batchId,
    tenantId: actor.tenantId,
    branchId: actor.branchId,
  }).lean();

  if (!batch) {
    throw new ApiError(404, "Import batch not found");
  }

  if (batch.status !== "imported") {
    throw new ApiError(400, "Only imported batches can be rolled back");
  }

  const importedStudentIds = batch.importedStudentIds || [];

  if (importedStudentIds.length === 0) {
    throw new ApiError(400, "No imported students found in this batch");
  }

  const result = await Student.updateMany(
    {
      _id: { $in: importedStudentIds },
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

  await StudentImportBatch.updateOne(
    { _id: batch._id },
    {
      $set: {
        status: "rolled_back",
        rollbackBy: actor._id,
        rollbackAt: now(),
        rollbackCount: result.modifiedCount,
      },
    },
  );

  const updatedBatch = await StudentImportBatch.findById(batch._id).lean();

  await addActivityLog({
    actor,
    action: "STUDENT_IMPORT_ROLLBACK",
    message: `Student import rollback: ${result.modifiedCount} students removed`,
    entityId: batch._id,
  });

  return updatedBatch;
};

export const listStudentImportBatches = async ({ actor, query }) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const skip = (page - 1) * limit;

  const mongoQuery = {
    tenantId: actor.tenantId,
    branchId: actor.branchId,
  };

  const [batches, total] = await Promise.all([
    StudentImportBatch.find(mongoQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    StudentImportBatch.countDocuments(mongoQuery),
  ]);

  return {
    batches: batches.map((batch) => ({
      _id: batch._id,
      fileName: batch.fileName,
      status: batch.status,
      totalRows: batch.totalRows,
      validCount: batch.validCount,
      invalidCount: batch.invalidCount,
      importedCount: batch.importedCount,
      duplicateCount: batch.duplicateCount,
      rollbackCount: batch.rollbackCount || 0,
      createdAt: batch.createdAt,
      committedAt: batch.committedAt,
      rollbackAt: batch.rollbackAt,
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
