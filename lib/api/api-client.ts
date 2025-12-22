import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import toast from "react-hot-toast";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Attach access token to each request (except login/register endpoints)
apiClient.interceptors.request.use((config) => {
  // Don't attach token for login/register endpoints
  const isAuthEndpoint = config.url?.includes('/login') || 
                        config.url?.includes('/register') ||
                        config.url?.includes('/refresh-token');
  
  if (!isAuthEndpoint) {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    // Don't try to refresh token on login/signup/auth endpoints
    const isAuthEndpoint = originalRequest?.url?.includes('/login') || 
                          originalRequest?.url?.includes('/register') ||
                          originalRequest?.url?.includes('/refresh-token') ||
                          originalRequest?.url?.includes('/auth/google') ||
                          originalRequest?.url?.includes('/auth/facebook');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        // Use hardcoded localhost for refresh token in development, otherwise use env/production
        const refreshUrl =
          process.env.NODE_ENV === "development"
            ? "http://localhost:5000/api/users/refresh-token"
            : `${process.env.NEXT_PUBLIC_API_URL}/users/refresh-token`;

        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const res = await axios.post(
          refreshUrl,
          { refreshToken }, // send the token in body
          { withCredentials: true }
        );

        const newAccessToken = res.data.accessToken;
        localStorage.setItem("authToken", newAccessToken);
        localStorage.setItem("accessToken", newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("Refresh token failed", refreshError);
        
        // Clear all auth data when refresh fails
        localStorage.removeItem("authToken");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("authUser");

        if (typeof window !== "undefined") {
          toast.error("Session expired. Please login again.");
          // Redirect to login page
          window.location.href = "/";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
