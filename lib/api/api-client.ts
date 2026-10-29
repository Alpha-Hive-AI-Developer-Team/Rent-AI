// import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
// import toast from "react-hot-toast";

// const apiClient = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
//   headers: {
//     "Content-Type": "application/json",
//   },
//   withCredentials: true,
// });

// // Attach access token to each request (except login/register endpoints)
// apiClient.interceptors.request.use((config) => {
//   // Don't attach token for login/register endpoints
//   // Treat explicit auth endpoints (login/register/refresh-token) specially.
//   // Use stricter checks so paths like `/payouts/login-link` are NOT considered auth endpoints.
//   const url = config.url || '';
//   const isLogin = /\/login($|\/|\?)/.test(url);
//   const isRegister = /\/register($|\/|\?)/.test(url);
//   const isRefresh = /\/refresh-token($|\/|\?)/.test(url) || url.includes('/refresh-token');
//   const isAuthEndpoint = isLogin || isRegister || isRefresh;
  
//   if (!isAuthEndpoint) {
//     const token = localStorage.getItem("authToken");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//   }
//   return config;
// });

// apiClient.interceptors.response.use(
//   (response) => response,
//   async (error: AxiosError) => {
//     const originalRequest = error.config as
//       | (InternalAxiosRequestConfig & { _retry?: boolean })
//       | undefined;

//     // Don't try to refresh token on login/signup/auth endpoints
//     const origUrl = originalRequest?.url || '';
//     const isLoginReq = /\/login($|\/|\?)/.test(origUrl);
//     const isRegisterReq = /\/register($|\/|\?)/.test(origUrl);
//     const isRefreshReq = /\/refresh-token($|\/|\?)/.test(origUrl) || origUrl.includes('/refresh-token');
//     const isSocial = origUrl.includes('/auth/google') || origUrl.includes('/auth/facebook');
//     const isAuthEndpoint = isLoginReq || isRegisterReq || isRefreshReq || isSocial;

//     if (
//       error.response?.status === 401 &&
//       originalRequest &&
//       !originalRequest._retry &&
//       !isAuthEndpoint
//     ) {
//       originalRequest._retry = true;

//       try {
//         // Use hardcoded localhost for refresh token in development, otherwise use env/production
//         const refreshUrl =
//           process.env.NODE_ENV === "development"
//             ? "http://localhost:5000/api/users/refresh-token"
//             : `${process.env.NEXT_PUBLIC_API_URL}/users/refresh-token`;

//         const refreshToken = localStorage.getItem("refreshToken");

//         if (!refreshToken) {
//           throw new Error("No refresh token available");
//         }

//         const res = await axios.post(
//           refreshUrl,
//           { refreshToken }, // send the token in body
//           { withCredentials: true }
//         );

//         const newAccessToken = res.data.accessToken;
//         localStorage.setItem("authToken", newAccessToken);
//         localStorage.setItem("accessToken", newAccessToken);

//         if (originalRequest.headers) {
//           originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
//         }

//         return apiClient(originalRequest);
//       } catch (refreshError) {
//         console.error("Refresh token failed", refreshError);
        
//         // Clear all auth data when refresh fails
//         localStorage.removeItem("authToken");
//         localStorage.removeItem("accessToken");
//         localStorage.removeItem("refreshToken");
//         localStorage.removeItem("authUser");

//         if (typeof window !== "undefined") {
//           toast.error("Session expired. Please login again.");
//           // Redirect to login page
//           window.location.href = "/";
//         }

//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default apiClient;



import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, 
});

// --- REQUEST INTERCEPTOR ---
apiClient.interceptors.request.use(async (config) => {
  
  // 1. Define endpoints that should NOT attempt to attach an auth header.
  // IMPORTANT: do NOT use naive `includes('/login')` checks because they match
  // routes like `/payouts/login-link` (which *do* require auth).
  const rawUrl = config.url || '';
  const pathOnly = rawUrl.split('?')[0];
  const isAuthEndpoint = /^\/auth\/(login|register|refresh-token|forgot-password|reset-password|verify-otp|verify-signup-otp|resend-otp|google|facebook|logout|admin-invite)(\/|$)/.test(pathOnly);
  // Public consent endpoints only — status/reaccept require Firebase auth
  const isPublicConsentEndpoint = /^\/consent\/(versions|cookies)(\/|$)/.test(pathOnly);
  
  if (!isAuthEndpoint && !isPublicConsentEndpoint) {
    try {
      // 2. Wait for Firebase to initialize (if supported)
      // This ensures `auth.currentUser` is settled on page reloads.
      if (typeof (auth as any).authStateReady === 'function') {
        await (auth as any).authStateReady();
      }

      const user = auth.currentUser;

      if (user) {
        // 3. Get the token (forceRefresh = false)
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error attaching token:", error);
    }
  }
  
  // 4. Handle FormData content-type removal
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

let sessionExpiryHandling = false;

function isAuthPagePath(pathname: string) {
  return (
    pathname.startsWith("/auth") ||
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/login")
  );
}

async function handleSessionExpired(message?: string) {
  if (typeof window === "undefined" || sessionExpiryHandling) return;
  if (isAuthPagePath(window.location.pathname)) return;

  sessionExpiryHandling = true;
  try {
    try {
      await signOut(auth);
    } catch {
      // ignore firebase sign-out errors during expiry
    }

    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    toast.error(message || "Session expired. Please login again.");
    window.location.href = "/auth/sign-in";
  } finally {
    // keep flag true until navigation completes to avoid toast spam
  }
}

function isAccountDisabledError(error: AxiosError) {
  const data = error.response?.data as { message?: string } | undefined;
  const msg = String(data?.message || "").toLowerCase();
  return msg.includes("disabled") || msg.includes("disable");
}

// --- RESPONSE INTERCEPTOR ---
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const rawUrl = error.config?.url || "";
    const pathOnly = rawUrl.split("?")[0];
    const isAuthEndpoint =
      /^\/auth\/(login|register|refresh-token|forgot-password|reset-password|verify-otp|verify-signup-otp|resend-otp|google|facebook|logout|admin-invite)(\/|$)/.test(
        pathOnly
      );

    // Expired / invalid / disabled session — clear auth and go to login
    if ((status === 401 || (status === 403 && isAccountDisabledError(error))) && !isAuthEndpoint) {
      const disabled = isAccountDisabledError(error);
      console.error(
        disabled
          ? "Unauthorized request — account disabled"
          : "Unauthorized request — session expired"
      );
      await handleSessionExpired(
        disabled
          ? "Your account has been disabled. Contact support."
          : undefined
      );
    }
    return Promise.reject(error);
  }
);

export default apiClient;