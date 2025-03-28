import { useDebugErrors } from "@/components/debug/debug-error-panel";
import { queryClient } from "@/lib/queryClient";

/**
 * Hook that provides API utilities with integrated error reporting
 */
export function useDebugApi() {
  const { addError } = useDebugErrors();

  /**
   * Check whether a response contains HTML content
   */
  const isHtmlResponse = (responseText: string): boolean => {
    // Check for any HTML indicators in the response
    return responseText.trim().startsWith("<!DOCTYPE") || 
           responseText.trim().startsWith("<html") ||
           (responseText.includes("<html") && responseText.includes("</html>"));
  };

  /**
   * Check whether an HTML response is likely an authentication-related page
   */
  const isAuthRelatedHtml = (responseText: string): boolean => {
    const lowerText = responseText.toLowerCase();
    return lowerText.includes("login") || 
           lowerText.includes("sign in") || 
           lowerText.includes("unauthorized") ||
           lowerText.includes("authentication") ||
           lowerText.includes("session") ||
           lowerText.includes("expired");
  };

  /**
   * Enhanced fetch function with debug logging
   */
  const debugFetch = async <T = any>(url: string, options?: RequestInit): Promise<T> => {
    try {
      console.log(`[Debug] Fetching from: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
        }
      });

      // Log response details
      console.log(`[Debug] Response status: ${response.status} ${response.statusText}`);
      console.log(`[Debug] Response content-type:`, response.headers.get('content-type'));
      console.log(`[Debug] Response content-length:`, response.headers.get('content-length'));

      // Clone the response to read the body multiple times
      const responseClone = response.clone();
      const responseText = await responseClone.text();
      console.log(`[Debug] Response text length: ${responseText.length}`);
      console.log(`[Debug] Response text preview: ${responseText.slice(0, 100)}${responseText.length > 100 ? '...' : ''}`);

      // First check for HTML in response when expecting JSON
      // This needs to happen BEFORE we try to parse JSON
      if (isHtmlResponse(responseText)) {
        // Determine if this is likely an auth-related HTML (login page, etc.)
        const isAuthRelated = isAuthRelatedHtml(responseText);
        const errorType = isAuthRelated ? "authentication" : "parsing";
        const errorMessage = isAuthRelated 
          ? "Received HTML login page instead of JSON. Your session may have expired." 
          : "Received HTML instead of JSON data.";
          
        addError({
          message: errorMessage,
          type: errorType,
          url,
          status: response.status,
          responsePreview: responseText.slice(0, 500) + (responseText.length > 500 ? '...' : '')
        });
        
        throw new Error(`${isAuthRelated ? "Authentication" : "Format"} error: Received HTML instead of expected JSON data`);
      }

      // Try to parse as JSON
      let data: T;
      try {
        data = JSON.parse(responseText) as T;
        console.log("[Debug] Successfully parsed JSON.", 
          Array.isArray(data) 
            ? `Found ${data.length} items.` 
            : (typeof data === 'object' && data 
                ? `Object with keys: ${Object.keys(data).join(', ')}` 
                : `Value: ${String(data)}`)
        );
      } catch (parseError) {
        // If we got here with HTML content, it means our HTML detection failed
        // Double-check if the content might be HTML that wasn't caught earlier
        if (responseText.includes('<') && responseText.includes('>')) {
          console.error("[Debug] Possible HTML content detected after JSON parse failure");
          
          // Check if it looks like HTML content
          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
            addError({
              message: "Received HTML instead of JSON. Session may have expired.",
              type: "authentication",
              url,
              status: response.status,
              responsePreview: responseText.slice(0, 500) + (responseText.length > 500 ? '...' : ''),
              details: { parseError: (parseError as Error).message }
            });
            throw new Error("Authentication error: Received HTML instead of expected JSON format");
          }
        }
        
        // Otherwise, handle as a standard parsing error
        console.error("[Debug] Failed to parse response as JSON", parseError);
        addError({
          message: "Failed to parse response as JSON",
          type: "parsing",
          url,
          status: response.status,
          responsePreview: responseText.slice(0, 500) + (responseText.length > 500 ? '...' : ''),
          details: { parseError: (parseError as Error).message }
        });
        throw parseError;
      }

      // Handle API errors
      if (!response.ok) {
        const errorMessage = typeof data === 'object' && data && 'message' in data 
          ? String(data.message) 
          : `API returned error status: ${response.status}`;
          
        addError({
          message: errorMessage,
          type: "response",
          url,
          status: response.status,
          responsePreview: JSON.stringify(data, null, 2),
          details: typeof data === 'object' ? data as Record<string, any> : { data }
        });
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      // If it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        addError({
          message: `Network error accessing ${url}`,
          type: "network",
          url,
          stack: (error as Error).stack,
          details: { errorMessage: (error as Error).message }
        });
      } 
      // If it wasn't already handled as a specific error type above
      else if (!(error instanceof Error) || !error.message.includes('Authentication error') && !error.message.includes('API error')) {
        addError({
          message: (error as Error).message || "Unknown error occurred",
          type: "unknown",
          url,
          stack: (error as Error).stack,
          details: { error }
        });
      }
      
      throw error;
    }
  };

  /**
   * Perform API action with enhanced error reporting
   */
  const performAction = async <T = any>({
    url,
    method = 'GET',
    data,
    onSuccess,
    contentType = 'application/json'
  }: {
    url: string;
    method?: string;
    data?: any;
    onSuccess?: (data: T) => void;
    contentType?: string;
  }): Promise<T> => {
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': contentType,
        },
        credentials: 'include',
      };

      if (data) {
        options.body = contentType === 'application/json' ? JSON.stringify(data) : data;
      }

      const result = await debugFetch<T>(url, options);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      console.error(`[API Error] ${method} ${url}:`, error);
      throw error;
    }
  };

  /**
   * Invalidate a query to refresh data
   */
  const invalidateQuery = (queryKey: string | string[]) => {
    queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
  };

  return {
    debugFetch,
    performAction,
    invalidateQuery,
  };
}