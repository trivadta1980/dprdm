
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { ReactNode, useEffect } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
  requiredPermission?: string;
}

export default function ProtectedRoute({
  children,
  adminOnly = false,
  requiredPermission,
}: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { user, isLoading, isAdmin, hasPermission, allowedRoutes } = useAuth();
  const path = window.location.pathname;

  // Normalize path for comparison (remove trailing slash)
  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
  
  // Get the base route for permission checking
  // For example, /reference-data/123/edit -> /reference-data
  let baseRoute = normalizedPath;
  const firstSlashAfterRoot = normalizedPath.indexOf('/', 1);
  if (firstSlashAfterRoot !== -1) {
    baseRoute = normalizedPath.substring(0, firstSlashAfterRoot);
  }

  // Check if the user has permission for this route
  const hasRoutePermission = requiredPermission 
    ? hasPermission(requiredPermission)
    : hasPermission(baseRoute);

  console.log("ProtectedRoute Debug:", {
    path,
    baseRoute,
    isLoading,
    hasUser: !!user,
    isAdmin,
    allowedRoutes,
    hasRoutePermission,
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
        console.log("ProtectedRoute: Redirecting to home, not admin");
        setLocation("/");
        return;
      }

      // Check if user has permission for this route
      if (!hasRoutePermission && !isAdmin) {
        console.log("ProtectedRoute: Redirecting to home, no permission for route", baseRoute);
        setLocation("/");
        return;
      }

      console.log("ProtectedRoute: Rendering protected component for path:", path);
    }
  }, [isLoading, user, adminOnly, isAdmin, hasRoutePermission, setLocation, path, baseRoute]);

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

  // No permission for route
  if (!hasRoutePermission && !isAdmin) {
    return null;
  }

  // Otherwise render children
  return <>{children}</>;
}
