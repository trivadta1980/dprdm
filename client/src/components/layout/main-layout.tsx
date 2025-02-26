import { ReactNode, useState } from "react";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Database, HelpCircle } from "lucide-react";
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
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [showPasswordDialog, setShowPasswordDialog] = useState(user?.requirePasswordChange ?? false);
  const [_, setLocation] = useLocation();

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

          <div className="flex-1 flex flex-col h-screen">
            <header className="border-b p-4 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <Database className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Reference Data Management</h1>
                  <p className="text-sm text-gray-500">Welcome, {user?.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Logo size="sm" className="hidden md:block" />
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>

            <footer className="border-t py-4 px-6 bg-white">
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm text-gray-600">Powered by</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600">Blumetra Solutions</span>
                  <Logo size="sm" />
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