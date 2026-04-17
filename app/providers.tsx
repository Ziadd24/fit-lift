"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { getErrorMessage, getRetryDelay, shouldRetryRequest } from "@/lib/feedback";
import { useAuth } from "@/lib/use-auth";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(getErrorMessage(error, "We couldn't load that right now."));
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(getErrorMessage(error, "We couldn't save that change."));
    },
  }),
  defaultOptions: {
    queries: {
      retry: shouldRetryRequest,
      retryDelay: getRetryDelay,
      throwOnError: false,
    },
    mutations: {
      retry: shouldRetryRequest,
      retryDelay: getRetryDelay,
    },
  },
});

function SessionGuard({ children }: { children: React.ReactNode }) {
  const checkSessionExpiry = useAuth((s) => s.checkSessionExpiry);

  // Check for expired sessions on every page load
  useEffect(() => {
    checkSessionExpiry();
  }, [checkSessionExpiry]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionGuard>{children}</SessionGuard>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#16161A",
            color: "#FFFFFF",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
          },
        }}
      />
    </QueryClientProvider>
  );
}
