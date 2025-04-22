import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Loader2, 
  Database, 
  GitFork, 
  History, 
  GitCompare, 
  BarChart3, 
  Globe, 
  Shield, 
  Layers, 
  FileText,
  Network,
  AreaChart,
  FileJson,
  Search,
  Workflow
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/ui/logo";
import { Separator } from "@/components/ui/separator";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext 
} from "@/components/ui/carousel";

type LoginData = Pick<InsertUser, "username" | "password">;

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const resetPasswordRequestSchema = z.object({
  email: z.string().email("Invalid email"),
});

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation, requestResetMutation } = useAuth();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('AuthPage: User state changed:', {
      user,
      timestamp: new Date().toISOString()
    });
    if (user) {
      console.log('AuthPage: Redirecting to home, user authenticated');
      setLocation("/");
    }
  }, [user, setLocation]);

  // Initialize form with empty strings to prevent uncontrolled to controlled warnings
  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      roleId: 2, // Default to regular user role
    }
  });

  const resetForm = useForm<{ email: string }>({
    resolver: zodResolver(resetPasswordRequestSchema),
    defaultValues: {
      email: ""
    }
  });

  function onLogin(data: LoginData) {
    console.log('AuthPage: Login form submitted', {
      username: data.username,
      timestamp: new Date().toISOString()
    });

    loginMutation.mutate(data, {
      onError: (error: Error) => {
        console.error('AuthPage: Login error:', {
          error,
          message: error.message,
          timestamp: new Date().toISOString()
        });
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials or server error",
          variant: "destructive",
        });
      },
      onSuccess: () => {
        console.log('AuthPage: Login mutation completed successfully', {
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  function onRegister(data: InsertUser) {
    console.log('AuthPage: Registration attempt with:', { username: data.username, email: data.email });
    registerMutation.mutate(data, {
      onError: (error) => {
        console.error('AuthPage: Registration error:', error);
        toast({
          title: "Registration Failed",
          description: error.message || "Failed to create user account",
          variant: "destructive",
        });
      },
      onSuccess: (response) => {
        console.log('AuthPage: Registration successful:', response);
        toast({
          title: "Success",
          description: "User account created successfully",
        });
        loginForm.reset();
        registerForm.reset();
      }
    });
  }

  function onRequestReset(data: { email: string }) {
    requestResetMutation.mutate(data);
    setResetDialogOpen(false);
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3 mb-4">
              <Logo size="md" />
              <h1 className="text-2xl font-semibold text-primary">Blumetra</h1>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to RDM!!!!</CardTitle>
            <CardDescription>
              Sign in to Reference Data Management Console
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      console.log('AuthPage: Login form submitted');
                      loginForm.handleSubmit(onLogin)(e);
                    }}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="link" className="px-0">
                            Forgot password?
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                          </DialogHeader>
                          <Form {...resetForm}>
                            <form
                              onSubmit={resetForm.handleSubmit(onRequestReset)}
                              className="space-y-4"
                            >
                              <FormField
                                control={resetForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                      <Input type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="submit"
                                className="w-full"
                                disabled={requestResetMutation.isPending}
                              >
                                {requestResetMutation.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Send Reset Link
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Login
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      console.log('AuthPage: Registration form submitted');
                      registerForm.handleSubmit(onRegister)(e);
                    }}
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
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
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Register
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:block relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="absolute inset-0 data-bg-pattern opacity-5 animated-bg" 
             style={{ 
               backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zm20.97 0l9.315 9.314-1.414 1.414L34.828 0h2.83zM22.344 0L13.03 9.314l1.414 1.414L25.172 0h-2.83zM32 0l12.142 12.142-1.414 1.414L30 .828 17.272 13.556l-1.414-1.414L28 0h4zM.284 0l28 28-1.414 1.414L0 2.544v-.828L.282 0h.002zM0 5.373l25.456 25.455-1.414 1.415L0 8.2V5.374zm0 5.656l22.627 22.627-1.414 1.414L0 13.86v-2.83zm0 5.656l19.8 19.8-1.415 1.413L0 19.514v-2.83zm0 5.657l16.97 16.97-1.414 1.415L0 25.172v-2.83zM0 28l14.142 14.142-1.414 1.414L0 30.828V28zm0 5.657L11.314 44.97 9.9 46.386l-9.9-9.9v-2.828zm0 5.657L8.485 47.8 7.07 49.212 0 42.143v-2.83zm0 5.657l5.657 5.657-1.414 1.415L0 47.8v-2.83zm0 5.657l2.828 2.83-1.414 1.413L0 53.456v-2.83zM54.627 60L30 35.373 5.373 60H8.2L30 38.2 51.8 60h2.827zm-5.656 0L30 41.03 11.03 60h2.828L30 43.858 46.142 60h2.83zm-5.656 0L30 46.686 16.686 60h2.83L30 49.515 40.485 60h2.83zm-5.657 0L30 52.343 22.344 60h2.83L30 55.172 34.828 60h2.83zM32 60l-2-2-2 2h4zM59.716 0l-28 28 1.414 1.414L60 2.544v-.828L59.718 0h-.002zM60 5.373L34.544 30.828l1.414 1.415L60 8.2V5.374zm0 5.656L37.373 33.656l1.414 1.414L60 13.86v-2.83zm0 5.656l-19.8 19.8 1.415 1.413L60 19.514v-2.83zm0 5.657l-16.97 16.97 1.414 1.415L60 25.172v-2.83zM60 28L45.858 42.142l1.414 1.414L60 30.828V28zm0 5.657L48.686 44.97l1.415 1.415 9.9-9.9v-2.828zm0 5.657L51.515 47.8l1.414 1.413 7.07-7.07v-2.83zm0 5.657l-5.657 5.657 1.414 1.415L60 47.8v-2.83zm0 5.657l-2.828 2.83 1.414 1.413L60 53.456v-2.83zM39.9 16.385l1.414-1.414L30 3.657 18.686 14.97l1.415 1.415 9.9-9.9 9.9 9.9zm-2.83 2.828l1.415-1.414L30 9.313 21.515 17.8l1.414 1.413L30 11.8l7.07 7.414v-.002zm-2.827 2.83l1.414-1.416L30 14.97l-5.657 5.657 1.414 1.415L30 17.8l4.243 4.242zm-2.83 2.827l1.415-1.414L30 20.626l-2.828 2.83 1.414 1.414L30 23.456l1.414 1.414zM56.87 59.414L58.284 58 30 29.716 1.716 58l1.414 1.414L30 32.544l26.87 26.87z\' fill=\'%2320232a\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
               backgroundSize: '700px 700px'
             }}
        />
        <div className="w-full h-full flex items-center justify-center">
          <div className="max-w-xl mx-auto py-12 px-8 relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <Logo size="md" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent">
                  Reference Data Management
                </h1>
                <p className="text-blue-600 font-medium">Enterprise Solution</p>
              </div>
            </div>
            
            <Separator className="my-8" />
            
            <Carousel className="w-full max-w-xl mx-auto">
              <CarouselContent>
                {/* Slide 1: What is RDM - Visual Explanation */}
                <CarouselItem className="p-1">
                  <Card className="card-with-bg">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <FileText className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">What is Reference Data Management?</h3>
                          <p className="text-sm text-gray-500">Core Concepts Explained</p>
                        </div>
                      </div>
                      <div className="mt-3 mb-2">
                        <img 
                          src="/assets/images/rdm-concept.png" 
                          alt="Reference Data Management concepts" 
                          className="w-full h-auto object-contain rounded-md"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2 text-center italic">
                        The building blocks of an organization's data ecosystem
                      </p>
                    </CardContent>
                  </Card>
                </CarouselItem>
                
                {/* Slide 2: The Value of Reference Data Management */}
                <CarouselItem className="p-1">
                  <Card className="card-with-bg">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-teal-100 rounded-lg">
                          <Network className="h-8 w-8 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">The Value of Reference Data Management</h3>
                          <p className="text-sm text-gray-500">Key Business Benefits</p>
                        </div>
                      </div>
                      <div className="mt-3 mb-2">
                        <img 
                          src="/assets/images/rdm-value.png" 
                          alt="The Value of Reference Data Management" 
                          className="w-full h-auto object-contain rounded-md"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2 text-center italic">
                        Deliver lasting value through improved data quality and business alignment
                      </p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              </CarouselContent>
              <div className="flex justify-center mt-4">
                <CarouselPrevious className="relative mx-1 inset-0 translate-y-0" />
                <CarouselNext className="relative mx-1 inset-0 translate-y-0" />
              </div>
            </Carousel>
            
            <div className="flex flex-col items-center mt-8">
              <p className="text-center text-sm text-gray-500 max-w-md">
                Trusted by organizations worldwide to manage critical reference data
                and streamline information governance processes.
              </p>
              <div className="mt-4 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span className="w-5 h-1 rounded-full bg-blue-400"></span>
                <span className="w-3 h-1 rounded-full bg-blue-300"></span>
                <span className="ml-1 text-blue-600 text-xs font-semibold">Blumetra Solutions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}