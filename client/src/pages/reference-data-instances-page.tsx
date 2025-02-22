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
import { Loader2, ArrowLeft, Plus, Pencil, Trash2, History, Database, Upload, Download } from "lucide-react";
import type { ReferenceDataSet, ReferenceDataInstance, HistoryEntry } from "@shared/schema";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useRef } from "react";
import { format } from "date-fns";

interface Params {
  id: string;
}

export default function ReferenceDataInstancesPage({ params }: { params: Params }) {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const dataSetId = Number(params.id);
  const [editingDataSet, setEditingDataSet] = useState<ReferenceDataInstance | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedInstanceHistory, setSelectedInstanceHistory] = useState<{ id: string; history: HistoryEntry[] } | null>(null);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch the reference data set
  const { data: dataSet, isLoading: isLoadingDataSet } = useQuery<ReferenceDataSet>({
    queryKey: [`/api/reference-data/${dataSetId}`],
    enabled: !!dataSetId && !isNaN(dataSetId),
    refetchOnWindowFocus: false
  });

  // Fetch schema fields for the reference type
  const { data: schemaFields = [], isLoading: isLoadingSchema } = useQuery<ReferenceDataTypeSchema[]>({
    queryKey: [`/api/reference-types/${dataSet?.typeId}/schemas`],
    enabled: !!dataSet?.typeId,
  });


  // Create a dynamic schema based on the schema fields
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

  // Process instances for tabular display
  const instances = (() => {
    if (!dataSet?.data) {
      return [];
    }

    try {
      const processedInstances = Object.entries(dataSet.data).map(([id, data]) => ({
        id,
        ...data as ReferenceDataInstance
      }));
      return processedInstances;
    } catch (error) {
      console.error('Error processing instance data:', error);
      return [];
    }
  })();

  // Mutations for CRUD operations
  const addMutation = useMutation({
    mutationFn: async (data: InstanceFormData) => {
      const currentData = { ...dataSet?.data } || {};
      const newInstanceId = `instance_${Object.keys(currentData).length + 1}`;
      const updatedData = {
        ...currentData,
        [newInstanceId]: {
          ...data,
          _history: [{
            timestamp: new Date().toISOString(),
            changes: Object.entries(data).map(([field, value]) => ({
              field,
              oldValue: '',
              newValue: value
            }))
          }]
        }
      };

      const res = await apiRequest(
        "PATCH",
        `/api/reference-data/${dataSetId}`,
        { data: updatedData }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reference-data/${dataSetId}`] });
      toast({
        title: "Success",
        description: "Instance added successfully",
      });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add instance",
        variant: "destructive",
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InstanceFormData }) => {
      const currentData = { ...dataSet?.data };
      const currentInstance = currentData[id] as ReferenceDataInstance;
      const changes = Object.entries(data).map(([field, newValue]) => ({
        field,
        oldValue: currentInstance[field] || '',
        newValue
      })).filter(change => change.oldValue !== change.newValue);

      // Only update history if there are actual changes
      if (changes.length > 0) {
        const historyEntry: HistoryEntry = {
          timestamp: new Date().toISOString(),
          changes
        };

        const updatedData = {
          ...currentData,
          [id]: {
            ...data,
            _history: [...(currentInstance._history || []), historyEntry]
          }
        };

        const res = await apiRequest(
          "PATCH",
          `/api/reference-data/${dataSetId}`,
          { data: updatedData }
        );
        return res.json();
      }
      return null;
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

      const res = await apiRequest(
        "PATCH",
        `/api/reference-data/${dataSetId}`,
        { data: currentData }
      );
      return res.json();
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

  // Add bulk upload mutation
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
      const response = await fetch(`/api/reference-data/${dataSetId}/template`);
      if (!response.ok) {
        throw new Error("Failed to download template");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `template_${dataSet?.name || "reference_data"}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  function onSubmit(data: InstanceFormData) {
    if (editingDataSet) {
      editMutation.mutate({ id: editingDataSet.id, data });
    } else {
      addMutation.mutate(data);
    }
  }

  function handleEdit(instance: { id: string } & ReferenceDataInstance) {
    setEditingDataSet(instance);
    // Pre-fill form with instance data
    Object.entries(instance).forEach(([key, value]) => {
      if (key !== 'id' && key !== '_history') {
        form.setValue(key, value);
      }
    });
    setIsDialogOpen(true);
  }

  function handleDelete(instanceId: string) {
    if (window.confirm("Are you sure you want to delete this instance?")) {
      deleteMutation.mutate(instanceId);
    }
  }

  function handleShowHistory(instance: { id: string } & ReferenceDataInstance) {
    setSelectedInstanceHistory({
      id: instance.id,
      history: instance._history || []
    });
    setIsHistoryDialogOpen(true);
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open) {
      form.reset();
      setEditingDataSet(null);
    }
    setIsDialogOpen(open);
  }

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

        {/* Add Bulk Upload Dialog */}
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
            {instances.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-sm font-semibold text-gray-700">Instance ID</TableHead>
                    {schemaFields.map((field) => (
                      <TableHead key={field.name} className="text-sm font-semibold text-gray-700">
                        {field.name}
                      </TableHead>
                    ))}
                    <TableHead className="text-right text-sm font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instances.map((instance) => (
                    <TableRow key={instance.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium text-gray-900">{instance.id}</TableCell>
                      {schemaFields.map((field) => (
                        <TableCell key={field.name} className="text-gray-700">
                          {instance[field.name]}
                        </TableCell>
                      ))}
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

        {/* History Dialog with improved styling */}
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