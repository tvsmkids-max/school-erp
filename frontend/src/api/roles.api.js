import { axiosClient } from "./axiosClient.js";

export const listRolesApi = () => {
  return axiosClient.get("/roles");
};

export const getRoleApi = (id) => {
  return axiosClient.get(`/roles/${id}`);
};

export const updateRolePermissionsApi = ({ id, permissions }) => {
  return axiosClient.patch(`/roles/${id}/permissions`, { permissions });
};
