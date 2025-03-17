import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || res.statusText;
    } catch {
      errorMessage = await res.text() || res.statusText;
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  url: string,
  options: { method?: string; data?: unknown } = {}
): Promise<Response> {
  // Remove any duplicate /api prefixes and ensure a single /api prefix
  const cleanUrl = url.replace(/^\/?(api\/?)+/, '');
  const apiUrl = `/api/${cleanUrl}`;

  const res = await fetch(apiUrl, {
    method: options.method || 'GET',
    headers: {
      ...(options.data ? { "Content-Type": "application/json" } : {}),
      // Add Accept header to ensure JSON response
      "Accept": "application/json"
    },
    body: options.data ? JSON.stringify(options.data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const [url] = queryKey;
    if (typeof url !== 'string') {
      throw new Error('Query key must be a string URL');
    }

    // Clean up URL to prevent duplicate /api prefixes
    const cleanUrl = url.replace(/^\/?(api\/?)+/, '');
    const apiUrl = `/api/${cleanUrl}`;

    const res = await fetch(apiUrl, {
      credentials: "include",
      headers: {
        "Accept": "application/json"
      }
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});