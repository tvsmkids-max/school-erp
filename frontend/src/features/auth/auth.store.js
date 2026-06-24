const ACCESS_TOKEN_KEY = "erp_access_token";
const USER_KEY = "erp_user";

export const authStore = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  clearAccessToken() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  getUser() {
    const rawUser = localStorage.getItem(USER_KEY);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser);
    } catch (error) {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearUser() {
    localStorage.removeItem(USER_KEY);
  },

  clearAuth() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  hasPermission(permissionKey) {
    const user = this.getUser();
    return Array.isArray(user?.permissions) && user.permissions.includes(permissionKey);
  },
};
