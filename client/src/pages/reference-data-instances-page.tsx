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
import { Loader2, ArrowLeft, Plus, Pencil, Trash2, History } from "lucide-react";
import type { ReferenceDataSet, ReferenceDataInstance, HistoryEntry } from "@shared/schema";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
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

  // Fetch the reference data set with the correct endpoint
  const { data: dataSet, isLoading, error } = useQuery<ReferenceDataSet>({
    queryKey: [`/api/reference-data/${dataSetId}`],
    enabled: !!dataSetId && !isNaN(dataSetId),
    refetchOnWindowFocus: false
  });

  console.log('Debug: Raw dataset:', dataSet);

  // Get schema fields from the first instance
  const schemaFields = (() => {
    if (!dataSet?.data || Object.keys(dataSet.data).length === 0) {
      console.log('Debug: No data found in dataset');
      return [];
    }
    // Get the first instance
    const firstInstance = Object.values(dataSet.data)[0] as ReferenceDataInstance;
    console.log('Debug: First instance:', firstInstance);
    return Object.keys(firstInstance).filter(key => key !== '_history');
  })();

  console.log('Debug: Schema fields:', schemaFields);

  // Create a dynamic schema based on the fields
  const instanceSchema = z.object(
    schemaFields.reduce((acc, field) => ({
      ...acc,
      [field]: z.string().min(1, `${field} is required`)
    }), {})
  );

  type InstanceFormData = z.infer<typeof instanceSchema>;

  const form = useForm<InstanceFormData>({
    resolver: zodResolver(instanceSchema),
    defaultValues: schemaFields.reduce((acc, field) => ({
      ...acc,
      [field]: ""
    }), {})
  });

  // Process instances for tabular display
  const instances = (() => {
    if (!dataSet?.data) {
      console.log('Debug: No data in dataset');
      return [];
    }

    try {
      const processedInstances = Object.entries(dataSet.data).map(([id, data]) => ({
        id,
        ...data as ReferenceDataInstance
      }));
      console.log('Debug: Processed instances:', processedInstances);
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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-medium text-red-600">Error loading data</h2>
            <p className="text-sm text-muted-foreground">{String(error)}</p>
            <Button
              variant="ghost"
              onClick={() => setLocation("/reference-data")}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reference Data
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation("/reference-data")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reference Data
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Instance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDataSet ? "Edit Instance" : "Add New Instance"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {schemaFields.map((field) => (
                    <FormField
                      key={field}
                      control={form.control}
                      name={field}
                      render={({ field: { value, onChange } }) => (
                        <FormItem>
                          <FormLabel>{field}</FormLabel>
                          <FormControl>
                            <Input value={value} onChange={onChange} placeholder={`Enter ${field}`} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  <Button
                    type="submit"
                    className="w-full"
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

        <Card>
          <CardHeader>
            <CardTitle>Reference Data Instances - {dataSet?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {instances.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instance ID</TableHead>
                    {schemaFields.map((field) => (
                      <TableHead key={field}>{field}</TableHead>
                    ))}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instances.map((instance) => (
                    <TableRow key={instance.id}>
                      <TableCell className="font-medium">{instance.id}</TableCell>
                      {schemaFields.map((field) => (
                        <TableCell key={field}>{instance[field]}</TableCell>
                      ))}
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleShowHistory(instance)}
                          title="View History"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(instance)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(instance.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No instances available for this reference data set.
              </div>
            )}
          </CardContent>
        </Card>

        {/* History Dialog */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit History - Instance {selectedInstanceHistory?.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedInstanceHistory?.history.length === 0 ? (
                <p className="text-center text-muted-foreground">No edit history available.</p>
              ) : (
                selectedInstanceHistory?.history.map((entry, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Changes made on:</h4>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(entry.timestamp), 'PPpp')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {entry.changes.map((change, changeIndex) => (
                        <div key={changeIndex} className="text-sm">
                          <span className="font-medium">{change.field}:</span>{' '}
                          <span className="text-red-500 line-through">{change.oldValue}</span>{' '}
                          <span className="text-green-500">{change.newValue}</span>
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