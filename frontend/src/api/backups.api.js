import { axiosClient } from "./axiosClient.js";

export const createManualBackupApi = () => {
  return axiosClient.post("/backups/manual");
};

export const listBackupHistoryApi = () => {
  return axiosClient.get("/backups/history");
};

export const downloadCurrentLocalDbApi = () => {
  return axiosClient.get("/backups/download-current", {
    responseType: "blob",
  });
};

export const downloadBackupApi = (fileName) => {
  return axiosClient.get(`/backups/download/${fileName}`, {
    responseType: "blob",
  });
};

export const restoreBackupApi = (fileName) => {
  return axiosClient.post(`/backups/restore/${fileName}`);
};

export const downloadBlob = ({ blob, fileName }) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
};
