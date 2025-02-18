import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { availableRoutes } from "@shared/schema";

export function ProtectedRoute({
  path,
  component: Component,
  adminOnly = false,
}: {
  path: string;
  component: () => React.JSX.Element;
  adminOnly?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Admin users have access to all routes
  if (user.roleId === 1) {
    return <Route path={path} component={Component} />;
  }

  // For non-admin users, check if they have permission to access this route
  const route = availableRoutes.find(r => r.path === path);
  const userRole = user.role;

  // If route is admin-only or user doesn't have permission, redirect to home
  if (adminOnly || route?.adminOnly || !userRole?.routePermissions?.includes(path)) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}