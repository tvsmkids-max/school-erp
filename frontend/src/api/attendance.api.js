import { axiosClient } from "./axiosClient.js";

export const getDailyAttendanceApi = (params = {}) => {
  return axiosClient.get("/attendance/daily", { params });
};

export const markAttendanceApi = (payload) => {
  return axiosClient.post("/attendance/mark", payload);
};

export const getStudentAttendanceSummaryApi = (params = {}) => {
  return axiosClient.get("/attendance/student-summary", { params });
};

export const getAttendanceAnalyticsApi = (params = {}) => {
  return axiosClient.get("/attendance/analytics", { params });
};