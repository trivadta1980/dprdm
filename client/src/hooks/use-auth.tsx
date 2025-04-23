import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser, resetPasswordRequestSchema, resetPasswordSchema } from "@shared/schema";

// Extended User type with routes from role
interface UserWithRoutes extends SelectUser {
  routes?: string[];
}
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as z from 'zod';

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  requestResetMutation: UseMutationResult<void, Error, { email: string }>;
  resetPasswordMutation: UseMutationResult<void, Error, z.infer<typeof resetPasswordSchema>>;
  isAdmin: boolean;
  changePassword: (currentPassword: string, newPassword: string) => Promise<any>;
  // Add hasPermission function to check route permissions
  hasPermission: (route: string) => boolean;
  allowedRoutes: string[];
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log('Login mutation started with:', { username: credentials.username });
      try {
        console.log('Sending login request...');
        const res = await apiRequest("login", {
          method: "POST",
          data: credentials
        });

        console.log('Login response received:', {
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries())
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error('Login response not OK:', errorData);
          throw new Error(errorData.message || 'Login failed');
        }

        const data = await res.json();
        console.log('Login successful, parsed response:', data);
        return data;
      } catch (error) {
        console.error('Login error details:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error instanceof Error ? error : new Error('Authentication failed');
      }
    },
    onSuccess: (user: SelectUser) => {
      console.log('Login mutation success - updating user data:', user);
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Login mutation error:', {
        error,
        message: error.message,
        stack: error.stack
      });
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      console.log('Registration attempt with:', { username: credentials.username, email: credentials.email });
      const res = await apiRequest("/register", {
        method: "POST",
        data: credentials
      });
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Success",
        description: "Registration successful"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/logout", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const requestResetMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await apiRequest("/reset-password/request", {
        method: "POST",
        data
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send reset email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof resetPasswordSchema>) => {
      await apiRequest("/reset-password", {
        method: "POST",
        data
      });
    },
    onSuccess: () => {
      toast({
        title: "Password reset successful",
        description: "You can now login with your new password.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isAdmin = user?.roleId === 1 || Number(user?.roleId) === 1;

  // Get allowed routes from user's routes field
  const allowedRoutes = user?.routes as string[] || [];
  
  // Function to check if a user has permission for a specific route
  const hasPermission = (route: string): boolean => {
    // Admin has access to everything
    if (isAdmin) return true;
    
    // Check if the route is in the user's allowed routes
    if (!user || !allowedRoutes.length) return false;
    
    // Normalize the route for comparison (remove trailing slashes)
    const normalizedRoute = route.endsWith('/') ? route.slice(0, -1) : route;
    
    // Check if the exact route is allowed
    return allowedRoutes.some((allowedRoute: string) => {
      // Normalize allowed route
      const normalizedAllowedRoute = allowedRoute.endsWith('/') 
        ? allowedRoute.slice(0, -1) 
        : allowedRoute;
      
      // Check for exact match or if it's a parent route
      return normalizedRoute === normalizedAllowedRoute ||
             normalizedRoute.startsWith(normalizedAllowedRoute + '/');
    });
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await apiRequest("/auth/change-password", {
        method: "POST",
        data: { currentPassword, newPassword }
      });
      return await response.json();
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        requestResetMutation,
        resetPasswordMutation,
        isAdmin,
        changePassword,
        hasPermission,
        allowedRoutes,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Instead of throwing an error, provide a fallback context with safe default values
    // This prevents the application from crashing when the context isn't available yet
    console.warn("useAuth hook used outside AuthProvider - using fallback values");
    return {
      user: null,
      isLoading: true,
      error: null,
      loginMutation: {} as any,
      logoutMutation: {} as any,
      registerMutation: {} as any,
      requestResetMutation: {} as any,
      resetPasswordMutation: {} as any,
      isAdmin: false,
      changePassword: async () => ({ success: false, error: "Auth provider not available" }),
      hasPermission: () => false,
      allowedRoutes: [],
    };
  }
  return context;
}