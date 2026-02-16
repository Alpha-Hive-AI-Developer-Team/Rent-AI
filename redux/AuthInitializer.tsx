// "use client";
// import { useEffect } from "react";
// import { useQueryClient } from "@tanstack/react-query";
// import { useAppDispatch } from "./hooks";
// import { initializeAuth } from "./authSlice";
// import apiClient from '@/lib/api/api-client';
// import toast from "react-hot-toast";
// import { usePathname } from 'next/navigation';

// export default function AuthInitializer() {
//   const queryClient = useQueryClient();
//   const dispatch = useAppDispatch();
//   const pathname = usePathname();

//   useEffect(() => {
//     // On mount try to refresh access token using refresh-token endpoint
//     // The server reads refresh token from cookie and returns a new access token + user on success
//     (async () => {
//       try {
//         const res = await apiClient.post('auth/refresh-token');
//         const payload = res?.data?.data || res?.data;
//         const user = payload?.user;
//         const accessToken = payload?.accessToken || payload?.access_token;
//         console.debug('Refresh token response', payload);
//         if (user && accessToken) {
//           // persist
//           localStorage.setItem('authUser', JSON.stringify(user));
//           localStorage.setItem('authToken', accessToken);

//           // restore cache and redux
//           queryClient.setQueryData(['authUser'], user);
//           queryClient.setQueryData(['authToken'], accessToken);
//           dispatch(initializeAuth({ user, token: accessToken }));
        
//           console.debug('Auth state restored via refresh-token');
//           return;
//         }
//       } catch (err) {
//         // refresh failed — fall back to localStorage restore
//         console.debug('refresh-token failed, falling back to localStorage', err);
//         localStorage.removeItem("authToken");
//         localStorage.removeItem("authUser");
//         // Don't show session-expired toast on the homepage
//         if (pathname !== '/'&& pathname !== '/auth/sign-in' && pathname !== '/auth/sign-up') {
//           toast.error("Session expired. Please log in again.");
//         }
//         dispatch(initializeAuth(null));
//       }


//     })();
//   }, [queryClient, dispatch, pathname]);

//   return null; // nothing to render
// }



// "use client";
// import { useEffect } from "react";
// import { useQueryClient } from "@tanstack/react-query";
// import { useAppDispatch } from "./hooks";
// import { initializeAuth } from "./authSlice";
// import apiClient from '@/app/lib/api/api-client';
// import toast from "react-hot-toast";
// import { usePathname } from 'next/navigation';

// export default function AuthInitializer() {
//   const queryClient = useQueryClient();
//   const dispatch = useAppDispatch();
//   const pathname = usePathname();

//   useEffect(() => {
//     // On mount try to refresh access token using refresh-token endpoint
//     // The server reads refresh token from cookie and returns a new access token + user on success
//     (async () => {
//       try {
//         const res = await apiClient.post('/users/refresh-token');
//         const payload = res?.data?.data || res?.data;
//         const user = payload?.user;
    
//         const accessToken = payload?.accessToken || payload?.access_token;

//         if (user && accessToken) {
//           // persist
//           localStorage.setItem('Referee-authUser', JSON.stringify(user));
//           localStorage.setItem('Referee-authToken', accessToken);

//           // restore cache and redux
//           queryClient.setQueryData(['Referee-authUser'], user);
//           queryClient.setQueryData(['Referee-authToken'], accessToken);
//           dispatch(initializeAuth({ user, token: accessToken }));
        
        
//           return;
//         }
//       } catch (err) {
//         // refresh failed — fall back to localStorage restore
       
//         localStorage.removeItem("Referee-authToken");
//         localStorage.removeItem("Referee-authUser");
//         // Don't show session-expired toast on the homepage
//         if (pathname !== '/'&& pathname !== '/auth' && pathname !== '/dashboard' && pathname !== '/terms' && pathname !== '/privacy' && pathname !== '/how-it-works'&& !pathname.startsWith('/auth/forgot-password') && pathname !== '/admin/login') {
//           toast.error("Session expired. Please log in again.");
//         }
//         dispatch(initializeAuth(null));
//       }


//     })();
//   }, [queryClient, dispatch, pathname]);

//   return null; // nothing to render
// }


"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "./hooks";
import { initializeAuth } from "./authSlice";

import toast from "react-hot-toast";
import { usePathname } from 'next/navigation';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase"; // Your firebase config
import apiClient from "@/lib/api/api-client";

export default function AuthInitializer() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const pathname = usePathname();

  useEffect(() => {
    // LISTENER: This runs automatically whenever Firebase loads or the token refreshes.
    // It works perfectly on iOS Safari because it checks IndexedDB.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      
      if (firebaseUser) {
        try {
          // 1. Get the JWT (forces refresh if needed)
          const token = await firebaseUser.getIdToken();

          // 2. Fetch the MongoDB User Profile
          // We need this because Firebase only knows 'email' and 'uid', 
          // but your app needs 'role', 'name', etc.
          const res = await apiClient.get('/auth/me'); // Ensure you have a 'get profile' route
          const userProfile = res?.data?.data || res?.data?.user || res?.data;
          console.log('Fetched user profile:', userProfile);

          if (userProfile) {
            // Persist to LocalStorage (optional, mostly for non-sensitive quick reads)
            localStorage.setItem('authUser', JSON.stringify(userProfile));
            localStorage.setItem('authToken', token);

            // Update State
            queryClient.setQueryData(['authUser'], userProfile);
            dispatch(initializeAuth({ user: userProfile, token }));
          }
        } catch (err) {
          console.error("Auth Init Error:", err);
          // If the token is valid but backend fails (e.g. user deleted in DB), log them out
          auth.signOut();
          dispatch(initializeAuth(null));
        }
      } else {
        // No User Logged In
        const wasLoggedIn = localStorage.getItem('authToken');
        
        // Cleanup
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
         if (pathname !== '/auth/sign-in' && pathname !== '/auth/sign-up' && pathname !== '/' && !pathname.startsWith('/auth/forgot-password') && pathname !== '/admin/login') {
          toast.error("Session expired. Please log in again.");
        }
        dispatch(initializeAuth(null));

        // Only show toast if they were previously logged in and are on a protected route
        // if (wasLoggedIn && 
        //     pathname !== '/' && 
        //     pathname !== '/auth' && 
        //     !pathname.startsWith('/auth/forgot-password') && 
        //     pathname !== '/admin/login') {
        //   toast.error("Session expired. Please log in again.");
        // }
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [dispatch, queryClient, pathname]);

  return null;
}
