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
        {/* <Toaster position="top-right" /> */}
                <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0b1510",
              color: "#d1fae5",
              border: "1px solid #064e3b",
            },
          }}
        />
      </QueryProvider>
    </ReduxProvider>
  );
}
