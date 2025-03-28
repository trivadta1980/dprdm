import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { useDebugErrors } from "../debug/debug-error-panel";
import { queryClient as defaultQueryClient } from "@/lib/queryClient";

interface EnhancedQueryClientProviderProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

/**
 * Enhanced Query Client Provider that adds error handling
 * to React Query hooks
 */
export function EnhancedQueryClientProvider({
  children,
  queryClient = defaultQueryClient,
}: EnhancedQueryClientProviderProps) {
  const [client] = useState(() => queryClient);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}