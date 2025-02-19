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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  ReferenceDataType,
  ReferenceDataTypeSchema,
  ReferenceDataSet,
  InsertReferenceDataSet
} from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReferenceDataSetSchema } from "@shared/schema";
import { useState } from "react";

export default function ReferenceDataPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [editingDataSet, setEditingDataSet] = useState<ReferenceDataSet | null>(null);

  const form = useForm<InsertReferenceDataSet>({
    resolver: zodResolver(insertReferenceDataSetSchema),
    defaultValues: {
      name: "",
      description: "",
      data: {},
    },
  });

  // Fetch reference types
  const { data: types = [] } = useQuery<ReferenceDataType[]>({
    queryKey: ["/api/reference-types"],
  });

  // Fetch schemas for selected type
  const { data: schemas = [] } = useQuery<ReferenceDataTypeSchema[]>({
    queryKey: ["/api/reference-types", selectedTypeId, "schemas"],
    enabled: !!selectedTypeId,
  });

  // Fetch reference data sets
  const { data: dataSets = [], isLoading } = useQuery<ReferenceDataSet[]>({
    queryKey: ["/api/reference-data"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertReferenceDataSet) => {
      const res = await apiRequest("POST", "/api/reference-data", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reference-data"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Reference Data Set has been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create Reference Data Set.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertReferenceDataSet> }) => {
      const res = await apiRequest("PATCH", `/api/reference-data/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reference-data"] });
      setDialogOpen(false);
      setEditingDataSet(null);
      form.reset();
      toast({
        title: "Success",
        description: "Reference Data Set has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update Reference Data Set.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reference-data/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reference-data"] });
      toast({
        title: "Success",
        description: "Reference Data Set has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete Reference Data Set.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: InsertReferenceDataSet) {
    if (editingDataSet) {
      updateMutation.mutate({ id: editingDataSet.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function handleEdit(dataSet: ReferenceDataSet) {
    setEditingDataSet(dataSet);
    setSelectedTypeId(dataSet.typeId);
    form.reset({
      name: dataSet.name,
      description: dataSet.description || "",
      typeId: dataSet.typeId,
      data: dataSet.data,
    });
    setDialogOpen(true);
  }

  function handleDelete(dataSet: ReferenceDataSet) {
    if (window.confirm(`Are you sure you want to delete "${dataSet.name}"?`)) {
      deleteMutation.mutate(dataSet.id);
    }
  }

  function handleCreateNew() {
    setEditingDataSet(null);
    setSelectedTypeId(null);
    form.reset({
      name: "",
      description: "",
      data: {},
    });
    setDialogOpen(true);
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

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Reference Data Management</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Data Set
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingDataSet ? "Edit Reference Data Set" : "Create New Reference Data Set"}
                  </DialogTitle>
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
                            <Input {...field} />
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
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="typeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference Data Type</FormLabel>
                          <Select
                            value={field.value?.toString()}
                            onValueChange={(value) => {
                              field.onChange(Number(value));
                              setSelectedTypeId(Number(value));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                            <SelectContent>
                              {types.map((type) => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedTypeId && schemas.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Data Fields</h3>
                        {schemas.map((schema) => (
                          <FormField
                            key={schema.id}
                            control={form.control}
                            name={`data.${schema.name}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{schema.name}</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder={`Enter ${schema.name} (${schema.dataType})`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {(createMutation.isPending || updateMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingDataSet ? "Update Data Set" : "Create Data Set"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataSets.map((dataSet) => {
                  const type = types.find((t) => t.id === dataSet.typeId);
                  return (
                    <TableRow key={dataSet.id}>
                      <TableCell>{dataSet.name}</TableCell>
                      <TableCell>{type?.name}</TableCell>
                      <TableCell>{dataSet.description}</TableCell>
                      <TableCell>
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(dataSet.data, null, 2)}
                        </pre>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(dataSet)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(dataSet)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
