import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getDailyAttendance,
  getStudentAttendanceSummary,
  markAttendance,
} from "./attendance.service.js";

export const getDailyAttendanceController = asyncHandler(async (req, res) => {
  const result = await getDailyAttendance({
    actor: req.user,
    query: req.validated.query,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result.rows, "Daily attendance loaded", result.summary));
});

export const markAttendanceController = asyncHandler(async (req, res) => {
  const result = await markAttendance({
    actor: req.user,
    payload: req.validated.body,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Attendance marked successfully"));
});

export const getStudentAttendanceSummaryController = asyncHandler(async (req, res) => {
  const result = await getStudentAttendanceSummary({
    actor: req.user,
    query: req.validated.query,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Student attendance summary loaded"));
});
