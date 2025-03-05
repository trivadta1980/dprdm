import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { lazy, Suspense } from "react";
import { Route, Router } from "wouter"; // Assuming wouter is used
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import ProtectedRoute from "@/lib/protected-route";
import DebugPanel from '@/pages/debug-panel';

// Lazy load pages
const HomePage = lazy(() => import("@/pages/home-page"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const ManageUsersPage = lazy(() => import("@/pages/manage-users-page"));
const RolesPage = lazy(() => import("@/pages/roles-page"));
const ReferenceTypesPage = lazy(() => import("@/pages/reference-types-page"));
const ReferenceDataPage = lazy(() => import("@/pages/reference-data-page"));
const ReferenceDataCreatePage = lazy(() => import("@/pages/reference-data-create-page"));
const ReferenceDataInstancesPage = lazy(() => import("@/pages/reference-data-instances-page"));
const RelationshipsPage = lazy(() => import("@/pages/relationships-page"));
const RelationshipValuesPage = lazy(() => import("@/pages/relationship-values-page"));
const CrosswalksPage = lazy(() => import("@/pages/crosswalks-list-page"));
const CrosswalkPage = lazy(() => import("@/pages/crosswalk-page"));
const ChangePasswordPage = lazy(() => import("@/pages/change-password"));
const ApiTestPage = lazy(() => import("@/pages/api-test-page"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password-page"));
const GraphVisualizationPage = lazy(() => import("@/pages/graph-visualization-page")); // Added GraphVisualizationPage


export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <Router>
              <Route path="/auth" component={AuthPage} />
              <Route path="/reset-password" component={ResetPasswordPage} />
              <Route path="/">
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              </Route>
              <Route path="/manage-users">
                <ProtectedRoute adminOnly>
                  <ManageUsersPage />
                </ProtectedRoute>
              </Route>
              <Route path="/roles">
                <ProtectedRoute adminOnly>
                  <RolesPage />
                </ProtectedRoute>
              </Route>
              <Route path="/reference-types">
                <ProtectedRoute>
                  <ReferenceTypesPage />
                </ProtectedRoute>
              </Route>
              <Route path="/reference-data/create">
                <ProtectedRoute>
                  <ReferenceDataCreatePage />
                </ProtectedRoute>
              </Route>
              <Route path="/reference-data/:id/instances">
                <ProtectedRoute>
                  <ReferenceDataInstancesPage />
                </ProtectedRoute>
              </Route>
              <Route path="/reference-data">
                <ProtectedRoute>
                  <ReferenceDataPage />
                </ProtectedRoute>
              </Route>
              <Route path="/relationships">
                <ProtectedRoute>
                  <RelationshipsPage />
                </ProtectedRoute>
              </Route>
              <Route path="/relationships/:id/values">
                <ProtectedRoute>
                  <RelationshipValuesPage />
                </ProtectedRoute>
              </Route>
              <Route path="/crosswalks">
                <ProtectedRoute>
                  <CrosswalksPage />
                </ProtectedRoute>
              </Route>
              <Route path="/crosswalks/:id/edit">
                <ProtectedRoute>
                  <CrosswalkPage />
                </ProtectedRoute>
              </Route>
              <Route path="/change-password">
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              </Route>
              <Route path="/api-test">
                <ProtectedRoute>
                  <ApiTestPage />
                </ProtectedRoute>
              </Route>
              <Route path="/debug" component={DebugPanel} />
              <Route path="/graph-visualization" component={GraphVisualizationPage} /> {/* Added route for graph visualization */}
            </Router>
          </Suspense>
          <Toaster />
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}