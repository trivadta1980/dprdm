import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/main-layout';
import { DatePicker } from '@/components/ui/date-picker';
import { getQueryFn } from '@/lib/queryClient';

// Define the API key schema
const apiKeySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  expiresAt: z.date().optional(),
  isActive: z.boolean().default(true),
});

// Define the API key type
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

type FormData = z.infer<typeof apiKeySchema>;

export default function ApiKeysPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewKeyDialogOpen, setIsViewKeyDialogOpen] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);

  // Define the form
  const form = useForm<FormData>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
    },
  });

  // Query for API keys
  const { data: apiKeys, isLoading, error } = useQuery({
    queryKey: ['/api/api-keys'],
    enabled: true,
    queryFn: getQueryFn(),
  });

  // Mutation for creating an API key
  const createApiKeyMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create API key');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'API Key Created',
        description: 'The API key has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for deleting an API key
  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete API key');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'API Key Deleted',
        description: 'The API key has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for toggling the status of an API key
  const toggleApiKeyStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update API key');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'API Key Updated',
        description: 'The API key status has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: FormData) => {
    createApiKeyMutation.mutate(data);
  };

  // Handle API key status toggle
  const handleToggleStatus = (id: number, isActive: boolean) => {
    toggleApiKeyStatusMutation.mutate({ id, isActive: !isActive });
  };

  // Handle API key deletion
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      deleteApiKeyMutation.mutate(id);
    }
  };

  // Handle viewing an API key
  const handleViewKey = (apiKey: ApiKey) => {
    setSelectedApiKey(apiKey);
    setIsViewKeyDialogOpen(true);
  };

  // Format the date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">API Keys</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>Create API Key</Button>
        </div>

        {isLoading ? (
          <div className="text-center">Loading API keys...</div>
        ) : error ? (
          <div className="text-center text-red-500">Error loading API keys</div>
        ) : apiKeys && apiKeys.length === 0 ? (
          <div className="text-center">No API keys found. Create one to get started.</div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Manage API Keys</CardTitle>
              <CardDescription>
                API keys allow external applications to access your data. Keep them secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys && apiKeys.map((apiKey: ApiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell>{apiKey.name}</TableCell>
                      <TableCell>{apiKey.description || 'N/A'}</TableCell>
                      <TableCell>{formatDate(apiKey.createdAt)}</TableCell>
                      <TableCell>{formatDate(apiKey.lastUsedAt)}</TableCell>
                      <TableCell>{apiKey.expiresAt ? formatDate(apiKey.expiresAt) : 'Never'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-sm ${apiKey.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {apiKey.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewKey(apiKey)}
                          >
                            View Key
                          </Button>
                          <Button 
                            variant={apiKey.isActive ? "destructive" : "outline"} 
                            size="sm"
                            onClick={() => handleToggleStatus(apiKey.id, apiKey.isActive)}
                          >
                            {apiKey.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(apiKey.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create API Key Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for external applications. Keep this key secure.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="API Key Name" />
                    </FormControl>
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
                      <Input {...field} placeholder="What is this API key used for?" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration Date (Optional)</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={field.value}
                        onSelect={field.onChange}
                        placeholder="Never"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createApiKeyMutation.isPending}>
                  {createApiKeyMutation.isPending ? 'Creating...' : 'Create API Key'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View API Key Dialog */}
      <Dialog open={isViewKeyDialogOpen} onOpenChange={setIsViewKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key: {selectedApiKey?.name}</DialogTitle>
            <DialogDescription>
              This is your API key. Copy it now as you won't be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex mt-1">
                <Input
                  id="api-key"
                  value={selectedApiKey?.key || ''}
                  readOnly
                  className="flex-1"
                />
                <Button
                  type="button"
                  className="ml-2"
                  onClick={() => {
                    if (selectedApiKey?.key) {
                      navigator.clipboard.writeText(selectedApiKey.key);
                      toast({
                        title: 'Copied',
                        description: 'API key copied to clipboard',
                      });
                    }
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <div className="pt-4">
              <Button type="button" onClick={() => setIsViewKeyDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}