import { axiosClient } from "./axiosClient.js";

export const listStudentsApi = (params = {}) => {
  return axiosClient.get("/students", { params });
};

export const createStudentApi = (payload) => {
  return axiosClient.post("/students", payload);
};

export const getStudentApi = (id) => {
  return axiosClient.get(`/students/${id}`);
};

export const updateStudentApi = ({ id, payload }) => {
  return axiosClient.patch(`/students/${id}`, payload);
};

export const updateStudentStatusApi = ({ id, status }) => {
  return axiosClient.patch(`/students/${id}/status`, { status });
};

export const deleteStudentApi = (id) => {
  return axiosClient.delete(`/students/${id}`);
};

export const bulkUpdateStudentStatusApi = ({ studentIds, status }) => {
  return axiosClient.post("/students/bulk/status", { studentIds, status });
};

export const bulkDeleteStudentsApi = (studentIds) => {
  return axiosClient.post("/students/bulk/delete", { studentIds });
};

export const downloadStudentImportTemplateApi = () => {
  return axiosClient.get("/students/import/template", {
    responseType: "blob",
  });
};

export const previewStudentImportApi = (formData) => {
  return axiosClient.post("/students/import/preview", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const commitStudentImportApi = (batchId) => {
  return axiosClient.post(`/students/import/${batchId}/commit`);
};

export const rollbackStudentImportApi = (batchId) => {
  return axiosClient.post(`/students/import/${batchId}/rollback`);
};
export const listStudentImportHistoryApi = (params = {}) => {
  return axiosClient.get("/students/import/history", { params });
};
