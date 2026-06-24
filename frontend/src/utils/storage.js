export const storage = {
  getAccessToken() {
    return localStorage.getItem("erp_access_token");
  },

  setAccessToken(token) {
    localStorage.setItem("erp_access_token", token);
  },

  clearAccessToken() {
    localStorage.removeItem("erp_access_token");
  },
};
