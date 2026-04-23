import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { UserRole, type LoginRequest, type TokenPair } from "@fdcdf/shared";
import { api, setAccessToken } from "@/composables/useApi";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

function decodeJwtPayload(token: string): AuthUser {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  const payload = JSON.parse(json);
  // Backend JWT payload uses { id, email, role }
  return {
    id: payload.id,
    email: payload.email,
    role: payload.role as UserRole,
  };
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<AuthUser | null>(null);
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value);

  const hasRole = (...roles: UserRole[]) =>
    !!user.value && roles.includes(user.value.role);

  const canViewAlerts = computed(() => hasRole(UserRole.ADMIN, UserRole.INVESTIGATOR));
  const canUseEvidence = computed(() => hasRole(UserRole.ADMIN, UserRole.INVESTIGATOR));

  function setTokens(tokens: TokenPair) {
    accessToken.value = tokens.accessToken;
    refreshToken.value = tokens.refreshToken;
    user.value = decodeJwtPayload(tokens.accessToken);

    setAccessToken(tokens.accessToken);
    localStorage.setItem("fdcdf_access_token", tokens.accessToken);
    localStorage.setItem("fdcdf_refresh_token", tokens.refreshToken);
  }

  function clearTokens() {
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;

    setAccessToken(null);
    localStorage.removeItem("fdcdf_access_token");
    localStorage.removeItem("fdcdf_refresh_token");
  }

  async function login(credentials: LoginRequest): Promise<void> {
    const response = await api.post<TokenPair>("/api/v1/auth/login", credentials);
    setTokens(response.data);
  }

  async function refresh(): Promise<boolean> {
    const storedRefresh = localStorage.getItem("fdcdf_refresh_token");
    if (!storedRefresh) return false;

    try {
      const response = await api.post<TokenPair>("/api/v1/auth/refresh", {
        refreshToken: storedRefresh,
      });
      setTokens(response.data);
      return true;
    } catch {
      clearTokens();
      return false;
    }
  }

  function logout() {
    clearTokens();
  }

  /** Attempt to restore session from stored refresh token on app init */
  async function initialize(): Promise<void> {
    const storedAccess = localStorage.getItem("fdcdf_access_token");
    if (storedAccess) {
      try {
        accessToken.value = storedAccess;
        user.value = decodeJwtPayload(storedAccess);
        setAccessToken(storedAccess);
      } catch {
        clearTokens();
      }
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    canViewAlerts,
    canUseEvidence,
    login,
    refresh,
    logout,
    initialize,
  };
});
