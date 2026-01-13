import React from "react";
import { useAuth } from "./useAuth";
import { useRouter } from "next/navigation";


// 👇 HOC definition
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: string[] = []
) {
  const ComponentWithAuth = (props: P) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push("/");
        } else if (allowedRoles.length && !allowedRoles.includes(user.role)) {
          router.push("/unauthorized");
        }
      }
    }, [user, loading, router]);

    if (loading || !user) {
      return <div>Loading...</div>;
    }

    return <WrappedComponent {...props} />;
  };

  // 👇 Give the component a better display name for debugging
  ComponentWithAuth.displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return ComponentWithAuth;
}
