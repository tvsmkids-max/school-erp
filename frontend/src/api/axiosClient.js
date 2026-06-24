import axios from "axios";
import { authStore } from "../features/auth/auth.store.js";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;

const redirectToLogin = () => {
  authStore.clearAuth();

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

axiosClient.interceptors.request.use((config) => {
  const accessToken = authStore.getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url || "";

    const isAuthRoute =
      url.includes("/auth/login") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout");

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshClient.post("/auth/refresh");
        }

        const refreshResponse = await refreshPromise;
        refreshPromise = null;

        const newAccessToken = refreshResponse.data?.data?.accessToken;
        const user = refreshResponse.data?.data?.user;

        if (!newAccessToken) {
          redirectToLogin();

          return Promise.reject({
            message: "Session expired",
            status: 401,
            errors: [],
            raw: error,
          });
        }

        authStore.setAccessToken(newAccessToken);

        if (user) {
          authStore.setUser(user);
        }

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return axiosClient(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        redirectToLogin();

        return Promise.reject({
          message: "Session expired. Please login again.",
          status: 401,
          errors: [],
          raw: refreshError,
        });
      }
    }

    const message =
      error.response?.data?.message || error.message || "Something went wrong";

    return Promise.reject({
      message,
      status,
      errors: error.response?.data?.errors || [],
      raw: error,
    });
  }
);