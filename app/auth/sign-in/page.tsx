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
export default function SignIn() {
  const router = useRouter();
  const dispatch = useAppDispatch();
   const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // NEW TOGGLE STATE
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  // Simple local state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useLogin();

  const onSubmit =async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    login.mutate(
      { email, password },
      {
        onSuccess: async(resp: any) => {
          setLoading(false);
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
              setLoading(false);
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
          setLoading(false);
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
              className="w-full bg-transparent border border-[#2a2a2a] rounded-lg px-9 py-2 text-sm 
              focus:border-[#0CEB77] outline-none"
            />
          </div>

          {/* Password */}
<div className="relative">
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="w-full bg-transparent border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm
    focus:border-[#0CEB77] outline-none pr-10"
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
            className="w-full bg-[#1A1A1A] border border-[#2a2a2a] py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-[#222] transition"
          >
            <LogIn size={16} />
            Login
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

          {/* Admin Toggle */}
          {/* <button
            type="button"
            onClick={() => setIsAdmin(!isAdmin)}
            className={`mt-3 text-sm font-medium transition ${
              isAdmin ? "text-[#0CEB77]" : "text-gray-400"
            }`}
          >
            {isAdmin ? "Admin mode enabled ✔" : "Are you admin?"}
          </button> */}
        </form>
      </div>
      {showOtp && (
        <VerifyOtpModal email={email} onClose={() => setShowOtp(false)} />
      )}
    </main>
  );
}
