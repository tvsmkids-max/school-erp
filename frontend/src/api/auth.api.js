import { axiosClient } from "./axiosClient.js";

export const loginApi = (payload) => {
  return axiosClient.post("/auth/login", payload);
};

export const refreshApi = () => {
  return axiosClient.post("/auth/refresh");
};

export const meApi = () => {
  return axiosClient.get("/auth/me");
};

export const logoutApi = () => {
  return axiosClient.post("/auth/logout");
};

export const logoutAllApi = () => {
  return axiosClient.post("/auth/logout-all");
};

export const mySessionsApi = () => {
  return axiosClient.get("/auth/sessions");
};