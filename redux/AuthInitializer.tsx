"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "./hooks";
import { initializeAuth } from "./authSlice";
import apiClient from '@/lib/api/api-client';
import toast from "react-hot-toast";
import { usePathname } from 'next/navigation';

export default function AuthInitializer() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const pathname = usePathname();

  useEffect(() => {
    // On mount try to refresh access token using refresh-token endpoint
    // The server reads refresh token from cookie and returns a new access token + user on success
    (async () => {
      try {
        const res = await apiClient.post('auth/refresh-token');
        const payload = res?.data?.data || res?.data;
        const user = payload?.user;
        const accessToken = payload?.accessToken || payload?.access_token;
        console.debug('Refresh token response', payload);
        if (user && accessToken) {
          // persist
          localStorage.setItem('authUser', JSON.stringify(user));
          localStorage.setItem('authToken', accessToken);

          // restore cache and redux
          queryClient.setQueryData(['authUser'], user);
          queryClient.setQueryData(['authToken'], accessToken);
          dispatch(initializeAuth({ user, token: accessToken }));
        
          console.debug('Auth state restored via refresh-token');
          return;
        }
      } catch (err) {
        // refresh failed — fall back to localStorage restore
        console.debug('refresh-token failed, falling back to localStorage', err);
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        // Don't show session-expired toast on the homepage
        if (pathname !== '/'&& pathname !== '/auth/sign-in' && pathname !== '/auth/sign-up') {
          toast.error("Session expired. Please log in again.");
        }
        dispatch(initializeAuth(null));
      }


    })();
  }, [queryClient, dispatch, pathname]);

  return null; // nothing to render
}
