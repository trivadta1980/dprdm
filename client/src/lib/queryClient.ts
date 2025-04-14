import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { useDebugErrors } from "@/components/debug/debug-error-panel";
import { createContext, useContext } from 'react';

export const QueryErrorContext = createContext<{ 
  addQueryError: (error: any, request: { url: string, method?: string }) => void 
}>({
  addQueryError: () => {}
});

export const useQueryErrorContext = () => useContext(QueryErrorContext);

// Function to detect if a response contains HTML instead of JSON (potential login page redirect)
function isHtmlResponse(text: string): boolean {
  return text.trim().startsWith('<!DOCTYPE') || 
         text.trim().startsWith('<html') || 
         text.includes('<body') || 
         text.includes('<head');
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage;
    let responseText = '';
    let isHtml = false;
    
    try {
      responseText = await res.text();
      isHtml = isHtmlResponse(responseText);
      
      if (isHtml) {
        // If we got HTML when expecting JSON, it's likely a redirect to login page
        errorMessage = "Session expired or authentication required";
      } else {
        // Try to parse as JSON if it's not HTML
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || res.statusText;
        } catch {
          // Not parseable as JSON, use as plain text
          errorMessage = responseText || res.statusText;
        }
      }
    } catch (e) {
      errorMessage = res.statusText || "Unknown error";
    }
    
    const error = new Error(`${res.status}: ${errorMessage}`);
    
    // Add additional properties to the error
    (error as any).status = res.status;
    (error as any).responseType = isHtml ? 'text/html' : res.headers.get('content-type');
    (error as any).responsePreview = responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '');
    (error as any).isHtmlResponse = isHtml;
    
    throw error;
  }
}

// Custom hook to create API request with error handling
export function useApiRequest() {
  const debugErrors = useDebugErrors();
  
  return async function(
    url: string,
    options: { method?: string; data?: unknown } = {}
  ): Promise<Response> {
    // Remove any duplicate /api prefixes and ensure a single /api prefix
    const cleanUrl = url.replace(/^\/?(api\/?)+/, '');
    const apiUrl = `/api/${cleanUrl}`;

    try {
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

      try {
        await throwIfResNotOk(res);
        return res;
      } catch (error: any) {
        // Categorize error type based on status and response
        let errorType: "request" | "response" | "parsing" | "network" | "authentication" | "unknown" = "response";
        
        if (error.status === 401 || error.status === 403 || error.isHtmlResponse) {
          errorType = "authentication";
        } else if (error.message.includes('JSON') || error.message.includes('parse')) {
          errorType = "parsing";
        }
        
        // Add to debug errors
        debugErrors.addError({
          message: error.message || 'API request failed',
          type: errorType,
          url: apiUrl,
          status: error.status,
          responsePreview: error.responsePreview
        });
        
        throw error;
      }
    } catch (networkError: any) {
      // Handle network errors (fetch failed to complete)
      if (!networkError.status) {
        debugErrors.addError({
          message: networkError.message || 'Network request failed',
          type: 'network',
          url: apiUrl
        });
      }
      throw networkError;
    }
  };
}

// Legacy function for compatibility
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

// Enhanced getQueryFn with error handling
export function createQueryFn({ debugErrors }: { debugErrors?: ReturnType<typeof useDebugErrors> }) {
  return <T>(options: { on401: UnauthorizedBehavior }): QueryFunction<T> => 
    async ({ queryKey }) => {
      const [url] = queryKey;
      if (typeof url !== 'string') {
        throw new Error('Query key must be a string URL');
      }

      // Clean up URL to prevent duplicate /api prefixes
      const cleanUrl = url.replace(/^\/?(api\/?)+/, '');
      const apiUrl = `/api/${cleanUrl}`;

      try {
        const res = await fetch(apiUrl, {
          credentials: "include",
          headers: {
            "Accept": "application/json"
          }
        });

        if (options.on401 === "returnNull" && res.status === 401) {
          return null;
        }

        try {
          await throwIfResNotOk(res);
          return await res.json();
        } catch (error: any) {
          // Add to debug errors panel if available
          if (debugErrors) {
            // Categorize error type based on status and response
            let errorType: "request" | "response" | "parsing" | "network" | "authentication" | "unknown" = "response";
            
            if (error.status === 401 || error.status === 403 || error.isHtmlResponse) {
              errorType = "authentication";
            } else if (error.message.includes('JSON') || error.message.includes('parse')) {
              errorType = "parsing";
            }
            
            debugErrors.addError({
              message: error.message || 'API request failed',
              type: errorType,
              url: apiUrl,
              status: error.status,
              responsePreview: error.responsePreview
            });
          }
          throw error;
        }
      } catch (networkError: any) {
        // Handle network errors (fetch failed to complete)
        if (debugErrors && !networkError.status) {
          debugErrors.addError({
            message: networkError.message || 'Network request failed',
            type: 'network',
            url: apiUrl
          });
        }
        throw networkError;
      }
    };
}

// Legacy fallback
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
      // Changed from Infinity to 0 to allow refetching when cache is invalidated
      staleTime: 0,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});