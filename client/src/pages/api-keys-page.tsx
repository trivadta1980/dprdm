import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MainLayout } from "@/components/layout/main-layout";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Trash, Eye, Copy, Check, Clock, Key } from "lucide-react";

type ApiKey = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  isActive: boolean;
  createdBy: number | null;
};

const apiKeySchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(),
  expiresAt: z.date().optional().nullable(),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof apiKeySchema>;

export default function ApiKeysPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeApiKey, setActiveApiKey] = useState<ApiKey | null>(null);
  const [apiKeyPassword, setApiKeyPassword] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: "",
      description: "",
      expiresAt: null,
      isActive: true,
    },
  });

  // Query for getting API keys
  const { data: apiKeys, isLoading, refetch } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const response = await apiRequest("api-keys");
      return response.json();
    },
  });

  // Mutation for creating a new API key
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Format the data for the API
      const apiData = {
        ...data,
        expiresAt: data.expiresAt ? data.expiresAt.toISOString() : null,
      };
      
      return await apiRequest("api-keys", {
        method: "POST",
        data: apiData,
      });
    },
    onSuccess: (data) => {
      refetch();
      setIsCreateOpen(false);
      form.reset();
      toast({
        title: "API Key Created",
        description: "Your new API key has been created successfully.",
      });
      // Set the active key for viewing
      setActiveApiKey(data as any);
      setIsViewOpen(true);
      setCopiedKey(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create API key: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating an API key
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; values: Partial<FormData> }) => {
      // Format the data for the API
      const apiData = {
        ...data.values,
        expiresAt: data.values.expiresAt ? data.values.expiresAt.toISOString() : null,
      };
      
      return await apiRequest(`api-keys/${data.id}`, {
        method: "PATCH",
        data: apiData,
      });
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "API Key Updated",
        description: "The API key has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update API key: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting an API key
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`api-keys/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      refetch();
      setIsDeleteOpen(false);
      setActiveApiKey(null);
      toast({
        title: "API Key Deleted",
        description: "The API key has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete API key: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for getting the actual API key (requires password verification)
  const viewKeyMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      return await apiRequest(`api-keys/${id}/view`, {
        method: "POST",
        data: { password },
      });
    },
    onSuccess: (data) => {
      setActiveApiKey(data as any);
      setApiKeyPassword("");
      toast({
        title: "API Key Retrieved",
        description: "The API key has been successfully retrieved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to retrieve API key: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  const handleToggleActive = (apiKey: ApiKey) => {
    updateMutation.mutate({
      id: apiKey.id,
      values: { isActive: !apiKey.isActive },
    });
  };

  const handleDelete = (apiKey: ApiKey) => {
    setActiveApiKey(apiKey);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (activeApiKey) {
      deleteMutation.mutate(activeApiKey.id);
    }
  };

  const handleViewKey = (apiKey: ApiKey) => {
    setActiveApiKey(apiKey);
    setApiKeyPassword("");
    setIsViewOpen(true);
    setCopiedKey(false);
  };

  const handleFetchKey = () => {
    if (activeApiKey) {
      viewKeyMutation.mutate({
        id: activeApiKey.id,
        password: apiKeyPassword,
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
    
    // Reset after 3 seconds
    setTimeout(() => {
      setCopiedKey(false);
    }, 3000);
  };

  function formatDate(date: string | null) {
    if (!date) return "Never";
    return format(new Date(date), "PPP");
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">API Keys</h1>
            <p className="text-muted-foreground">
              Manage API keys for external access to your data
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>Create New API Key</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">Loading API keys...</div>
            ) : apiKeys && (apiKeys as any).length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(apiKeys as any[]).map((apiKey: ApiKey) => (
                      <TableRow key={apiKey.id}>
                        <TableCell className="font-medium">
                          {apiKey.name}
                          {apiKey.description && (
                            <div className="text-sm text-muted-foreground">
                              {apiKey.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(apiKey.createdAt)}</TableCell>
                        <TableCell>
                          {apiKey.expiresAt ? (
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              {formatDate(apiKey.expiresAt)}
                            </div>
                          ) : (
                            "Never"
                          )}
                        </TableCell>
                        <TableCell>{formatDate(apiKey.lastUsedAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={apiKey.isActive}
                              onCheckedChange={() => handleToggleActive(apiKey)}
                            />
                            <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                              {apiKey.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewKey(apiKey)}
                            >
                              <Eye size={16} className="mr-1" />
                              View
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(apiKey)}
                            >
                              <Trash size={16} className="mr-1" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Key size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium text-lg">No API Keys Found</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't created any API keys yet.
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>Create New API Key</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create New API Key Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for external access to your reference data.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My API Key" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name to identify this API key
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Used for application X" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        A brief description of what this API key will be used for
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date (Optional)</FormLabel>
                      <FormControl>
                        <DatePicker
                          selected={field.value || undefined}
                          onSelect={(date) => field.onChange(date)}
                          placeholder="Select date"
                        />
                      </FormControl>
                      <FormDescription>
                        When this API key should expire. If not set, the key will never expire.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Whether this API key is active and can be used
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create API Key"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* View API Key Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>View API Key</DialogTitle>
              <DialogDescription>
                {activeApiKey?.key 
                  ? "This API key will only be shown once. Make sure to copy it now."
                  : "Enter your password to view the API key."}
              </DialogDescription>
            </DialogHeader>
            
            {activeApiKey?.key ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex">
                    <Input
                      readOnly
                      value={activeApiKey.key}
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="ml-2"
                      onClick={() => copyToClipboard(activeApiKey.key)}
                    >
                      {copiedKey ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This key will only be displayed once and cannot be recovered.
                  </p>
                </div>
                
                <div className="rounded-md bg-yellow-50 p-4 text-yellow-800 text-sm">
                  <h4 className="font-semibold">Important</h4>
                  <p>
                    Store this API key securely. It grants access to your reference data and cannot be 
                    viewed again after you close this dialog.
                  </p>
                </div>
                
                <div className="pt-2">
                  <h4 className="font-semibold mb-2">How to use this API key</h4>
                  <div className="bg-muted p-3 rounded-md text-sm font-mono overflow-x-auto">
                    <pre>
                      {`fetch('/api/external/datasets', {
  headers: {
    'x-api-key': '${activeApiKey.key}'
  }
})`}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Your Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={apiKeyPassword}
                    onChange={(e) => setApiKeyPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                  <p className="text-sm text-muted-foreground">
                    For security reasons, you need to verify your password to view this API key.
                  </p>
                </div>
                
                <DialogFooter>
                  <Button
                    onClick={handleFetchKey}
                    disabled={!apiKeyPassword || viewKeyMutation.isPending}
                  >
                    {viewKeyMutation.isPending ? "Verifying..." : "View API Key"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete API Key Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Delete API Key</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this API key? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {activeApiKey && (
              <div className="py-4">
                <p className="font-medium">{activeApiKey.name}</p>
                {activeApiKey.description && (
                  <p className="text-muted-foreground mt-1">{activeApiKey.description}</p>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete API Key"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}