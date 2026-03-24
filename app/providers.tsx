"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/lib/use-auth";

const queryClient = new QueryClient();

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
    </QueryClientProvider>
  );
}
