import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  headers: { "Content-Type": "application/json" },
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Request interceptor: attach Bearer token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = accessToken || localStorage.getItem("fdcdf_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: unwrap { success, data } envelope and handle 401
api.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === "object" && "success" in body && body.success) {
      response.data = body.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // If 401 and not already a refresh request, attempt token refresh
    if (
      error.response?.status === 401 &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !(originalRequest as Record<string, unknown>)._retried
    ) {
      (originalRequest as Record<string, unknown>)._retried = true;

      const refreshToken = localStorage.getItem("fdcdf_refresh_token");
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || ""}/api/v1/auth/refresh`,
            { refreshToken }
          );

          const data = refreshResponse.data?.data ?? refreshResponse.data;
          setAccessToken(data.accessToken);
          localStorage.setItem("fdcdf_access_token", data.accessToken);
          localStorage.setItem("fdcdf_refresh_token", data.refreshToken);

          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          // Refresh failed -- clear tokens and redirect to login
          setAccessToken(null);
          localStorage.removeItem("fdcdf_access_token");
          localStorage.removeItem("fdcdf_refresh_token");
          window.location.href = "/login";
          return Promise.reject(error);
        }
      }
    }

    return Promise.reject(error);
  }
);

export { api };
