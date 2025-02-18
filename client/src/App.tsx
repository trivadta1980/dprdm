import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import PlaceholderPage from "@/pages/placeholder-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute 
        path="/users" 
        component={() => <PlaceholderPage title="User Management" />} 
      />
      <ProtectedRoute 
        path="/reference-types" 
        component={() => <PlaceholderPage title="Reference Data Type Management" />} 
      />
      <ProtectedRoute 
        path="/reference-data" 
        component={() => <PlaceholderPage title="Reference Data Management" />} 
      />
      <ProtectedRoute 
        path="/relationships" 
        component={() => <PlaceholderPage title="Relationship Management" />} 
      />
      <ProtectedRoute 
        path="/crosswalks" 
        component={() => <PlaceholderPage title="Crosswalk Management" />} 
      />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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