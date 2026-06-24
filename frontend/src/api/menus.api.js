import { axiosClient } from "./axiosClient.js";

export const myMenuApi = () => {
  return axiosClient.get("/menus/me");
};
