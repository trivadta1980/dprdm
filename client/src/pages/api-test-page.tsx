import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertUser, insertUserSchema } from "@shared/schema";


interface ReferenceData {
  id: number;
  name: string;
}

interface Instance {
  id: number;
  name: string;
}

const apiRequest = async (method: string, url: string, body?: any) => {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return fetch(url, options);
};

export default function ApiTestPage() {
  const { toast } = useToast();
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<any>(null);
  const [selectedSourceSystem, setSelectedSourceSystem] = useState<string | null>(null);
  const [selectedTargetSystem, setSelectedTargetSystem] = useState<string | null>(null);
  const [selectedSourceInstance, setSelectedSourceInstance] = useState<string | null>(null);
  const [selectedTargetInstance, setSelectedTargetInstance] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<Array<{ message: string; data?: any; time: string }>>([]);

  const addDebugLog = (message: string, data?: any) => {
    setDebugLogs(prev => [...prev, {
      message,
      data,
      time: new Date().toLocaleTimeString()
    }]);
    console.log(`Debug: ${message}`, data);
  };

  // Authentication endpoints test
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/user'],
    retry: false
  });

  // Reference Types endpoints test
  const { data: referenceTypes, isLoading: typesLoading } = useQuery({
    queryKey: ['/api/reference-types']
  });

  // Reference Data endpoints test
  const { data: referenceData = [], isLoading: dataLoading } = useQuery<ReferenceData[]>({
    queryKey: ['/api/reference-data']
  });

  // Source system instances
  const { data: sourceInstances = [], isLoading: sourceInstancesLoading } = useQuery<Instance[]>({
    queryKey: [`/api/reference-data/${selectedSourceSystem}/instances`],
    enabled: !!selectedSourceSystem
  });

  // Target system instances
  const { data: targetInstances = [], isLoading: targetInstancesLoading } = useQuery<Instance[]>({
    queryKey: [`/api/reference-data/${selectedTargetSystem}/instances`],
    enabled: !!selectedTargetSystem
  });

  // Relationships endpoints test
  const { data: relationships = [], isLoading: relationshipsLoading } = useQuery({
    queryKey: ['/api/relationships']
  });

  // Crosswalks endpoints test
  const { data: crosswalks = [], isLoading: crosswalksLoading } = useQuery({
    queryKey: ['/api/crosswalks']
  });

  const handleParamChange = (key: string, value: string) => {
    setTestParams(prev => ({ ...prev, [key]: value }));
  };

  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: any) => {
    setSelectedEndpoint(endpoint);
    try {
      const response = await apiRequest(method, endpoint, body);
      const data = await response.json();
      setResponse(data);
      toast({
        title: "Endpoint Test Result",
        description: `Status: ${response.status}`,
      });
    } catch (error) {
      toast({
        title: "Endpoint Test Failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setSelectedEndpoint(null);
    }
  };

  const renderResponse = (data: any) => {
    return (
      <ScrollArea className="h-[200px] w-full rounded-md border p-4">
        <pre className="text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      </ScrollArea>
    );
  };

  // Initialize form with valid default password values
  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      username: "",
      roleId: undefined,
      password: "Password123", // Meets password requirements
      confirmPassword: "Password123" // Matches password
    }
  });

  // Fetch roles for the select input
  const { data: roles } = useQuery({
    queryKey: ["/api/roles"],
    queryFn: async () => {
      addDebugLog("Fetching roles");
      const res = await fetch("/api/roles");
      const data = await res.json();
      addDebugLog("Roles fetched", data);
      return data;
    }
  });

  // Create user mutation
  const createUser = useMutation({
    mutationFn: async (data: InsertUser) => {
      addDebugLog("Starting user creation", data);
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

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
      setDebugLogs([]); // Clear debug logs on success
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

  const onSubmit = async (formData: InsertUser) => {
    setDebugLogs([]); // Clear previous debug logs
    addDebugLog("Form submission started", formData);
    addDebugLog("Form validation state", form.formState);

    try {
      await createUser.mutateAsync(formData);
    } catch (error) {
      addDebugLog("Submit handler error", error);
      console.error('Submit handler error:', error);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold">API Endpoint Testing</h1>

        <Tabs defaultValue="auth" className="w-full">
          <TabsList>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="types">Reference Types</TabsTrigger>
            <TabsTrigger value="data">Reference Data</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
            <TabsTrigger value="crosswalks">Crosswalks</TabsTrigger>
          </TabsList>

          {/* Auth Tab Content */}
          <TabsContent value="auth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test User Creation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <Form {...form}>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        addDebugLog("Form submission event triggered");
                        form.handleSubmit(onSubmit)(e);
                      }}
                      className="space-y-4"
                    >
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
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                {...field}
                                value="Password123" // Set default password
                                disabled // Disable editing since we're using a default password
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                {...field}
                                value="Password123" // Set default confirmation
                                disabled // Disable editing since we're using a default password
                              />
                            </FormControl>
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

                  {/* Debug Log */}
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Crosswalks Tab Content */}
          <TabsContent value="crosswalks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Crosswalks Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {/* Test GET /api/crosswalks */}
                  <div className="space-y-2">
                    <Label>GET /api/crosswalks</Label>
                    <div className="flex items-center gap-4">
                      <Button
                        disabled={selectedEndpoint === '/api/crosswalks'}
                        onClick={() => testEndpoint('/api/crosswalks')}
                      >
                        {selectedEndpoint === '/api/crosswalks' && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Test Endpoint
                      </Button>
                      <span>
                        {crosswalksLoading ? 'Loading...' : `${crosswalks.length} crosswalks found`}
                      </span>
                    </div>
                  </div>

                  {/* Test POST /api/crosswalks */}
                  <div className="space-y-2">
                    <Label>POST /api/crosswalks</Label>
                    <div className="grid gap-4">
                      <Input
                        placeholder="Mapping Name"
                        onChange={(e) => handleParamChange('name', e.target.value)}
                      />

                      <div className="space-y-2">
                        <Label>Source Dataset</Label>
                        <Select
                          onValueChange={(value) => {
                            handleParamChange('sourceSystemId', value);
                            setSelectedSourceSystem(value);
                            setSelectedSourceInstance(null);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Source Dataset" />
                          </SelectTrigger>
                          <SelectContent>
                            {referenceData.map((data) => (
                              <SelectItem key={data.id} value={String(data.id)}>
                                {data.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedSourceSystem && (
                        <div className="space-y-2">
                          <Label>Source Instance</Label>
                          <Select
                            value={selectedSourceInstance || undefined}
                            onValueChange={(value) => {
                              handleParamChange('sourceInstanceId', value);
                              setSelectedSourceInstance(value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Source Instance" />
                            </SelectTrigger>
                            <SelectContent>
                              {sourceInstancesLoading ? (
                                <SelectItem value="loading">Loading instances...</SelectItem>
                              ) : sourceInstances.map((instance) => (
                                <SelectItem key={instance.id} value={String(instance.id)}>
                                  {instance.name || `Instance ${instance.id}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Target Dataset</Label>
                        <Select
                          onValueChange={(value) => {
                            handleParamChange('targetSystemId', value);
                            setSelectedTargetSystem(value);
                            setSelectedTargetInstance(null);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Target Dataset" />
                          </SelectTrigger>
                          <SelectContent>
                            {referenceData.map((data) => (
                              <SelectItem key={data.id} value={String(data.id)}>
                                {data.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedTargetSystem && (
                        <div className="space-y-2">
                          <Label>Target Instance</Label>
                          <Select
                            value={selectedTargetInstance || undefined}
                            onValueChange={(value) => {
                              handleParamChange('targetInstanceId', value);
                              setSelectedTargetInstance(value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Target Instance" />
                            </SelectTrigger>
                            <SelectContent>
                              {targetInstancesLoading ? (
                                <SelectItem value="loading">Loading instances...</SelectItem>
                              ) : targetInstances.map((instance) => (
                                <SelectItem key={instance.id} value={String(instance.id)}>
                                  {instance.name || `Instance ${instance.id}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Button
                        onClick={() => testEndpoint('/api/crosswalks', 'POST', {
                          name: testParams.name,
                          sourceSystemId: Number(testParams.sourceSystemId),
                          targetSystemId: Number(testParams.targetSystemId),
                          sourceInstanceId: Number(testParams.sourceInstanceId),
                          targetInstanceId: Number(testParams.targetInstanceId)
                        })}
                      >
                        Create Mapping
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Types Tab Content */}
          <TabsContent value="types" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reference Types Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {/* Test GET /api/reference-types */}
                  <div className="space-y-2">
                    <Label>GET /api/reference-types</Label>
                    <div className="flex items-center gap-4">
                      <Button
                        disabled={selectedEndpoint === '/api/reference-types'}
                        onClick={() => testEndpoint('/api/reference-types')}
                      >
                        Test Endpoint
                      </Button>
                      <span>{typesLoading ? 'Loading...' : `${referenceTypes?.length || 0} types found`}</span>
                    </div>
                  </div>

                  {/* Test POST /api/reference-types */}
                  <div className="space-y-2">
                    <Label>POST /api/reference-types</Label>
                    <div className="grid gap-2">
                      <Input
                        placeholder="Type Name"
                        onChange={(e) => handleParamChange('name', e.target.value)}
                      />
                      <Input
                        placeholder="Description"
                        onChange={(e) => handleParamChange('description', e.target.value)}
                      />
                      <Button
                        onClick={() => testEndpoint('/api/reference-types', 'POST', {
                          name: testParams.name,
                          description: testParams.description
                        })}
                      >
                        Create Type
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Tab Content */}
          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reference Data Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <Button
                      disabled={selectedEndpoint === '/api/reference-data'}
                      onClick={() => testEndpoint('/api/reference-data')}
                    >
                      {selectedEndpoint === '/api/reference-data' && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Test /api/reference-data
                    </Button>
                    <span>{dataLoading ? 'Loading...' : `${referenceData?.length || 0} datasets found`}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relationships Tab Content */}
          <TabsContent value="relationships" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Relationships Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <Button
                      disabled={selectedEndpoint === '/api/relationships'}
                      onClick={() => testEndpoint('/api/relationships')}
                    >
                      {selectedEndpoint === '/api/relationships' && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Test /api/relationships
                    </Button>
                    <span>
                      {relationshipsLoading ? 'Loading...' : `${relationships.length} relationships found`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {response && (
            <div className="mt-4">
              <Label>Response:</Label>
              {renderResponse(response)}
            </div>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}