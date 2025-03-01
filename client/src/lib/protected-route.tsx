import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
    path,
    component: Component,
    adminOnly = false,
  }: {
    path: string;
    component: React.ComponentType<any>;
    adminOnly?: boolean;
  }) {
    const { user, isLoading } = useAuth();
    // Force convert roleId to a number to ensure correct comparison
    const isAdmin = user?.roleId === 1 || Number(user?.roleId) === 1;
    
    console.log('ProtectedRoute Debug:', {
      path,
      isLoading,
      hasUser: !!user,
      isAdmin,
      roleId: user?.roleId,
      roleIdType: user ? typeof user.roleId : 'undefined'
    });

    if (isLoading) {
      return (
        <Route path={path}>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        </Route>
      );
    }

    if (!user || (adminOnly && !isAdmin)) {
      console.log('ProtectedRoute: Redirecting to auth, not authenticated or not admin');
      return (
        <Route path={path}>
          <Redirect to="/auth" />
        </Route>
      );
    }

    console.log('ProtectedRoute: Rendering protected component for path:', path);
    return <Route path={path} component={Component} />;
  }