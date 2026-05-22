import { GoogleAuthProvider, signInWithCustomToken, signInWithPopup } from "firebase/auth";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import toast from "react-hot-toast";
import { auth } from "@/firebase";
import { googleAuth } from "@/lib/api/authApi";
import { setCredentials } from "@/redux/authSlice";
import { AppDispatch } from "@/redux/store";
import { QueryClient } from "@tanstack/react-query";

type GoogleSignInOptions = {
  dispatch: AppDispatch;
  queryClient: QueryClient;
  router: AppRouterInstance;
  role?: string;
};

export async function signInWithGoogle({
  dispatch,
  queryClient,
  router,
  role = "landlord",
}: GoogleSignInOptions): Promise<void> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();

  const res = await googleAuth(idToken, role);
  const data = res?.data || res;
  const user = data?.user;
  const firebaseCustomToken = data?.firebaseToken || data?.firebaseCustomToken;

  if (firebaseCustomToken) {
    await signInWithCustomToken(auth, firebaseCustomToken);
  }

  const token = (await auth.currentUser?.getIdToken()) || idToken;

  if (!user) {
    throw new Error("Google sign-in failed");
  }

  dispatch(setCredentials({ user, token }));
  queryClient.setQueryData(["authUser"], user);
  queryClient.setQueryData(["authToken"], token);

  toast.success("Signed in with Google");

  const userRole = user?.role || "landlord";
  if (userRole === "admin" || userRole === "superAdmin") {
    router.push("/admin/dashboard");
  } else {
    router.push("/user/dashboard");
  }
}
