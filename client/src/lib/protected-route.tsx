
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { ReactNode, useEffect } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({
  children,
  adminOnly = false,
}: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { user, isLoading, isAdmin } = useAuth();
  const path = window.location.pathname;

  console.log("ProtectedRoute Debug:", {
    path,
    isLoading,
    hasUser: !!user,
    isAdmin,
  });

  useEffect(() => {
    if (!isLoading) {
      // Not logged in
      if (!user) {
        console.log("ProtectedRoute: Redirecting to auth, not authenticated");
        setLocation("/auth");
        return;
      }

      // Require admin but user is not admin
      if (adminOnly && !isAdmin) {
        console.log("ProtectedRoute: Redirecting to auth, not authenticated or not admin");
        setLocation("/");
        return;
      }

      console.log("ProtectedRoute: Rendering protected component for path:", path);
    }
  }, [isLoading, user, adminOnly, isAdmin, setLocation, path]);

  // Show loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If not logged in, don't render anything (redirect happens in useEffect)
  if (!user) {
    return null;
  }

  // Admin only and user is not admin
  if (adminOnly && !isAdmin) {
    return null;
  }

  // Otherwise render children
  return <>{children}</>;
}
