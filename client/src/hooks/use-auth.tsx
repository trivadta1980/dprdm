import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser, resetPasswordRequestSchema, resetPasswordSchema } from "@shared/schema";
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
      console.log('Login attempt with:', { username: credentials.username });
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        console.log('Login response status:', res.status);
        const data = await res.json();
        console.log('Login response data:', data);
        return data;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      console.log('Login successful, updating user data:', user);
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      console.error('Login mutation error:', error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      console.log('Registration attempt with:', { username: credentials.username, email: credentials.email });
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      console.log('Registration successful, updating user data:', user);
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('Logout attempt');
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      console.log('Logout successful');
      queryClient.setQueryData(["/api/user"], null);
    },
    onError: (error: Error) => {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const requestResetMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await apiRequest("POST", "/api/reset-password/request", data);
      if (process.env.NODE_ENV === "development") {
        return await res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password.",
      });
    },
    onError: (error: Error) => {
      console.error('Password reset request error:', error);
      toast({
        title: "Failed to send reset email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof resetPasswordSchema>) => {
      await apiRequest("POST", "/api/reset-password", data);
    },
    onSuccess: () => {
      toast({
        title: "Password reset successful",
        description: "You can now login with your new password.",
      });
    },
    onError: (error: Error) => {
      console.error('Password reset error:', error);
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isAdmin = user?.roleId === 1 || Number(user?.roleId) === 1;

  const changePassword = async (currentPassword: string, newPassword: string) => {
    console.log('Password change attempt');
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Password change error:', error);
        throw new Error(error.message || "Failed to change password");
      }

      console.log('Password change successful');
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}