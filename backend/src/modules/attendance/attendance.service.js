import { env } from "../../config/env.js";
import { ATTENDANCE_STATUS } from "../../constants/attendanceStatus.js";
import { STUDENT_STATUS } from "../../constants/studentStatus.js";
import { ApiError } from "../../utils/ApiError.js";
import { createId } from "../../utils/id.js";
import {
  AcademicSession,
  ActivityLog,
  AttendanceRecord,
  ClassModel,
  Section,
  Student,
} from "../../models/nativeModels.js";

const now = () => new Date().toISOString();

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const ensureMongoMode = () => {
  if (env.dbMode !== "mongodb") {
    throw new ApiError(
      500,
      "Native attendance service requires DB_MODE=mongodb. Switch backend .env to DB_MODE=mongodb.",
    );
  }
};

const addActivityLog = async ({ actor, action, message, entityId = null }) => {
  await ActivityLog.create({
    _id: createId("log"),
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    userId: actor._id,
    module: "Attendance",
    action,
    message,
    entityType: "Attendance",
    entityId,
    ipAddress: null,
    userAgent: null,
    createdAt: now(),
  });
};

const validateBaseRefs = async (
  actor,
  { academicSessionId, classId, sectionId },
) => {
  const session = await AcademicSession.findOne({
    _id: academicSessionId,
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
  }).lean();

  if (!session) {
    throw new ApiError(400, "Invalid academic session selected");
  }

  const classRecord = await ClassModel.findOne({
    _id: classId,
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
  }).lean();

  if (!classRecord) {
    throw new ApiError(400, "Invalid class selected");
  }

  let section = null;

  if (sectionId) {
    section = await Section.findOne({
      _id: sectionId,
      classId,
      tenantId: actor.tenantId,
      branchId: actor.branchId,
      isDeleted: false,
    }).lean();

    if (!section) {
      throw new ApiError(400, "Invalid section selected for class");
    }
  }

  return { session, classRecord, section };
};

const getStudentLookups = async (student) => {
  const [classRecord, sectionRecord] = await Promise.all([
    ClassModel.findById(student.classId).lean(),
    student.sectionId ? Section.findById(student.sectionId).lean() : null,
  ]);

  return { classRecord, sectionRecord };
};

export const getDailyAttendance = async ({ actor, query }) => {
  ensureMongoMode();

  await validateBaseRefs(actor, query);

  const studentQuery = {
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
    status: STUDENT_STATUS.ACTIVE,
    academicSessionId: query.academicSessionId,
    classId: query.classId,
  };

  if (query.sectionId) {
    studentQuery.sectionId = query.sectionId;
  }

  if (query.search) {
    const search = normalizeText(query.search);
    studentQuery.$or = [
      { scholarNumber: { $regex: search, $options: "i" } },
      { studentName: { $regex: search, $options: "i" } },
      { rollNumber: { $regex: search, $options: "i" } },
      { fatherName: { $regex: search, $options: "i" } },
      { parentMobile: { $regex: search, $options: "i" } },
    ];
  }

  const students = await Student.find(studentQuery)
    .sort({ rollNumber: 1, studentName: 1 })
    .lean();

  const studentIds = students.map((student) => student._id);

  const attendanceRecords = await AttendanceRecord.find({
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    date: query.date,
    academicSessionId: query.academicSessionId,
    studentId: { $in: studentIds },
    isDeleted: false,
  }).lean();

  const attendanceByStudentId = new Map(
    attendanceRecords.map((record) => [record.studentId, record]),
  );

  const rows = [];

  for (const student of students) {
    const attendance = attendanceByStudentId.get(student._id);
    const lookups = await getStudentLookups(student);

    rows.push({
      studentId: student._id,
      scholarNumber: student.scholarNumber,
      studentName: student.studentName,
      gender: student.gender,
      classId: student.classId,
      className:
        lookups.classRecord?.displayName || lookups.classRecord?.name || null,
      sectionId: student.sectionId || "",
      sectionName: lookups.sectionRecord?.name || "",
      rollNumber: student.rollNumber || "",
      fatherName: student.fatherName || "",
      parentMobile: student.parentMobile || "",
      attendanceId: attendance?._id || null,
      attendanceStatus: attendance?.status || "unmarked",
      remarks: attendance?.remarks || "",
    });
  }

  const filteredRows =
    query.status && query.status !== "all"
      ? rows.filter((row) => row.attendanceStatus === query.status)
      : rows;

  const summary = {
    totalStudents: rows.length,
    present: rows.filter(
      (row) => row.attendanceStatus === ATTENDANCE_STATUS.PRESENT,
    ).length,
    absent: rows.filter(
      (row) => row.attendanceStatus === ATTENDANCE_STATUS.ABSENT,
    ).length,
    leave: rows.filter(
      (row) => row.attendanceStatus === ATTENDANCE_STATUS.LEAVE,
    ).length,
    unmarked: rows.filter((row) => row.attendanceStatus === "unmarked").length,
  };

  return { rows: filteredRows, summary };
};

export const markAttendance = async ({ actor, payload }) => {
  ensureMongoMode();

  await validateBaseRefs(actor, payload);

  let createdCount = 0;
  let updatedCount = 0;
  const errors = [];

  for (const item of payload.records) {
    const student = await Student.findOne({
      _id: item.studentId,
      tenantId: actor.tenantId,
      branchId: actor.branchId,
      isDeleted: false,
      academicSessionId: payload.academicSessionId,
      classId: payload.classId,
    }).lean();

    if (!student) {
      errors.push({
        studentId: item.studentId,
        message: "Student not found in selected class/session",
      });
      continue;
    }

    if (payload.sectionId && student.sectionId !== payload.sectionId) {
      errors.push({
        studentId: item.studentId,
        message: "Student not found in selected section",
      });
      continue;
    }

    const existing = await AttendanceRecord.findOne({
      tenantId: actor.tenantId,
      branchId: actor.branchId,
      date: payload.date,
      academicSessionId: payload.academicSessionId,
      studentId: item.studentId,
      isDeleted: false,
    }).lean();

    if (existing) {
      await AttendanceRecord.updateOne(
        { _id: existing._id },
        {
          $set: {
            status: item.status,
            remarks: item.remarks || "",
            classId: payload.classId,
            sectionId: student.sectionId || "",
            updatedBy: actor._id,
          },
        },
      );

      updatedCount += 1;
    } else {
      await AttendanceRecord.create({
        _id: createId("attendance"),
        tenantId: actor.tenantId,
        branchId: actor.branchId,
        academicSessionId: payload.academicSessionId,
        classId: payload.classId,
        sectionId: student.sectionId || "",
        studentId: item.studentId,
        date: payload.date,
        status: item.status,
        remarks: item.remarks || "",
        isDeleted: false,
        markedBy: actor._id,
        updatedBy: actor._id,
      });

      createdCount += 1;
    }
  }

  await addActivityLog({
    actor,
    action: "ATTENDANCE_MARKED",
    message: `Attendance marked for ${payload.date}. Created: ${createdCount}, Updated: ${updatedCount}`,
  });

  return {
    createdCount,
    updatedCount,
    errors,
  };
};

export const getStudentAttendanceSummary = async ({ actor, query }) => {
  ensureMongoMode();

  const student = await Student.findOne({
    _id: query.studentId,
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
  }).lean();

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const records = await AttendanceRecord.find({
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    studentId: query.studentId,
    isDeleted: false,
    date: {
      $gte: query.startDate,
      $lte: query.endDate,
    },
  })
    .sort({ date: 1 })
    .lean();

  const summary = {
    studentId: student._id,
    scholarNumber: student.scholarNumber,
    studentName: student.studentName,
    totalMarkedDays: records.length,
    present: records.filter(
      (record) => record.status === ATTENDANCE_STATUS.PRESENT,
    ).length,
    absent: records.filter(
      (record) => record.status === ATTENDANCE_STATUS.ABSENT,
    ).length,
    leave: records.filter((record) => record.status === ATTENDANCE_STATUS.LEAVE)
      .length,
  };

  summary.attendancePercentage =
    summary.totalMarkedDays > 0
      ? Number(((summary.present / summary.totalMarkedDays) * 100).toFixed(2))
      : 0;

  return { summary, records };
};
