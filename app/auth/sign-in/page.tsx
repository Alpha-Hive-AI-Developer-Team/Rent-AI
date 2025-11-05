"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";

// ✅ Validation schema
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    console.log("Sign in data:", data);
    // Example: await fetch("/api/auth/signin", { method: "POST", body: JSON.stringify(data) });
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-black text-white px-4">
      {/* Card */}
      <div className="bg-[#0B0B0B] w-full max-w-sm p-8 rounded-2xl shadow-lg border border-[#1a1a1a] text-center">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image
            src="/images/auth.png"
            alt="RentAI Logo"
            width={40}
            height={40}
          />
        </div>

        {/* Heading */}
        <h1 className="text-xl font-semibold mb-2">Sign in</h1>
        <p className="text-gray-400 text-sm mb-6">
          Log in to unlock tailored content and stay connected with your community.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
          {/* Email */}
          <div>
            <label className="block text-sm mb-1 text-gray-300">Email</label>
            <input
              {...register("email")}
              type="email"
              placeholder="Email"
              className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password with eye toggle */}
          <div>
            <label className="block text-sm mb-1 text-gray-300">Password</label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:border-green-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full py-2 rounded-md font-medium text-sm
              bg-[#027A48] hover:bg-[#02653d] transition disabled:opacity-50"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-gray-400 text-sm mt-4">
          Don’t have an account?{" "}
          <Link href="/auth/sign-up" className="text-green-500 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
