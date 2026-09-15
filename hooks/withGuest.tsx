"use client";

import React from "react";
import { useAuth } from "./useAuth";
import { useRouter } from "next/navigation";

function getLoggedInHomePath(role?: string) {
  if (role === "admin" || role === "superAdmin") return "/admin/dashboard";
  return "/user/dashboard";
}

/**
 * Redirects already-authenticated users away from guest-only auth pages
 * (sign-in, sign-up, forgot/reset password) to their dashboard.
 */
export function withGuest<P extends object>(WrappedComponent: React.ComponentType<P>) {
  const ComponentWithGuest = (props: P) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
      if (!loading && user) {
        router.replace(getLoggedInHomePath(user.role));
      }
    }, [user, loading, router]);

    if (loading || user) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center text-sm text-gray-400">
          Redirecting...
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  ComponentWithGuest.displayName = `withGuest(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return ComponentWithGuest;
}

export { getLoggedInHomePath };
