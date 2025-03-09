import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// ... other imports ...


export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // This ensures cookies are sent with the request
  });

  if (res.status === 401) {
    console.error('Authentication error - redirecting to login');
    window.location.href = '/login';
    throw new Error('Authentication required');
  }

  await throwIfResNotOk(res);
  return res;
}

// ... rest of the file (assumed to exist but not provided) ...

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const message = `Error: ${res.status} ${res.statusText}`;
    const errorData = await res.json().catch(() => ({})); //Attempt to parse error response, but handle potential failures.
    const detailedMessage = errorData.message ? `${message}\nDetails: ${errorData.message}` : message; //Improve error message with details if available.
    throw new Error(detailedMessage);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const [, url, ...params] = queryKey;
        const res = await apiRequest('GET', url, params);
        return res.json();
      },
    },
  },
});


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ... Your application components ... */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;