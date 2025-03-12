import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { Loader2, ArrowLeft, Plus, Pencil, Trash2, History, Database, Upload, Download, ArrowUpCircle } from "lucide-react";
import type { ReferenceDataSet, ReferenceDataInstance, HistoryEntry } from "@shared/schema";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useState, useRef } from "react";
import { format } from "date-fns";
import { useSession } from "@/hooks/use-session";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ReferenceDataTypeSchema {
  name: string;
  dataType: string;
}

export type InstanceStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED";

export interface ExtendedReferenceDataInstance extends ReferenceDataInstance {
  status?: InstanceStatus;
  createdBy?: string;
  createdAt?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export default function ReferenceDataInstancesPage() {
  const { user } = useSession();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const params = useParams<{ id: string }>("/reference-data/:id/instances");
  const dataSetId = params ? Number(params.id) : null;
  const [editingDataSet, setEditingDataSet] = useState<ExtendedReferenceDataInstance | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedInstanceHistory, setSelectedInstanceHistory] = useState<{ id: string; history: HistoryEntry[] } | null>(null);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusFilter, setStatusFilter] = useState<InstanceStatus | "ALL">("ALL");

  const { data: dataSet, isLoading: isLoadingDataSet } = useQuery<ReferenceDataSet>({
    queryKey: [`/api/reference-data/${dataSetId}`],
    enabled: !!dataSetId && !isNaN(dataSetId),
    refetchOnWindowFocus: false
  });

  const { data: schemaFields = [], isLoading: isLoadingSchema } = useQuery<ReferenceDataTypeSchema[]>({
    queryKey: [`/api/reference-types/${dataSet?.typeId}/schemas`],
    enabled: !!dataSet?.typeId,
  });

  const instanceSchema = z.object(
    schemaFields.reduce((acc, field) => ({
      ...acc,
      [field.name]: z.string().min(1, `${field.name} is required`)
    }), {})
  );

  type InstanceFormData = z.infer<typeof instanceSchema>;

  const form = useForm<InstanceFormData>({
    resolver: zodResolver(instanceSchema),
    defaultValues: schemaFields.reduce((acc, field) => ({
      ...acc,
      [field.name]: ""
    }), {})
  });

  const filteredInstances = (() => {
    const instances = (() => {
      if (!dataSet?.data) {
        return [];
      }

      try {
        const processedInstances = Object.entries(dataSet.data).map(([id, data]) => ({
          id,
          ...(data as ExtendedReferenceDataInstance)
        }));
        return processedInstances;
      } catch (error) {
        console.error('Error processing instance data:', error);
        return [];
      }
    })();

    if (statusFilter === "ALL") {
      return instances;
    }

    return instances.filter(instance => instance.status === statusFilter);
  })();

  const addMutation = useMutation({
    mutationFn: async (data: InstanceFormData) => {
      const currentData = { ...dataSet?.data } || {};
      const newInstanceId = `instance_${Object.keys(currentData).length + 1}`;
      const timestamp = new Date().toISOString();

      console.log("Current dataset data:", currentData);
      console.log("Form data to be added:", data);

      const newInstance = {
        ...data,
        status: "DRAFT" as InstanceStatus,
        createdBy: user?.username || "system",
        createdAt: timestamp,
        lastModifiedBy: user?.username || "system",
        lastModifiedAt: timestamp,
        _history: [{
          timestamp,
          changes: Object.entries(data).map(([field, value]) => ({
            field,
            oldValue: '',
            newValue: value
          }))
        }]
      };

      const updatedData = {
        ...currentData,
        [newInstanceId]: newInstance
      };

      console.log("Sending PATCH request with data:", {
        endpoint: `/api/reference-data/${dataSetId}`,
        newInstanceId,
        newInstance,
        fullData: updatedData
      });

      // Make the PATCH request
      const response = await fetch(`/api/reference-data/${dataSetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ data: updatedData })
      });

      if (!response.ok) {
        console.error('PATCH request failed:', response.status, response.statusText);
        throw new Error(`Failed to update data: ${response.statusText}`);
      }

      console.log("PATCH response:", await response.json());

      // Verify the update was successful
      const verifyResponse = await fetch(`/api/reference-data/${dataSetId}`, {
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!verifyResponse.ok) {
        throw new Error("Failed to verify data update");
      }

      const verifyData = await verifyResponse.json();
      console.log("Verification GET response:", verifyData);

      // Check if our new instance exists in the verified data
      const verifiedInstance = verifyData.data?.[newInstanceId];
      if (!verifiedInstance) {
        console.error("Instance not found in verification data:", {
          newInstanceId,
          verifiedData: verifyData.data
        });
        throw new Error("Failed to verify instance creation");
      }

      return verifyData;
    },
    onSuccess: (response) => {
      console.log("Mutation successful, response:", response);
      queryClient.invalidateQueries({ queryKey: [`/api/reference-data/${dataSetId}`] });
      toast({
        title: "Success",
        description: "Instance added successfully",
      });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error("Mutation failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add instance",
        variant: "destructive",
      });
    },
  });

  const submitForApprovalMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      const currentData = { ...dataSet?.data };
      const currentInstance = currentData[instanceId] as ExtendedReferenceDataInstance;
      const timestamp = new Date().toISOString();

      const updatedData = {
        ...currentData,
        [instanceId]: {
          ...currentInstance,
          status: "PENDING_APPROVAL" as InstanceStatus,
          lastModifiedBy: user?.username || "system",
          lastModifiedAt: timestamp,
          _history: [
            ...(currentInstance._history || []),
            {
              timestamp,
              changes: [{
                field: "status",
                oldValue: currentInstance.status || "DRAFT",
                newValue: "PENDING_APPROVAL"
              }]
            }
          ]
        }
      };

      await fetch(`/api/reference-data/${dataSetId}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ data: updatedData })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reference-data/${dataSetId}`] });
      toast({
        title: "Success",
        description: "Instance submitted for approval",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit for approval",
        variant: "destructive",
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InstanceFormData }) => {
      const currentData = { ...dataSet?.data };
      const currentInstance = currentData[id] as ExtendedReferenceDataInstance;
      const timestamp = new Date().toISOString();

      const changes = Object.entries(data).map(([field, newValue]) => ({
        field,
        oldValue: currentInstance[field] || '',
        newValue
      })).filter(change => change.oldValue !== change.newValue);

      if (changes.length > 0) {
        const updatedData = {
          ...currentData,
          [id]: {
            ...data,
            status: currentInstance.status || "DRAFT",
            lastModifiedBy: user?.username || "system",
            lastModifiedAt: timestamp,
            createdBy: currentInstance.createdBy || "system",
            createdAt: currentInstance.createdAt || timestamp,
            _history: [
              ...(currentInstance._history || []),
              {
                timestamp,
                changes
              }
            ]
          }
        };

        await fetch(`/api/reference-data/${dataSetId}`, {
          method: "PATCH",
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ data: updatedData })
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reference-data/${dataSetId}`] });
      toast({
        title: "Success",
        description: "Instance updated successfully",
      });
      form.reset();
      setEditingDataSet(null);
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update instance",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      const currentData = { ...dataSet?.data };
      delete currentData[instanceId];

      await fetch(`/api/reference-data/${dataSetId}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ data: currentData })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reference-data/${dataSetId}`] });
      toast({
        title: "Success",
        description: "Instance deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete instance",
        variant: "destructive",
      });
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/reference-data/${dataSetId}/bulk-upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("Failed to upload file");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reference-data/${dataSetId}`] });
      toast({
        title: "Success",
        description: "Bulk upload completed successfully",
      });
      setIsBulkUploadDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      if (!dataSet?.data) return;

      console.log("Deleting all instances from dataset:", dataSetId);

      const response = await fetch(`/api/reference-data/${dataSetId}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ data: {} })
      });

      if (!response.ok) {
        throw new Error("Failed to delete all instances");
      }

      const result = await response.json();
      console.log("Delete all response:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reference-data/${dataSetId}`] });
      toast({
        title: "Success",
        description: "All instances deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete all instances",
        variant: "destructive",
      });
    },
  });


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv") {
        toast({
          title: "Error",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
        return;
      }
      bulkUploadMutation.mutate(file);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      console.log("Downloading template for dataset:", dataSetId);

      const response = await fetch(`/api/reference-data/${dataSetId}/template`, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv',
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        throw new Error("Authentication required. Please log in again.");
      }

      if (!response.ok) {
        console.error("Template download failed:", response.status, response.statusText);
        throw new Error(`Failed to download template: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dataSet?.name || "reference_data"}_template.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Template downloaded successfully.  Authentication successful!",
      });
    } catch (error) {
      console.error("Error downloading template:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: InstanceFormData) => {
    if (editingDataSet) {
      editMutation.mutate({ id: editingDataSet.id, data });
    } else {
      addMutation.mutate(data);
    }
  }

  const handleEdit = (instance: { id: string } & ExtendedReferenceDataInstance) => {
    setEditingDataSet(instance);
    Object.entries(instance).forEach(([key, value]) => {
      if (key !== 'id' && key !== '_history') {
        form.setValue(key, String(value));
      }
    });
    setIsDialogOpen(true);
  }

  const handleDelete = (instanceId: string) => {
    if (window.confirm("Are you sure you want to delete this instance?")) {
      deleteMutation.mutate(instanceId);
    }
  }

  const handleShowHistory = (instance: { id: string } & ExtendedReferenceDataInstance) => {
    setSelectedInstanceHistory({
      id: instance.id,
      history: instance._history || []
    });
    setIsHistoryDialogOpen(true);
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setEditingDataSet(null);
    }
    setIsDialogOpen(open);
  }

  const handleSubmitForApproval = (instanceId: string) => {
    if (window.confirm("Are you sure you want to submit this instance for approval?")) {
      submitForApprovalMutation.mutate(instanceId);
    }
  };

  if (isLoadingDataSet || isLoadingSchema) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[200px] bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8 px-4 py-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
          <Button
            variant="ghost"
            onClick={() => setLocation("/reference-data")}
            className="hover:bg-blue-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reference Data
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="bg-white hover:bg-blue-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsBulkUploadDialogOpen(true)}
              className="bg-white hover:bg-blue-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="bg-white hover:bg-red-50 border-red-200 text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all instances
                    in this reference data set.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => deleteAllMutation.mutate()}
                    disabled={deleteAllMutation.isPending}
                  >
                    {deleteAllMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Instance
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-900">
                    {editingDataSet ? "Edit Instance" : "Add New Instance"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {schemaFields.map((field) => (
                      <FormField
                        key={field.name}
                        control={form.control}
                        name={field.name}
                        render={({ field: { value, onChange } }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">{field.name}</FormLabel>
                            <FormControl>
                              <Input
                                value={value}
                                onChange={onChange}
                                placeholder={`Enter ${field.name}`}
                                className="focus:ring-2 focus:ring-primary/20"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    ))}
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm"
                      disabled={addMutation.isPending || editMutation.isPending}
                    >
                      {(addMutation.isPending || editMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingDataSet ? "Update Instance" : "Save Instance"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
          <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
          <div className="flex gap-2">
            {["ALL", "DRAFT", "PENDING_APPROVAL", "APPROVED"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status as typeof statusFilter)}
                className={statusFilter === status ? "bg-primary text-white" : ""}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        <Dialog open={isBulkUploadDialogOpen} onOpenChange={setIsBulkUploadDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Bulk Upload Reference Data
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Upload a CSV file containing multiple instances. Make sure to follow the template format.
              </p>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-gray-400">
                  Only CSV files are supported. Download the template first to ensure correct format.
                </p>
              </div>
              {bulkUploadMutation.isPending && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-gray-600">Uploading...</span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Reference Data Instances - {dataSet?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {filteredInstances.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-sm font-semibold text-gray-700">Instance ID</TableHead>
                    {schemaFields.map((field) => (
                      <TableHead key={field.name} className="text-sm font-semibold text-gray-700">
                        {field.name}
                      </TableHead>
                    ))}
                    <TableHead className="text-sm font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="text-right text-sm font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstances.map((instance) => (
                    <TableRow key={instance.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium text-gray-900">{instance.id}</TableCell>
                      {schemaFields.map((field) => (
                        <TableCell key={field.name} className="text-gray-700">
                          {instance[field.name]}
                        </TableCell>
                      ))}
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          instance.status === "DRAFT" ? "bg-yellow-100 text-yellow-800" :
                            instance.status === "PENDING_APPROVAL" ? "bg-blue-100 text-blue-800" :
                              "bg-green-100 text-green-800"
                        }`}>
                          {instance.status || "DRAFT"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShowHistory(instance)}
                          className="hover:bg-blue-50"
                          title="View History"
                        >
                          <History className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(instance)}
                          className="hover:bg-green-50"
                        >
                          <Pencil className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(instance.id)}
                          className="hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                        {instance.status === "DRAFT" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSubmitForApproval(instance.id)}
                            className="hover:bg-blue-50"
                            title="Submit for Approval"
                          >
                            <ArrowUpCircle className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No instances available for this reference data set.</p>
                <p className="text-sm text-gray-500 mt-1">Click the "Add New Instance" button to create one.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Edit History - Instance {selectedInstanceHistory?.id}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {selectedInstanceHistory?.history.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No edit history available.</p>
                </div>
              ) : (
                selectedInstanceHistory?.history.map((entry, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h4 className="font-medium text-gray-900">Changes made on:</h4>
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {format(new Date(entry.timestamp), 'PPpp')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {entry.changes.map((change, changeIndex) => (
                        <div key={changeIndex} className="text-sm bg-white p-2 rounded">
                          <span className="font-medium text-gray-700">{change.field}:</span>{' '}
                          <span className="text-red-500 line-through bg-red-50 px-1 rounded">
                            {change.oldValue || '(empty)'}
                          </span>{' '}
                          <span className="text-green-600 bg-green-50 px-1 rounded">
                            {change.newValue}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}