import { axiosClient } from "./axiosClient.js";

export const listClassesApi = (params = {}) => {
  return axiosClient.get("/classes", { params });
};

export const createClassApi = (payload) => {
  return axiosClient.post("/classes", payload);
};

export const updateClassApi = ({ id, payload }) => {
  return axiosClient.patch(`/classes/${id}`, payload);
};

export const disableClassApi = (id) => {
  return axiosClient.patch(`/classes/${id}/disable`);
};

export const deleteClassApi = (id) => {
  return axiosClient.delete(`/classes/${id}`);
};
