"use client";

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlchemyAccountProvider } from "@account-kit/react";
import { alchemyConfig } from "@/lib/alchemy-config";

const queryClient = new QueryClient();

// Alchemy's SolanaSigner constructor throws "Must be authenticated!" when it's
// instantiated against an unauthenticated client during provider init. We don't
// use Solana, so the rejection is harmless — just suppress the dev-console noise.
function useSuppressAlchemyAuthRejection() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: PromiseRejectionEvent) => {
      const reason = event.reason as unknown;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "";
      if (message === "Must be authenticated!") {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);
}

export function Providers({ children }: { children: React.ReactNode }) {
  useSuppressAlchemyAuthRejection();
  return (
    <QueryClientProvider client={queryClient}>
      <AlchemyAccountProvider config={alchemyConfig} queryClient={queryClient}>
        {children}
      </AlchemyAccountProvider>
    </QueryClientProvider>
  );
}
