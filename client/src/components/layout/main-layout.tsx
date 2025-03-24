import { ReactNode, useState } from "react";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Database, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showPasswordDialog, setShowPasswordDialog] = useState(user?.requirePasswordChange ?? false);
  const [_, setLocation] = useLocation();

  const navigateToBlumetra = () => {
    window.open('https://www.blumetra.com', '_blank');
  };

  const form = useForm<ChangePassword>({
    resolver: zodResolver(changePasswordSchema),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePassword) => {
      await apiRequest("POST", "/api/change-password", data);
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
                className="absolute inset-0 bg-repeat opacity-20 data-bg-pattern animated-bg"
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
                    onClick={() => setLocation('/help')}
                    className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Help
                  </Button>
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
            <DialogTitle>Change Password Required</DialogTitle>
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
    </>
  );
}