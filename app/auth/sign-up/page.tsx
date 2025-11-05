"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";

// ✅ Define form schema
const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ✅ Infer TypeScript type from schema
type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    console.log("Form submitted:", data);
    // Example: await fetch("/api/auth/signup", { method: "POST", body: JSON.stringify(data) });
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-black text-white px-4">
      {/* Card */}
      <div className="bg-[#0B0B0B] w-full max-w-sm p-8 rounded-2xl shadow-lg border border-[#1a1a1a] text-center">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image src="/images/auth.png" alt="RentAI Logo" width={28} height={28} />
        </div>

        {/* Heading */}
        <h1 className="text-xl font-semibold mb-2">Create an account</h1>
        <p className="text-gray-400 text-sm mb-6">
          Let’s get started. Fill in the details below to create your account.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
          {/* Name fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1 text-gray-300">First Name</label>
              <input
                {...register("firstName")}
                placeholder="First Name"
                className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1 text-gray-300">Last Name</label>
              <input
                {...register("lastName")}
                placeholder="Last Name"
                className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

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

          {/* Password */}
          <div className="relative">
            <label className="block text-sm mb-1 text-gray-300">Password</label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:border-green-500"
              />
              {/* Eye icon */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-1">Minimum 8 characters.</p>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full py-2 rounded-md font-medium text-sm
            bg-[#027A48] hover:bg-[#02653d] transition disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Sign up"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-gray-400 text-sm mt-4">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-green-500 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
