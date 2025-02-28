import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertUser, insertUserSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function UserTestPage() {
  const { toast } = useToast();
  const [debugLogs, setDebugLogs] = useState<Array<{ message: string; data?: any; time: string }>>([]);

  const addDebugLog = (message: string, data?: any) => {
    setDebugLogs(prev => [...prev, {
      message,
      data,
      time: new Date().toLocaleTimeString()
    }]);
    console.log(`Debug: ${message}`, data);
  };

  // Initialize form
  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      username: "",
      roleId: undefined,
      password: "password123",
      confirmPassword: "password123"
    }
  });

  // Fetch roles for the select input
  const { data: roles } = useQuery({
    queryKey: ["/api/roles"],
    queryFn: async () => {
      addDebugLog("Fetching roles");
      const res = await apiRequest("GET", "/api/roles");
      const data = await res.json();
      addDebugLog("Roles fetched", data);
      return data;
    }
  });

  // Create user mutation
  const createUser = useMutation({
    mutationFn: async (data: InsertUser) => {
      addDebugLog("Creating user", data);
      const res = await apiRequest("POST", "/api/register", data);
      if (!res.ok) {
        const error = await res.json();
        addDebugLog("Create user error", error);
        throw new Error(error.message || "Failed to create user");
      }
      const result = await res.json();
      addDebugLog("User created successfully", result);
      return result;
    },
    onSuccess: () => {
      addDebugLog("Create user mutation succeeded");
      form.reset();
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error: Error) => {
      addDebugLog("Create user mutation failed", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    addDebugLog("Form submitted", data);
    addDebugLog("Form state", form.formState);
    
    try {
      await createUser.mutateAsync(data);
    } catch (error) {
      addDebugLog("Submit handler error", error);
    }
  });

  return (
    <MainLayout>
      <div className="container py-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Test User Creation</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={onSubmit} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="test@example.com" 
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              addDebugLog("Email changed", e.target.value);
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
                            placeholder="testuser" 
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              addDebugLog("Username changed", e.target.value);
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
                            addDebugLog("Role selected", value);
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
                    disabled={createUser.isPending}
                  >
                    {createUser.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Test User"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Debug Log</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                size="sm" 
                className="mb-4"
                onClick={() => setDebugLogs([])}
              >
                Clear Logs
              </Button>
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <div className="space-y-4">
                  {debugLogs.map((log, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{log.message}</span>
                        <span className="text-muted-foreground">{log.time}</span>
                      </div>
                      {log.data && (
                        <pre className="text-xs bg-slate-100 p-2 rounded-md overflow-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
