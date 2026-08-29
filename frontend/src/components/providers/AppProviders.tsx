"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { RealtimeProvider } from "./RealtimeProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 45, // 45 seconds default fresh data
            gcTime: 1000 * 60 * 10, // 10 minutes cache retention
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: (failureCount, error: any) => {
              // Never retry on client validation or 4xx business errors
              const status = error?.status;
              if (status && status >= 400 && status < 500) {
                return false;
              }
              // Max 2 retries for transient 502/503/504 or network timeout
              return failureCount < 2;
            },
          },
          mutations: {
            // Strict 0-retry policy on mutations to avoid duplicate transactions
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeProvider>
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton={false}
          duration={2500}
          visibleToasts={1}
        />
      </RealtimeProvider>
    </QueryClientProvider>
  );
}
