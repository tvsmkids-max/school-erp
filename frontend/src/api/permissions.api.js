import { axiosClient } from "./axiosClient.js";

export const listPermissionsApi = () => {
  return axiosClient.get("/permissions");
};

export const listGroupedPermissionsApi = () => {
  return axiosClient.get("/permissions/grouped");
};

export const myPermissionsApi = () => {
  return axiosClient.get("/permissions/me");
};
