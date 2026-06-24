import { axiosClient } from "./axiosClient.js";

export const listSectionsApi = (params = {}) => {
  return axiosClient.get("/sections", { params });
};

export const createSectionApi = (payload) => {
  return axiosClient.post("/sections", payload);
};

export const updateSectionApi = ({ id, payload }) => {
  return axiosClient.patch(`/sections/${id}`, payload);
};

export const disableSectionApi = (id) => {
  return axiosClient.patch(`/sections/${id}/disable`);
};

export const deleteSectionApi = (id) => {
  return axiosClient.delete(`/sections/${id}`);
};
