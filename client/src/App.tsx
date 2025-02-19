import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import UsersPage from "@/pages/users-page";
import RolesPage from "@/pages/roles-page";
import ReferenceTypesPage from "@/pages/reference-types-page";
import PlaceholderPage from "@/pages/placeholder-page";
import NotFound from "@/pages/not-found";
import ReferenceDataPage from "@/pages/reference-data-page";
import ReferenceDataCreatePage from "@/pages/reference-data-create-page";
import ReferenceDataInstancesPage from "@/pages/reference-data-instances-page";
import HelpPage from "@/pages/help-page"; // Added import

function Router() {
  console.log('Router: Initializing routes');
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/users" component={UsersPage} adminOnly />
      <ProtectedRoute path="/roles" component={RolesPage} adminOnly />
      <ProtectedRoute path="/reference-types" component={ReferenceTypesPage} />
      <ProtectedRoute path="/reference-data" component={ReferenceDataPage} />
      <ProtectedRoute path="/reference-data/create" component={ReferenceDataCreatePage} />
      <ProtectedRoute path="/reference-data/:id/instances" component={ReferenceDataInstancesPage} />
      <ProtectedRoute
        path="/relationships"
        component={() => <PlaceholderPage title="Relationship Management" />}
      />
      <ProtectedRoute
        path="/crosswalks"
        component={() => <PlaceholderPage title="Crosswalk Management" />}
      />
      <ProtectedRoute path="/help" component={HelpPage} /> {/* Added route */}
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  console.log('App: Initializing application');
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;