import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clipboard, ClipboardCheck, Key, Plus, Trash, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [isOpen, setIsOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const { toast } = useToast();

  const { data: apiKeys = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/api-keys"]
  });

  const form = useForm<FormData>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: "",
      description: "",
      expiresAt: null,
      isActive: true,
    },
  });

  const createApiKeyMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("/api/api-keys", {
        method: "POST",
        data,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setNewKeyValue(data.key);
      setShowKey(true);
      toast({
        title: "API Key Created",
        description: "Your API key has been created successfully.",
      });
      form.reset();
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create API key",
        variant: "destructive",
      });
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/api-keys/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "API Key Deleted",
        description: "The API key has been deleted successfully.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete API key",
        variant: "destructive",
      });
    },
  });

  const toggleApiKeyMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest(`/api/api-keys/${id}`, {
        method: "PATCH",
        data: { isActive },
      });
    },
    onSuccess: () => {
      toast({
        title: "API Key Updated",
        description: "The API key status has been updated successfully.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update API key",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createApiKeyMutation.mutate(data);
  };

  const handleViewKey = (apiKey: ApiKey) => {
    setSelectedApiKey(apiKey);
    setIsOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">API Keys Management</h1>
          <Button onClick={() => setShowKey(false)}>
            <Plus className="mr-2 h-4 w-4" /> Create API Key
          </Button>
        </div>

        {!showKey ? (
          <Card>
            <CardHeader>
              <CardTitle>Create New API Key</CardTitle>
              <CardDescription>
                Generate a new API key for external access to the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., External System Integration"
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="What will this API key be used for?"
                      {...form.register("description")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
                    <DatePicker
                      selected={form.getValues("expiresAt")}
                      onSelect={(date) => form.setValue("expiresAt", date)}
                      placeholder="Never expires"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createApiKeyMutation.isPending}>
                  {createApiKeyMutation.isPending ? "Creating..." : "Create API Key"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>API Key Created</CardTitle>
              <CardDescription>
                Copy this API key now. You won't be able to see it again!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  This API key will only be displayed once. Please store it securely.
                </AlertDescription>
              </Alert>
              <div className="relative mb-4">
                <Input value={newKeyValue} readOnly className="pr-12" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => copyToClipboard(newKeyValue)}
                >
                  {copied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={() => setShowKey(false)} className="w-full">
                Done
              </Button>
            </CardContent>
          </Card>
        )}

        <h2 className="text-2xl font-bold mt-8 mb-4">Existing API Keys</h2>
        {isLoading ? (
          <p>Loading API keys...</p>
        ) : apiKeys && apiKeys.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys && apiKeys.map((apiKey: ApiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">{apiKey.name}</TableCell>
                  <TableCell>{apiKey.description || "—"}</TableCell>
                  <TableCell>{new Date(apiKey.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {apiKey.expiresAt ? new Date(apiKey.expiresAt).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell>
                    {apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleDateString() : "Never used"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={apiKey.isActive ? "default" : "outline"}>
                      {apiKey.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => 
                          toggleApiKeyMutation.mutate({ id: apiKey.id, isActive: !apiKey.isActive })
                        }
                      >
                        {apiKey.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteApiKeyMutation.mutate(apiKey.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Card>
            <CardContent className="py-6">
              <div className="text-center">
                <Key className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">No API Keys</h3>
                <p className="mt-1 text-gray-500">
                  You haven't created any API keys yet. Create one to enable external access.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Details</DialogTitle>
            <DialogDescription>
              Details for API key "{selectedApiKey?.name}"
            </DialogDescription>
          </DialogHeader>
          {selectedApiKey && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <p>{selectedApiKey.name}</p>
              </div>
              <div>
                <Label>Description</Label>
                <p>{selectedApiKey.description || "—"}</p>
              </div>
              <div>
                <Label>Created</Label>
                <p>{new Date(selectedApiKey.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <Label>Expires</Label>
                <p>
                  {selectedApiKey.expiresAt
                    ? new Date(selectedApiKey.expiresAt).toLocaleString()
                    : "Never"}
                </p>
              </div>
              <div>
                <Label>Last Used</Label>
                <p>
                  {selectedApiKey.lastUsedAt
                    ? new Date(selectedApiKey.lastUsedAt).toLocaleString()
                    : "Never used"}
                </p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge variant={selectedApiKey.isActive ? "default" : "outline"}>
                  {selectedApiKey.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}