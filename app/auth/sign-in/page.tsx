"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, LogIn, CreditCard } from "lucide-react";
import { useLogin } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import VerifyOtpModal from "@/components/auth/verify-otp";
import {signInWithCustomToken} from 'firebase/auth'
import {auth} from "@/firebase";
import { useAppDispatch } from "@/redux/hooks";
import { setCredentials } from "@/redux/authSlice";
import { useQueryClient } from "@tanstack/react-query";
import { signInWithGoogle } from "@/lib/auth/google-auth";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function SignIn() {
  const router = useRouter();
  const dispatch = useAppDispatch();
   const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  // Simple local state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useLogin();

  const onSubmit =async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);

    login.mutate(
      { email, password },
      {
        onSuccess: async(resp: any) => {
            const user = resp?.data?.user || resp?.user || null;
            const accessToken = resp?.data?.accessToken || resp?.accessToken;
            const firebaseCustomToken = resp?.data?.firebaseToken || resp?.firebaseToken;
           const role = user?.role || "user";

            if(user && firebaseCustomToken)
            {
              const resp = await signInWithCustomToken(auth, firebaseCustomToken);
              console.debug("Firebase sign-in successful:", resp);
   // 4. Update Redux & Local State
        dispatch(setCredentials({ user, token: accessToken }));
        queryClient.setQueryData(['authUser'], user);
        queryClient.setQueryData(['authToken'], accessToken);
        localStorage.setItem('authUser', JSON.stringify(user));
        localStorage.setItem('authToken', accessToken);

               toast.success("Login successful");


             if (role === "admin" || role === "superAdmin"){ router.push("/admin/dashboard");}
            else{ router.push("/user/dashboard");}
            }
            else{
              setPending(false);
            }







          // try {
          
          //   console.debug("Login response:", resp.data || resp);
          


           

           
          //   console.debug("User role:", role);
           
          // } catch (err) {
          //   console.error(err);
          //   toast.success("Login successful");
          //   router.push("/user/dashboard");
          // }
        },
        onError: (err: any) => {
          setPending(false);
               // If server indicates unverified account requiring OTP verification
                  const status = err?.response?.status
          if (status === 403) {
            console.debug("Account unverified, showing OTP modal.");
            toast.error(err?.response?.data?.message || "Account unverified. Enter OTP sent to your email.");
            setShowOtp(true);
            return;
          }
          console.error("Login mutation error:", err);
          const message = err?.response?.data?.message || "Login failed. Please try again.";
          toast.error(message);
          console.error("Login error:", err);
        },
      }
    );
  };

  const handleGoogleLogin = async () => {
    setIsSocialLoading(true);
    try {
      await signInWithGoogle({ dispatch, queryClient, router });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Google sign-in failed";
      toast.error(msg);
    } finally {
      setIsSocialLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white px-4 flex flex-col items-center justify-start pt-12">
      {/* Top Navigation */}
      <div className="w-full max-w-6xl flex items-center justify-between mb-10 px-2">
        {/* Left: Logo + RentAI */}
        <div className="flex items-center gap-2 ">
          <Image
            src="/images/rent.png"
            alt="RentAI Logo"
            width={50}
            height={50}
            className="object-contain px-2 py-2 rounded-full border border-[#0B3D2C] hover:border-[#0CEB77]"
          />
          <h2 className="text-lg font-semibold">Rent Ai</h2>
        </div>

        {/* Right: Sign Up Button */}
        <Link
          href="/auth/sign-up"
          className="px-4 py-1.5 border border-[#0B3D2C] rounded-lg text-sm hover:bg-[#0CEB77]/10 transition"
        >
          Sign Up
        </Link>
      </div>

      {/* Center Card */}
      <div className="w-full max-w-6xl bg-[#0E0E0E] border border-[#1f1f1f] rounded-3xl py-20 px-10 text-center shadow-2xl">
        {/* Title */}
        <h1 className="text-2xl font-semibold mb-2">
          Welcome to <span className="text-[#0CEB77]">Rent Ai</span>
        </h1>
        <p className="text-gray-400 text-sm mb-10">
          Automated rent reconciliation & arrears detection.
        </p>

        {/* Form */}
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 max-w-md mx-auto"
        >
          {/* Email */}
          <div className="relative">
            <LogIn
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending}
              className="w-full bg-transparent border border-[#2a2a2a] rounded-lg px-9 py-2 text-sm 
              focus:border-[#0CEB77] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Password */}
<div className="relative">
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    disabled={pending}
    className="w-full bg-transparent border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm
    focus:border-[#0CEB77] outline-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
  />
  <button
    type="button"
    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
  </button>
</div>

{/* Forgot Password */}
<div className="text-right -mt-2">
  <Link
    href="/auth/forgot-password"
    className="text-xs text-gray-400 hover:text-[#0CEB77] transition"
  >
    Forgot password?
  </Link>
</div>


          {/* Login Button */}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-[#1A1A1A] border border-[#2a2a2a] py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-[#222] hover:border-[#0CEB77]/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={16} />
                Login
              </>
            )}
          </button>

          {/* Connect with Open Banking — HIDE ONLY in Admin Mode */}
          {/* {!isAdmin && (
            <Link href="/user/dashboard">
            <button
              type="button"
              className="w-full bg-transparent border border-[#2a2a2a] py-2 rounded-lg text-sm text-[#0CEB77] flex items-center justify-center gap-2 hover:bg-[#0CEB77]/10 transition"
            >
              <CreditCard size={16} />
              Connect with Open Banking
            </button>
            </Link>
          )} */}

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2a2a2a]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0E0E0E] px-2 text-gray-500">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={pending || isSocialLoading}
            className="w-full flex items-center justify-center gap-2 bg-transparent border border-[#2a2a2a] py-2.5 rounded-lg text-sm hover:bg-[#222] hover:border-[#0CEB77]/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSocialLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                Signing in with Google...
              </>
            ) : (
              <>
                <GoogleIcon />
                Sign in with Google
              </>
            )}
          </button>
        </form>
      </div>
      {showOtp && (
        <VerifyOtpModal email={email} onClose={() => setShowOtp(false)} />
      )}
    </main>
  );
}
