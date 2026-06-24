import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getAttendanceAnalytics } from "./attendanceReport.service.js";

export const getAttendanceAnalyticsController = asyncHandler(async (req, res) => {
  const analytics = await getAttendanceAnalytics({
    actor: req.user,
    query: req.validated.query,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, analytics, "Attendance analytics loaded"));
});