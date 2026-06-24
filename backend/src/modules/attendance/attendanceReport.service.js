import { env } from "../../config/env.js";
import { ATTENDANCE_STATUS } from "../../constants/attendanceStatus.js";
import { STUDENT_STATUS } from "../../constants/studentStatus.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  AcademicSession,
  AttendanceRecord,
  ClassModel,
  Section,
  Student,
} from "../../models/nativeModels.js";

const toTime = (dateString) =>
  new Date(`${dateString}T00:00:00.000Z`).getTime();

const ensureMongoMode = () => {
  if (env.dbMode !== "mongodb") {
    throw new ApiError(
      500,
      "Native attendance analytics service requires DB_MODE=mongodb.",
    );
  }
};

const validateDateRange = (startDate, endDate) => {
  const start = toTime(startDate);
  const end = toTime(endDate);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    throw new ApiError(400, "Invalid date range");
  }

  if (start > end) {
    throw new ApiError(400, "Start date must be before or equal to end date");
  }
};

const getMaxConsecutiveAbsents = (records) => {
  const sortedRecords = [...records].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  let currentStreak = 0;
  let maxStreak = 0;

  for (const record of sortedRecords) {
    if (record.status === ATTENDANCE_STATUS.ABSENT) {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
};

export const getAttendanceAnalytics = async ({ actor, query }) => {
  ensureMongoMode();

  validateDateRange(query.startDate, query.endDate);

  const session = await AcademicSession.findOne({
    _id: query.academicSessionId,
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
  }).lean();

  if (!session) {
    throw new ApiError(400, "Invalid academic session selected");
  }

  const classRecord = await ClassModel.findOne({
    _id: query.classId,
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
  }).lean();

  if (!classRecord) {
    throw new ApiError(400, "Invalid class selected");
  }

  let sectionRecord = null;

  if (query.sectionId) {
    sectionRecord = await Section.findOne({
      _id: query.sectionId,
      classId: query.classId,
      tenantId: actor.tenantId,
      branchId: actor.branchId,
      isDeleted: false,
    }).lean();

    if (!sectionRecord) {
      throw new ApiError(400, "Invalid section selected");
    }
  }

  const studentQuery = {
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    isDeleted: false,
    academicSessionId: query.academicSessionId,
    classId: query.classId,
  };

  if (query.studentStatus && query.studentStatus !== "all") {
    studentQuery.status = query.studentStatus;
  } else if (!query.studentStatus) {
    studentQuery.status = STUDENT_STATUS.ACTIVE;
  }

  if (query.gender && query.gender !== "all") {
    studentQuery.gender = query.gender;
  }

  if (query.category) {
    studentQuery.category = {
      $regex: query.category,
      $options: "i",
    };
  }

  if (query.sectionId) {
    studentQuery.sectionId = query.sectionId;
  }

  const students = await Student.find(studentQuery)
    .sort({ studentName: 1 })
    .lean();

  const studentIds = students.map((student) => student._id);

  const recordsInRange = await AttendanceRecord.find({
    tenantId: actor.tenantId,
    branchId: actor.branchId,
    academicSessionId: query.academicSessionId,
    classId: query.classId,
    isDeleted: false,
    date: {
      $gte: query.startDate,
      $lte: query.endDate,
    },
    studentId: {
      $in: studentIds,
    },
    ...(query.sectionId ? { sectionId: query.sectionId } : {}),
  })
    .sort({ date: 1 })
    .lean();

  const sectionIds = [
    ...new Set(students.map((student) => student.sectionId).filter(Boolean)),
  ];

  const sections = await Section.find({
    _id: { $in: sectionIds },
  }).lean();

  const sectionMap = new Map(sections.map((section) => [section._id, section]));

  const recordsByStudentId = new Map();

  for (const record of recordsInRange) {
    if (!recordsByStudentId.has(record.studentId)) {
      recordsByStudentId.set(record.studentId, []);
    }

    recordsByStudentId.get(record.studentId).push(record);
  }

  const studentSummaries = students.map((student) => {
    const studentRecords = recordsByStudentId.get(student._id) || [];

    const present = studentRecords.filter(
      (record) => record.status === ATTENDANCE_STATUS.PRESENT,
    ).length;

    const absent = studentRecords.filter(
      (record) => record.status === ATTENDANCE_STATUS.ABSENT,
    ).length;

    const leave = studentRecords.filter(
      (record) => record.status === ATTENDANCE_STATUS.LEAVE,
    ).length;

    const totalMarkedDays = studentRecords.length;

    const attendancePercentage =
      totalMarkedDays > 0
        ? Number(((present / totalMarkedDays) * 100).toFixed(2))
        : 0;

    const maxConsecutiveAbsents = getMaxConsecutiveAbsents(studentRecords);
    const section = sectionMap.get(student.sectionId) || null;

    return {
      studentId: student._id,
      scholarNumber: student.scholarNumber,
      studentName: student.studentName,
      rollNumber: student.rollNumber || "",
      classId: student.classId,
      className: classRecord.displayName || classRecord.name,
      sectionId: student.sectionId || "",
      sectionName: section?.name || "",
      totalMarkedDays,
      present,
      absent,
      leave,
      attendancePercentage,
      maxConsecutiveAbsents,
      isLowAttendance:
        totalMarkedDays > 0 &&
        attendancePercentage < Number(query.lowAttendanceThreshold),
    };
  });

  const totalPresent = recordsInRange.filter(
    (record) => record.status === ATTENDANCE_STATUS.PRESENT,
  ).length;

  const totalAbsent = recordsInRange.filter(
    (record) => record.status === ATTENDANCE_STATUS.ABSENT,
  ).length;

  const totalLeave = recordsInRange.filter(
    (record) => record.status === ATTENDANCE_STATUS.LEAVE,
  ).length;

  const totalMarked = recordsInRange.length;

  return {
    filters: {
      startDate: query.startDate,
      endDate: query.endDate,
      academicSessionId: query.academicSessionId,
      academicSessionName: session.name,
      classId: query.classId,
      className: classRecord.displayName || classRecord.name,
      sectionId: query.sectionId || "",
      sectionName: sectionRecord?.name || "All Sections",
      gender: query.gender || "all",
      category: query.category || "",
      studentStatus: query.studentStatus || "active",
      lowAttendanceThreshold: Number(query.lowAttendanceThreshold),
    },

    summary: {
      totalStudents: students.length,
      totalMarked,
      present: totalPresent,
      absent: totalAbsent,
      leave: totalLeave,
      overallAttendancePercentage:
        totalMarked > 0
          ? Number(((totalPresent / totalMarked) * 100).toFixed(2))
          : 0,
      lowAttendanceCount: studentSummaries.filter(
        (student) => student.isLowAttendance,
      ).length,
      consecutiveAbsenteeCount: studentSummaries.filter(
        (student) => student.maxConsecutiveAbsents >= 3,
      ).length,
    },

    lowAttendanceStudents: studentSummaries
      .filter((student) => student.isLowAttendance)
      .sort((a, b) => a.attendancePercentage - b.attendancePercentage),

    consecutiveAbsentees: studentSummaries
      .filter((student) => student.maxConsecutiveAbsents >= 3)
      .sort((a, b) => b.maxConsecutiveAbsents - a.maxConsecutiveAbsents),

    studentSummaries: studentSummaries.sort((a, b) =>
      a.studentName.localeCompare(b.studentName),
    ),
  };
};
