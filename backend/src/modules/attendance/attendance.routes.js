import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

import {
  dailyAttendanceValidation,
  markAttendanceValidation,
  studentAttendanceSummaryValidation,
} from "./attendance.validation.js";

import { attendanceAnalyticsValidation } from "./attendanceReport.validation.js";

import {
  getDailyAttendanceController,
  getStudentAttendanceSummaryController,
  markAttendanceController,
} from "./attendance.controller.js";

import { getAttendanceAnalyticsController } from "./attendanceReport.controller.js";

const router = Router();

router.use(authenticate);

router.get(
  "/daily",
  authorize("attendance.view"),
  validate(dailyAttendanceValidation),
  getDailyAttendanceController
);

router.post(
  "/mark",
  authorize("attendance.mark"),
  validate(markAttendanceValidation),
  markAttendanceController
);

router.get(
  "/analytics",
  authorize("attendance.view"),
  validate(attendanceAnalyticsValidation),
  getAttendanceAnalyticsController
);

router.get(
  "/student-summary",
  authorize("attendance.view"),
  validate(studentAttendanceSummaryValidation),
  getStudentAttendanceSummaryController
);

export default router;