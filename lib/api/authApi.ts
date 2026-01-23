
import { SignUpInput } from "../validations/auth";
import apiClient from "./api-client";

export interface SignInInput {
  email: string;
  password: string;
}

export async function signUpUser(data: SignUpInput) {
  const res = await apiClient.post("/auth/register", data);
  return res.data;
}

export async function signInUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const res = await apiClient.post("/auth/login", { email, password });
  console.log("Login response:", res.data);
  return res.data;
}

export async function logoutUser() {
  return apiClient.post("/auth/logout");
}

export async function forgotPassword(email: string) {

  const response = await apiClient.post("/auth/forgot-password", { email });
  return response.data;
}

export async function verifyOtp({
  email,
  otp,
}: {
  email: string;
  otp: string;
}) {
  const response = await apiClient.post("/auth/verify-otp", { email, otp });
  return response.data;
}


export async function resendOtp({ email }: { email: string }) {
  const response = await apiClient.post("/auth/resend-otp", { email });
  return response.data;
}

export async function resetPassword({
  email,
  newPassword,
  confirmPassword,
}: {
  email: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const res = await apiClient.post("/auth/reset-password", {
    email,
    newPassword,
    confirmPassword,
  });
  return res.data;
}

export async function verifySignupOtp({ email, otp }: { email: string; otp: string }) {
  const res = await apiClient.post("/auth/verify-signup-otp", { email, otp });
  return res.data;
}

// Social authentication functions
export async function googleAuth(firebaseToken: string) {
  const res = await apiClient.post("/auth/google", { 
    token: firebaseToken,
    type: "user" // default role for users
  });
  return res.data;
}

export async function facebookAuth(firebaseToken: string) {
  const res = await apiClient.post("/auth/facebook", { 
    token: firebaseToken,
    type: "user" // default role for users
  });
  return res.data;
}

// Get authenticated user's details including active plan and current discount
export async function getMyDetails() {
  const res = await apiClient.get("/auth/me");
  console.log("getMyDetails response:", res.data);
  return res.data as { success: boolean; data: {
    id: string; firstName: string; lastName: string; email: string; role: string;
    planType: string; subscriptionStatus: string | null; currentDiscount: number; activePlan: string;
    myReferralCode?: string;
    
    // totalDiscountAmount returned in cents from backend
    totalDiscountAmount?: number;
    createdAt: string; updatedAt: string;
  } };
}

