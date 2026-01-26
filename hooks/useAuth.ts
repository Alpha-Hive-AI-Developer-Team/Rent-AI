import { useMutation, useQuery } from "@tanstack/react-query";
import { signUpUser, signInUser, logoutUser, verifySignupOtp, getMyDetails } from "@/lib/api/authApi";
import { getReferralsSummary } from "@/lib/api/referrals";
import { SignUpInput } from "@/lib/validations/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout as logoutAction } from "@/redux/authSlice";



export function useAuth() {
  const dispatch = useAppDispatch();
  const { user: reduxUser, isInitialized } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to be initialized from localStorage
    if (isInitialized) {
      setLoading(false);
    }
  }, [isInitialized]);

  // Optional: function to manually refresh auth state
  const refreshAuth = () => {
    const storedUser = localStorage.getItem("authUser");
    const token = localStorage.getItem("authToken");

    if (storedUser && token) {
      // State will be updated via AuthInitializer
      setLoading(false);
    }
  };

  return { user: reduxUser, loading, refreshAuth };
}




export function useSignUp() {
  return useMutation({
    mutationFn: (data: SignUpInput) => signUpUser(data),
  });
}


export function useLogin() {
  return useMutation({
    mutationFn: signInUser,
  });
}

export function useLogout() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      // ✅ Dispatch Redux logout action which also clears localStorage
      dispatch(logoutAction());

      toast.success("Logged out successfully!");

      // Redirect to login page
      router.push("/");
    },
    onError: (err: any) => {
      const errorMessage =
        err?.response?.data?.message || "Logout failed. Please try again.";
      toast.error(errorMessage);
      console.error("Logout failed:", err);
    },
  });
}
export function useCustomerLogout() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      // ✅ Dispatch Redux logout action which also clears localStorage
      dispatch(logoutAction());

      toast.success("Logged out successfully!");

      // Redirect to login page
      router.push("/auth/sign-in");
    },
    onError: (err: any) => {
      const errorMessage =
        err?.response?.data?.message || "Logout failed. Please try again.";
      toast.error(errorMessage);
      console.error("Logout failed:", err);
    },
  });
}

// Social Authentication Hooks
export function useGoogleAuth() {
  return useMutation({
    mutationFn: async (firebaseToken: string) => {
      const { googleAuth } = await import("@/lib/api/authApi");
      return googleAuth(firebaseToken);
    },
  });
}

export function useFacebookAuth() {
  return useMutation({
    mutationFn: async (firebaseToken: string) => {
      const { facebookAuth } = await import("@/lib/api/authApi");
      return facebookAuth(firebaseToken);
    },
  });
}

// Verify signup OTP
export function useVerifySignupOtp() {
  return useMutation({
    mutationFn: (payload: { email: string; otp: string }) => verifySignupOtp(payload),
  });
}

// Fetch authenticated user's profile (active plan + discount)
export function useMyProfile() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      return await getMyDetails();
    },
    // only run on client where localStorage is available (api-client will attach token)
    enabled: typeof window !== "undefined",
    staleTime: 0, // 1 minute
  });
}

// Fetch referrals summary for authenticated user
export function useReferralsSummary() {
  return useQuery({
    queryKey: ["referrals-summary"],
    queryFn: async () => {
      return await getReferralsSummary();
    },
    enabled: typeof window !== "undefined",
    staleTime: 0,
  });
}
