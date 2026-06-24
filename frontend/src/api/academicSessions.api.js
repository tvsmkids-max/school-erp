import { axiosClient } from "./axiosClient.js";

export const listAcademicSessionsApi = (params = {}) => {
  return axiosClient.get("/academic-sessions", { params });
};

export const getCurrentAcademicSessionApi = () => {
  return axiosClient.get("/academic-sessions/current");
};

export const createAcademicSessionApi = (payload) => {
  return axiosClient.post("/academic-sessions", payload);
};

export const updateAcademicSessionApi = ({ id, payload }) => {
  return axiosClient.patch(`/academic-sessions/${id}`, payload);
};

export const setCurrentAcademicSessionApi = (id) => {
  return axiosClient.patch(`/academic-sessions/${id}/set-current`);
};

export const disableAcademicSessionApi = (id) => {
  return axiosClient.patch(`/academic-sessions/${id}/disable`);
};

export const deleteAcademicSessionApi = (id) => {
  return axiosClient.delete(`/academic-sessions/${id}`);
};
