import { axiosClient } from "./axiosClient.js";

export const listUsersApi = (params = {}) => {
  return axiosClient.get("/users", { params });
};

export const createUserApi = (payload) => {
  return axiosClient.post("/users", payload);
};

export const updateUserApi = ({ id, payload }) => {
  return axiosClient.patch(`/users/${id}`, payload);
};

export const disableUserApi = (id) => {
  return axiosClient.patch(`/users/${id}/disable`);
};

export const enableUserApi = (id) => {
  return axiosClient.patch(`/users/${id}/enable`);
};

export const deleteUserApi = (id) => {
  return axiosClient.delete(`/users/${id}`);
};

export const resetUserPasswordApi = ({ id, newPassword }) => {
  return axiosClient.patch(`/users/${id}/reset-password`, { newPassword });
};

export const listUserSessionsApi = (id) => {
  return axiosClient.get(`/users/${id}/sessions`);
};

export const forceLogoutUserApi = (id) => {
  return axiosClient.post(`/users/${id}/force-logout`);
};
