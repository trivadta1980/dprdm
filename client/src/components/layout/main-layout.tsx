import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar className="w-64 hidden md:block" />
      
      <div className="flex-1">
        <header className="border-b p-4 flex justify-between items-center bg-background">
          <h1 className="text-xl font-semibold">Welcome, {user?.username}</h1>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </header>
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
