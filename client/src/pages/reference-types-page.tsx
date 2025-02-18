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
import { Loader2, Plus, Pencil, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ReferenceDataType, InsertReferenceDataType, ReferenceDataTypeSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReferenceDataTypeSchema } from "@shared/schema";
import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function ReferenceTypesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ReferenceDataType | null>(null);

  const form = useForm<InsertReferenceDataType>({
    resolver: zodResolver(insertReferenceDataTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      schemas: [{ name: "", dataType: "" }],
    },
  });

  // First, fetch all reference types
  const { data: referenceTypes, isLoading } = useQuery<ReferenceDataType[]>({
    queryKey: ["/api/reference-types"],
  });

  // Then, load schemas when editing
  const { data: schemas = [], isLoading: schemasLoading } = useQuery<ReferenceDataTypeSchema[]>({
    queryKey: ["/api/reference-types", editingType?.id, "schemas"],
    enabled: !!editingType,
  });

  // Finally, get schemas for all reference types
  const { data: schemasMap = {} } = useQuery<{ [key: number]: ReferenceDataTypeSchema[] }>({
    queryKey: ["/api/reference-types/schemas"],
    queryFn: async () => {
      if (!referenceTypes?.length) return {};

      const schemasMap: { [key: number]: ReferenceDataTypeSchema[] } = {};
      for (const type of referenceTypes) {
        const res = await apiRequest("GET", `/api/reference-types/${type.id}/schemas`);
        schemasMap[type.id] = await res.json();
      }
      return schemasMap;
    },
    enabled: !!referenceTypes?.length,
  });

  // Set form values when editing
  useEffect(() => {
    if (editingType) {
      form.reset({
        name: editingType.name,
        description: editingType.description || "",
        schemas: schemas.length > 0 ? schemas.map(schema => ({
          name: schema.name,
          dataType: schema.dataType
        })) : [{ name: "", dataType: "" }],
      });
    }
  }, [editingType, schemas, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertReferenceDataType) => {
      console.log("Creating with data:", data); // Debug log
      const res = await apiRequest("POST", "/api/reference-types", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reference-types"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Reference Data Type has been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create Reference Data Type.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertReferenceDataType }) => {
      console.log("Updating with data:", data); // Debug log
      const res = await apiRequest("PATCH", `/api/reference-types/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reference-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reference-types/schemas"] });
      setDialogOpen(false);
      setEditingType(null);
      form.reset();
      toast({
        title: "Success",
        description: "Reference Data Type has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update Reference Data Type.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: InsertReferenceDataType) {
    // Filter out empty schema entries
    const validSchemas = data.schemas.filter(schema => schema.name && schema.dataType);
    console.log("Form schemas before filtering:", data.schemas);
    console.log("Valid schemas after filtering:", validSchemas);

    const submissionData = {
      ...data,
      schemas: validSchemas,
    };
    console.log("Final submission data:", submissionData);

    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: submissionData });
    } else {
      createMutation.mutate(submissionData);
    }
  }

  function handleEdit(type: ReferenceDataType) {
    setEditingType(type);
    setDialogOpen(true);
  }

  function handleCreateNew() {
    setEditingType(null);
    form.reset({
      name: "",
      description: "",
      schemas: [{ name: "", dataType: "" }],
    });
    setDialogOpen(true);
  }

  // Function to add a new schema field
  function addSchemaField() {
    const schemas = form.getValues("schemas") || [];
    form.setValue("schemas", [...schemas, { name: "", dataType: "" }]);
  }

  // Function to remove a schema field
  function removeSchemaField(index: number) {
    const schemas = form.getValues("schemas") || [];
    if (schemas.length > 1) {
      form.setValue(
        "schemas",
        schemas.filter((_, i) => i !== index)
      );
    }
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
            <CardTitle>Reference Data Types</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Type
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingType ? "Edit Reference Data Type" : "Create New Reference Data Type"}
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
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <FormLabel>Schema Fields</FormLabel>
                        <Button type="button" variant="outline" size="sm" onClick={addSchemaField}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Field
                        </Button>
                      </div>
                      <ScrollArea className="h-[200px] rounded-md border p-4">
                        <div className="space-y-4">
                          {form.watch("schemas")?.map((_, index) => (
                            <div key={index} className="flex gap-4 items-start">
                              <FormField
                                control={form.control}
                                name={`schemas.${index}.name`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input {...field} placeholder="Field Name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`schemas.${index}.dataType`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input {...field} placeholder="Data Type" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeSchemaField(index)}
                                disabled={index === 0 && form.watch("schemas")?.length === 1}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {(createMutation.isPending || updateMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingType ? "Update Reference Data Type" : "Create Reference Data Type"}
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
                  <TableHead>Description</TableHead>
                  <TableHead>Schema Attributes</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referenceTypes?.map((type) => {
                  const typeSchemas = schemasMap[type.id] || [];
                  return (
                    <TableRow key={type.id}>
                      <TableCell>{type.name}</TableCell>
                      <TableCell>{type.description}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {typeSchemas.map((schema, index) => (
                            <Badge key={index} variant="secondary">
                              {schema.name}: {schema.dataType}
                            </Badge>
                          ))}
                          {typeSchemas.length > 0 && (
                            <Badge variant="outline">
                              Total: {typeSchemas.length}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(type.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(type)}
                        >
                          <Pencil className="h-4 w-4" />
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