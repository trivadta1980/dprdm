import { ReactNode, useState } from "react";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Database, HelpCircle, User, KeyRound, LogOut, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ChangePassword, changePasswordSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Logo } from "@/components/ui/logo";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [showPasswordDialog, setShowPasswordDialog] = useState(user?.requirePasswordChange ?? false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [_, setLocation] = useLocation();

  const navigateToBlumetra = () => {
    window.open('https://www.blumetra.com', '_blank');
  };

  const form = useForm<ChangePassword>({
    resolver: zodResolver(changePasswordSchema),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePassword) => {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to change password");
      }
      
      return true;
    },
    onSuccess: () => {
      setShowPasswordDialog(false);
      toast({
        title: "Password changed",
        description: "Your password has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to change password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ChangePassword) {
    changePasswordMutation.mutate(data);
  }

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1">
          <Sidebar className="w-64 hidden md:block" />

          <div className="flex-1 flex flex-col h-screen relative">
            {/* Background Layer with Data Visualization Theme */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              {/* Base pattern layer */}
              <div 
                className="absolute inset-0 bg-repeat opacity-20"
                style={{ 
                  backgroundImage: 'url("/assets/images/data-background.svg")',
                  backgroundSize: '800px 800px'
                }}
              ></div>
              {/* Gradient overlay for better readability */}
              <div 
                className="absolute inset-0"
                style={{ 
                  backgroundImage: 'url("/assets/images/gradient-overlay.svg")',
                  backgroundSize: 'cover'
                }}
              ></div>
            </div>

            <header className="border-b p-4 flex justify-between items-center bg-white relative z-10">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation('/')}>
                <Database className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 hover:text-primary transition-colors">
                    Reference Data Management
                  </h1>
                  <p className="text-sm text-gray-500">Welcome, {user?.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHelpDialog(true)}
                    className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Help
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Account
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        {user?.username}
                        <div className="text-xs text-muted-foreground">
                          {user?.email}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowPasswordDialog(true)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Change Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => logoutMutation.mutate()}
                        className="text-red-600"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Logo size="sm" className="hidden md:block" onClick={navigateToBlumetra} />
              </div>
            </header>

            <main className="flex-1 overflow-auto p-6 relative z-10">
              {children}
            </main>

            <footer className="border-t py-2 px-4 bg-white relative z-10">
              <div className="flex justify-between items-center">
                <div className="text-[10px] text-gray-500">
                  © {new Date().getFullYear()} Blumetra Solutions. All rights reserved.
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Powered by</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-600">Blumetra Solutions</span>
                    <Logo size="footer" onClick={navigateToBlumetra} />
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {user?.requirePasswordChange ? "Change Password Required" : "Change Your Password"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={changePasswordMutation.isPending}
              >
                Change Password
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Reference Data Management Help</DialogTitle>
            <DialogDescription>
              Get help with using the Reference Data Management system
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Getting Started</h3>
              <p>
                The Reference Data Management (RDM) system allows you to manage, organize, and map reference data 
                across your organization. Use the navigation menu on the left to access different features.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Key Features</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Reference Data Types</strong> - Define schemas and formats for different types of reference data</li>
                <li><strong>Reference Data</strong> - Manage core reference data sets and instances</li>
                <li><strong>Relationships</strong> - Define and manage relationships between data entities</li>
                <li><strong>Crosswalks</strong> - Create and manage data mapping between different systems</li>
                <li><strong>Approvals</strong> - Review and approve data mapping submissions</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">User Management</h3>
              <p>
                Administrators can manage users and roles via the <strong>Manage Users</strong> and <strong>Manage Roles</strong> sections.
                Each role defines specific permissions for accessing different parts of the system.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Data Visualization</h3>
              <p>
                The system provides advanced visualization tools to help you understand relationships
                between different data sets and track data lineage across your systems.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Need More Help?</h3>
              <p>
                For more detailed information or assistance with specific features, please contact
                your system administrator or the Blumetra support team.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => window.open('https://www.blumetra.com/contact', '_blank')}
              className="flex items-center mr-2"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <Button onClick={() => setShowHelpDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}