"use client";

import QueryProvider from "@/lib/providers/query-provider";
import ReduxProvider from "@/lib/providers/ReduxProvider";
import AuthInitializer from "./AuthInitializer";
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <QueryProvider>
        <AuthInitializer />
        {children}
        <Toaster position="top-right" />
      </QueryProvider>
    </ReduxProvider>
  );
}
