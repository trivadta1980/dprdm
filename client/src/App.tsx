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
import HelpPage from "@/pages/help-page";
import RelationshipsPage from "@/pages/relationships-page";
import RelationshipValuesPage from "@/pages/relationship-values-page";
import ApiTestPage from "@/pages/api-test-page";
import CrosswalkPage from "@/pages/crosswalk-page";
import CrosswalksListPage from "@/pages/crosswalks-list-page";

function Router() {
  console.log('Router: Initializing routes');
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/users" component={UsersPage} adminOnly />
      <ProtectedRoute path="/roles" component={RolesPage} adminOnly />
      <ProtectedRoute path="/reference-types" component={ReferenceTypesPage} />
      <ProtectedRoute path="/reference-data" component={ReferenceDataPage} />
      <ProtectedRoute path="/reference-data/create" component={ReferenceDataCreatePage} />
      <ProtectedRoute path="/reference-data/:id/instances" component={ReferenceDataInstancesPage} />
      <ProtectedRoute path="/relationships" component={RelationshipsPage} />
      <ProtectedRoute path="/relationships/:id/values" component={RelationshipValuesPage} />
      <ProtectedRoute path="/crosswalks/create" component={CrosswalkPage} />
      <ProtectedRoute path="/crosswalks/:id/edit" component={CrosswalkPage} />
      <ProtectedRoute path="/crosswalks/:id" component={CrosswalkPage} />
      <ProtectedRoute path="/crosswalks" component={CrosswalksListPage} />
      <ProtectedRoute path="/help" component={HelpPage} />
      <ProtectedRoute path="/api-test" component={ApiTestPage} />
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