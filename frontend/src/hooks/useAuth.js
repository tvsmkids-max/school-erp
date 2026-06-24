import { useQuery } from "@tanstack/react-query";
import { meApi } from "../api/auth.api.js";
import { authStore } from "../features/auth/auth.store.js";

export const useAuth = () => {
  const token = authStore.getAccessToken();

  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: meApi,
    enabled: Boolean(token),
    retry: false,
    staleTime: 60 * 1000,
  });

  const apiUser = query.data?.data || null;
  const storedUser = authStore.getUser();
  const user = apiUser || storedUser;

  if (apiUser) {
    authStore.setUser(apiUser);
  }

  return {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    isLoading: Boolean(token) && query.isLoading,
    isError: query.isError,
    error: query.error,
    refetchUser: query.refetch,

    hasPermission(permissionKey) {
      return Array.isArray(user?.permissions) && user.permissions.includes(permissionKey);
    },
  };
};
