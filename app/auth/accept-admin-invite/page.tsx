"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/firebase";
import { useAppDispatch } from "@/redux/hooks";
import { setCredentials } from "@/redux/authSlice";
import { useQueryClient } from "@tanstack/react-query";
import { acceptAdminInvite, getAdminInviteByToken } from "@/lib/api/authApi";

export default function AcceptAdminInvitePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!token) {
      setInviteError("Missing invite token.");
      setLoadingInvite(false);
      return;
    }

    (async () => {
      try {
        const res = await getAdminInviteByToken(token);
        setInviteEmail(res?.data?.email || "");
        setInviteError("");
      } catch (err: any) {
        setInviteError(err?.response?.data?.message || "This invite link is invalid or expired.");
      } finally {
        setLoadingInvite(false);
      }
    })();
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const res = await acceptAdminInvite({
        token,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      const user = res?.data?.user;
      const accessToken = res?.data?.accessToken;
      const firebaseCustomToken = res?.data?.firebaseToken;

      if (user && accessToken && firebaseCustomToken) {
        await signInWithCustomToken(auth, firebaseCustomToken);
        dispatch(setCredentials({ user, token: accessToken }));
        queryClient.setQueryData(["authUser"], user);
        queryClient.setQueryData(["authToken"], accessToken);
        localStorage.setItem("authUser", JSON.stringify(user));
        localStorage.setItem("authToken", accessToken);
        toast.success("Admin account created. Welcome!");
        router.push("/admin/dashboard");
        return;
      }

      toast.success("Admin account created. Please sign in.");
      router.push("/auth/sign-in");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not accept invite.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0c0c0c] border border-gray-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-xl font-semibold mb-2">Accept admin invite</h1>
        <p className="text-sm text-gray-400 mb-6">
          Set up your RentAi admin account. Your email is locked to the invitation.
        </p>

        {loadingInvite ? (
          <p className="text-gray-400 text-sm">Validating invite...</p>
        ) : inviteError ? (
          <div className="rounded-lg border border-rose-800 bg-rose-950/20 p-4 text-sm text-rose-300">
            {inviteError}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Email</label>
              <input
                value={inviteEmail}
                readOnly
                className="w-full bg-[#111] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">First name</label>
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full bg-transparent border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Last name</label>
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full bg-transparent border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Password</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-transparent border border-gray-700 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Confirm password</label>
              <input
                required
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full bg-transparent border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full mt-2 rounded-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 py-2.5 text-sm font-medium"
            >
              {pending ? "Creating account..." : "Create admin account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
