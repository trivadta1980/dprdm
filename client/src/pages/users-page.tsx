import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Role, InsertUser, insertUserSchema } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function UsersPage() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [debugSteps, setDebugSteps] = useState<Array<{ step: string; data?: any; timestamp: string }>>([]);

  // Debug logging function
  const addDebugStep = (step: string, data?: any) => {
    setDebugSteps(prev => [...prev, {
      step,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
    console.log(`Debug Step: ${step}`, data);
  };

  // Create form
  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      username: "",
      roleId: undefined
    }
  });

  // Fetch users
  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      addDebugStep("Fetching users");
      const res = await apiRequest("GET", "/api/users");
      const data = await res.json();
      addDebugStep("Users fetched", data);
      return data;
    }
  });

  // Fetch roles
  const { data: roles } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
    queryFn: async () => {
      addDebugStep("Fetching roles");
      const res = await apiRequest("GET", "/api/roles");
      const data = await res.json();
      addDebugStep("Roles fetched", data);
      return data;
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      addDebugStep("Starting user creation", data);
      const res = await apiRequest("POST", "/api/register", data);
      if (!res.ok) {
        const error = await res.json();
        addDebugStep("Create user error", error);
        throw new Error(error.message || "Failed to create user");
      }
      const result = await res.json();
      addDebugStep("Create user success", result);
      return result;
    },
    onSuccess: () => {
      addDebugStep("Mutation success - updating UI");
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setCreateDialogOpen(false);
      form.reset();
      setDebugSteps([]);
      toast({
        title: "Success",
        description: "User created successfully"
      });
    },
    onError: (error: Error) => {
      addDebugStep("Mutation error", error.message);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (data: InsertUser) => {
    addDebugStep("Form submission started", data);
    addDebugStep("Form validation state", form.formState.errors);

    if (!data.email || !data.username || !data.roleId) {
      addDebugStep("Validation failed - missing required fields", {
        email: !data.email,
        username: !data.username,
        roleId: !data.roleId
      });
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const formData = {
        ...data,
        password: "password123",
        confirmPassword: "password123"
      };
      addDebugStep("Submitting form data", formData);
      await createUserMutation.mutateAsync(formData);
    } catch (error) {
      addDebugStep("Form submission error", error);
      console.error('Create user submission error:', error);
    }
  };

  if (loadingUsers) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-6 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Users List</h1>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => addDebugStep("Create dialog opened")}>
                <Plus className="h-4 w-4 mr-2" />
                New User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="user@example.com" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  addDebugStep("Email field changed", e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="username" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  addDebugStep("Username field changed", e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="roleId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                addDebugStep("Role selected", value);
                                field.onChange(Number(value));
                              }}
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roles?.map((role) => (
                                  <SelectItem
                                    key={role.id}
                                    value={role.id.toString()}
                                  >
                                    {role.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={createUserMutation.isPending}
                        onClick={() => addDebugStep("Submit button clicked")}
                      >
                        {createUserMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create User"
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>

                {/* Debug Panel */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Debug Steps</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mb-2"
                    onClick={() => setDebugSteps([])}
                  >
                    Clear Debug Log
                  </Button>
                  <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                    <div className="space-y-4">
                      {debugSteps.map((step, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{step.step}</span>
                            <span className="text-muted-foreground">{step.timestamp}</span>
                          </div>
                          {step.data && (
                            <pre className="text-xs bg-slate-100 p-2 rounded-md overflow-auto">
                              {JSON.stringify(step.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {roles?.find((r) => r.id === user.roleId)?.name}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}