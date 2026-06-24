import { axiosClient } from "./axiosClient.js";

export const getStudentFieldConfigApi = () => {
  return axiosClient.get("/student-field-config");
};

export const updateStudentFieldConfigApi = (fields) => {
  return axiosClient.patch("/student-field-config", { fields });
};

export const resetStudentFieldConfigApi = () => {
  return axiosClient.post("/student-field-config/reset-defaults");
};

export const getStudentFieldDefinitionsApi = () => {
  return axiosClient.get("/student-field-config/definitions");
};
