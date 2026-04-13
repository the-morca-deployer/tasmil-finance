"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import { Toaster } from "sonner";
import { WalletProvider } from "@/shared/context/wallet-context";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { ThemeStorageMigration } from "./theme-storage-migration";

export function AppProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 10,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem={true}
        disableTransitionOnChange
        storageKey="tasmil-ui-theme"
      >
        <ThemeStorageMigration />
        <TooltipProvider>
          <WalletProvider>{children}</WalletProvider>
        </TooltipProvider>
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
