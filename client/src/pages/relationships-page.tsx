import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Plus, GitFork, Pencil, Trash2, ArrowRight, Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  ReferenceDataSet,
  ReferenceDataTypeSchema,
  Relationship,
  RelationshipAttributeDefinition,
  InsertRelationshipAttributeDefinition
} from "@shared/schema";
import { useState } from "react";
import { Link } from "wouter";
import { Link as LinkIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";

// Form schema for relationships
const relationshipSchema = z.object({
  name: z.string().min(1, "Relationship name is required"),
  sourceDataSetId: z.string(),
  targetDataSetId: z.string(),
  relationshipType: z.string(),
  cardinality: z.string(),
  sourceField: z.string(),
  targetField: z.string(),
});

// Form schema for attribute definitions - updated with proper validation
const attributeDefinitionSchema = z.object({
  name: z.string().min(1, "Attribute name is required"),
  dataType: z.enum(["string", "number", "boolean", "date"], {
    required_error: "Data type is required"
  }),
  isRequired: z.boolean().default(false),
  description: z.string().optional(),
});

type RelationshipForm = z.infer<typeof relationshipSchema>;
type AttributeDefinitionForm = z.infer<typeof attributeDefinitionSchema>;

export default function RelationshipsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAttributeDialogOpen, setIsAttributeDialogOpen] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<number | null>(null);
  // Add state for available fields
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [targetFields, setTargetFields] = useState<string[]>([]);
  const [apiDebugData, setApiDebugData] = useState<{
    source?: any;
    target?: any;
    sourceSelection?: string;
    targetSelection?: string;
  }>({});

  const form = useForm<RelationshipForm>({
    resolver: zodResolver(relationshipSchema),
  });

  // Watch source and target dataset selections
  const selectedSourceDataset = form.watch("sourceDataSetId");
  const selectedTargetDataset = form.watch("targetDataSetId");

  // Add debug logs
  console.log("Selected Source Dataset ID:", selectedSourceDataset);

  // Fetch relationships
  const { data: relationships = [], isLoading: isLoadingRelationships } = useQuery<Relationship[]>({
    queryKey: ["/api/relationships"],
  });

  // Fetch reference data sets for dropdowns
  const { data: dataSets = [] } = useQuery<ReferenceDataSet[]>({
    queryKey: ["/api/reference-data"],
  });

  // Add queries for selected datasets with debug logs
  const { data: sourceDataSet } = useQuery<ReferenceDataSet>({
    queryKey: [`/api/reference-data/${selectedSourceDataset}`],
    queryFn: async () => {
      console.log("Fetching source dataset:", selectedSourceDataset);
      const response = await apiRequest(`/api/reference-data/${selectedSourceDataset}`, {
        method: 'GET'
      });
      const data = await response.json();
      console.log("Source dataset API response:", data);
      return data;
    },
    enabled: !!selectedSourceDataset,
    onSuccess: (data) => {
      console.log("Source dataset API success handler:", data);
      // Store raw API response for debugging
      setApiDebugData(prev => ({
        ...prev,
        source: data
      }));

      if (!data?.data) {
        console.log("No data in source dataset");
        setSourceFields([]);
        return;
      }

      // Get the first instance to check structure
      const instances = Object.values(data.data);
      if (instances.length === 0) {
        console.log("No instances found in source dataset");
        setSourceFields([]);
        return;
      }

      // Extract all unique fields from the first instance
      const firstInstance = instances[0];
      const fields = Object.keys(firstInstance).filter(field => !field.startsWith('_'));
      console.log("Source dataset fields:", fields);
      setSourceFields(fields);
    },
    onError: (error) => {
      console.error("Error fetching source dataset:", error);
      setSourceFields([]);
      setApiDebugData(prev => ({
        ...prev,
        source: { error: error.message }
      }));
    }
  });

  const { data: targetDataSet } = useQuery<ReferenceDataSet>({
    queryKey: [`/api/reference-data/${selectedTargetDataset}`],
    queryFn: async () => {
      console.log("Fetching target dataset:", selectedTargetDataset);
      const response = await apiRequest(`/api/reference-data/${selectedTargetDataset}`, {
        method: 'GET'
      });
      const data = await response.json();
      console.log("Target dataset API response:", data);
      return data;
    },
    enabled: !!selectedTargetDataset,
    onSuccess: (data) => {
      console.log("Target dataset API success handler:", data);
      // Store raw API response for debugging
      setApiDebugData(prev => ({
        ...prev,
        target: data
      }));

      if (!data?.data) {
        console.log("No data in target dataset");
        setTargetFields([]);
        return;
      }

      // Get the first instance to check structure
      const instances = Object.values(data.data);
      if (instances.length === 0) {
        console.log("No instances found in target dataset");
        setTargetFields([]);
        return;
      }

      // Extract all unique fields from the first instance
      const firstInstance = instances[0];
      const fields = Object.keys(firstInstance).filter(field => !field.startsWith('_'));
      console.log("Target dataset fields:", fields);
      setTargetFields(fields);
    },
    onError: (error) => {
      console.error("Error fetching target dataset:", error);
      setTargetFields([]);
      setApiDebugData(prev => ({
        ...prev,
        target: { error: error.message }
      }));
    }
  });

  // Fetch attribute definitions for the selected relationship
  const { data: attributeDefinitions = [] } = useQuery<RelationshipAttributeDefinition[]>({
    queryKey: [`/api/relationships/${selectedRelationshipId}/attribute-definitions`],
    enabled: !!selectedRelationshipId,
  });

  // Create/Update relationship mutation
  const mutateRelationship = useMutation({
    mutationFn: async (data: RelationshipForm) => {
      const method = editingRelationship ? "PATCH" : "POST";
      const endpoint = editingRelationship
        ? `/api/relationships/${editingRelationship.id}`
        : "/api/relationships";

      const response = await apiRequest(endpoint, {
        method,
        data
      });

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/relationships"] });
      setIsDialogOpen(false);
      setEditingRelationship(null);
      form.reset();
      toast({
        title: "Success",
        description: `Relationship ${editingRelationship ? 'updated' : 'created'} successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingRelationship ? 'update' : 'create'} relationship`,
        variant: "destructive",
      });
    },
  });

  // Create attribute definition mutation - updated with proper error handling
  const mutateAttributeDefinition = useMutation({
    mutationFn: async (data: AttributeDefinitionForm) => {
      if (!selectedRelationshipId) {
        throw new Error("No relationship selected");
      }

      const requestData = {
        ...data,
        relationshipTypeId: selectedRelationshipId
      };

      try {
        const response = await apiRequest(`/api/relationships/${selectedRelationshipId}/attribute-definitions`, {
          method: 'POST',
          data: requestData
        });

        const result = await response.json();
        return result;
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/relationships/${selectedRelationshipId}/attribute-definitions`],
      });
      attributeForm.reset({
        name: "",
        dataType: undefined,
        isRequired: false,
        description: "",
      });
      toast({
        title: "Success",
        description: "Attribute definition created successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Error creating attribute:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create attribute definition",
        variant: "destructive",
      });
    },
  });

  // Delete relationship mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/relationships/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/relationships"] });
      toast({
        title: "Success",
        description: "Relationship deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete relationship",
        variant: "destructive",
      });
    },
  });

  // Delete attribute definition mutation
  const deleteAttributeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/relationships/attribute-definitions/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/relationships/${selectedRelationshipId}/attribute-definitions`],
      });
      toast({
        title: "Success",
        description: "Attribute definition deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete attribute definition",
        variant: "destructive",
      });
    },
  });

  const attributeForm = useForm<AttributeDefinitionForm>({
    resolver: zodResolver(attributeDefinitionSchema),
    defaultValues: {
      isRequired: false,
      description: "",
    },
  });

  function onSubmit(data: RelationshipForm) {
    mutateRelationship.mutate(data);
  }

  function onAttributeSubmit(data: AttributeDefinitionForm) {
    mutateAttributeDefinition.mutate(data);
  }

  function handleEdit(relationship: Relationship) {
    setEditingRelationship(relationship);

    // First set all the form values
    form.reset({
      name: relationship.name,
      sourceDataSetId: relationship.sourceDataSetId.toString(),
      targetDataSetId: relationship.targetDataSetId.toString(),
      relationshipType: relationship.relationshipType,
      cardinality: relationship.cardinality,
      sourceField: relationship.sourceField,
      targetField: relationship.targetField,
    });

    // Then trigger the field population
    handleSourceDatasetChange(relationship.sourceDataSetId.toString());
    handleTargetDatasetChange(relationship.targetDataSetId.toString());

    // Finally open the dialog
    setIsDialogOpen(true);
  }

  function handleDelete(id: number) {
    if (window.confirm("Are you sure you want to delete this relationship?")) {
      deleteMutation.mutate(id);
    }
  }

  function handleDeleteAttribute(id: number) {
    if (window.confirm("Are you sure you want to delete this attribute definition?")) {
      deleteAttributeMutation.mutate(id);
    }
  }

  // Helper function to get dataset name by ID
  const getDataSetName = (id: number) => {
    return dataSets.find(ds => ds.id === id)?.name || "Unknown Dataset";
  };

  // Update the handleSourceDatasetChange function
  const handleSourceDatasetChange = async (value: string) => {
    console.log("Source Dataset selected:", value);
    form.setValue("sourceDataSetId", value);

    try {
      console.log("Fetching source dataset fields:", value);
      const response = await apiRequest(`/reference-data/${value}`, {
        method: 'GET'
      });
      const data = await response.json();
      console.log("Source dataset API response:", data);

      setApiDebugData(prev => ({
        ...prev,
        source: data,
        sourceSelection: `Selected dataset ID: ${value}`
      }));

      if (!data?.data) {
        console.log("No data in source dataset");
        setSourceFields([]);
        return;
      }

      const instances = Object.values(data.data);
      if (instances.length === 0) {
        console.log("No instances found in source dataset");
        setSourceFields([]);
        return;
      }

      const firstInstance = instances[0];
      const fields = Object.keys(firstInstance).filter(field => !field.startsWith('_'));
      console.log("Source dataset fields:", fields);
      setSourceFields(fields);
    } catch (error) {
      console.error("Error fetching source dataset:", error);
      setSourceFields([]);
      setApiDebugData(prev => ({
        ...prev,
        source: { error: error instanceof Error ? error.message : "Failed to fetch dataset" }
      }));
    }
  };

  // Update the handleTargetDatasetChange function
  const handleTargetDatasetChange = async (value: string) => {
    console.log("Target Dataset selected:", value);
    form.setValue("targetDataSetId", value);

    try {
      console.log("Fetching target dataset fields:", value);
      const response = await apiRequest(`/reference-data/${value}`, {
        method: 'GET'
      });
      const data = await response.json();
      console.log("Target dataset API response:", data);

      setApiDebugData(prev => ({
        ...prev,
        target: data,
        targetSelection: `Selected dataset ID: ${value}`
      }));

      if (!data?.data) {
        console.log("No data in target dataset");
        setTargetFields([]);
        return;
      }

      const instances = Object.values(data.data);
      if (instances.length === 0) {
        console.log("No instances found in target dataset");
        setTargetFields([]);
        return;
      }

      const firstInstance = instances[0];
      const fields = Object.keys(firstInstance).filter(field => !field.startsWith('_'));
      console.log("Target dataset fields:", fields);
      setTargetFields(fields);
    } catch (error) {
      console.error("Error fetching target dataset:", error);
      setTargetFields([]);
      setApiDebugData(prev => ({
        ...prev,
        target: { error: error instanceof Error ? error.message : "Failed to fetch dataset" }
      }));
    }
  };



  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitFork className="h-5 w-5" />
              Relationship Management
            </CardTitle>
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  setEditingRelationship(null);
                  form.reset();
                  setApiDebugData({}); // Clear debug data when dialog closes
                }
                setIsDialogOpen(open);
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Relationship
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingRelationship ? 'Edit Relationship' : 'Create New Relationship'}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter relationship name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="sourceDataSetId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Source Data Set</FormLabel>
                            <Select
                              onValueChange={handleSourceDatasetChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select source data set" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {dataSets.map((dataSet) => (
                                  <SelectItem
                                    key={dataSet.id}
                                    value={dataSet.id.toString()}
                                  >
                                    {dataSet.name}
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
                        name="targetDataSetId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Data Set</FormLabel>
                            <Select
                              onValueChange={handleTargetDatasetChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select target data set" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {dataSets.map((dataSet) => (
                                  <SelectItem
                                    key={dataSet.id}
                                    value={dataSet.id.toString()}
                                  >
                                    {dataSet.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="relationshipType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select relationship type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="parent-child">Parent-Child</SelectItem>
                                <SelectItem value="reference">Reference</SelectItem>
                                <SelectItem value="association">Association</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cardinality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cardinality</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select cardinality" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="one-to-one">One-to-One</SelectItem>
                                <SelectItem value="one-to-many">One-to-Many</SelectItem>
                                <SelectItem value="many-to-many">Many-to-Many</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="sourceField"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Source Field</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={!selectedSourceDataset}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select source field" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {sourceFields.map((fieldName) => (
                                  <SelectItem key={fieldName} value={fieldName}>
                                    {fieldName}
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
                        name="targetField"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Field</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={!selectedTargetDataset}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select target field" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {targetFields.map((fieldName) => (
                                  <SelectItem key={fieldName} value={fieldName}>
                                    {fieldName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Enhanced API Debug Section */}
                    <div className="mt-6 space-y-4">
                      <h3 className="text-sm font-medium">API Response Debug</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Source Dataset Response</label>
                          <div className="space-y-2">
                            <div className="text-xs text-blue-600">
                              {apiDebugData.sourceSelection || "No selection made yet"}
                            </div>
                            <textarea
                              className="w-full h-32 mt-1 px-3 py-2 text-sm border rounded-md bg-muted"
                              value={JSON.stringify(apiDebugData.source, null, 2)}
                              readOnly
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Target Dataset Response</label>
                          <div className="space-y-2">
                            <div className="text-xs text-blue-600">
                              {apiDebugData.targetSelection || "No selection made yet"}
                            </div>
                            <textarea
                              className="w-full h-32 mt-1 px-3 py-2 text-sm border rounded-md bg-muted"
                              value={JSON.stringify(apiDebugData.target, null, 2)}
                              readOnly
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full">
                      {editingRelationship ? 'Update' : 'Create'} Relationship
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoadingRelationships ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : relationships.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Source Dataset</TableHead>
                    <TableHead>Source Field</TableHead>
                    <TableHead className="w-[100px]">Relationship</TableHead>
                    <TableHead>Target Dataset</TableHead>
                    <TableHead>Target Field</TableHead>
                    <TableHead>Cardinality</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relationships.map((relationship) => (
                    <TableRow key={relationship.id}>
                      <TableCell>{relationship.name}</TableCell>
                      <TableCell>{getDataSetName(relationship.sourceDataSetId)}</TableCell>
                      <TableCell>{relationship.sourceField}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-sm">
                          <ArrowRight className="h-4 w-4" />
                          {relationship.relationshipType}
                        </span>
                      </TableCell>
                      <TableCell>{getDataSetName(relationship.targetDataSetId)}</TableCell>
                      <TableCell>{relationship.targetField}</TableCell>
                      <TableCell>{relationship.cardinality}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRelationshipId(relationship.id);
                            setIsAttributeDialogOpen(true);
                          }}
                          className="hover:bg-blue-50"
                        >
                          <Settings className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="hover:bg-green-50"
                        >
                          <Link to={`/relationships/${relationship.id}/values`}>
                            <LinkIcon className="h-4 w-4 text-green-600" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(relationship)}
                          className="hover:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(relationship.id)}
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
              <div className="text-center py-8 text-gray-500">
                <GitFork className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No relationships defined yet.</p>
                <p className="text-sm">Click the "New Relationship" button to create one.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attribute Definitions Dialog */}
        <Dialog
          open={isAttributeDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              attributeForm.reset({
                name: "",
                dataType: undefined,
                isRequired: false,
                description: "",
              });
            }
            setIsAttributeDialogOpen(open);
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage Relationship Attributes</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Form {...attributeForm}>
                <form onSubmit={attributeForm.handleSubmit(onAttributeSubmit)} className="space-y-4">
                  <FormField
                    control={attributeForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Attribute Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter attribute name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={attributeForm.control}
                    name="dataType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select data type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={attributeForm.control}
                    name="isRequired"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Required</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={attributeForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Add Attribute Definition
                  </Button>
                </form>
              </Form>

              {/* Display existing attribute definitions */}
              {attributeDefinitions.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Existing Attributes</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attributeDefinitions.map((attr) => (
                        <TableRow key={attr.id}>
                          <TableCell>{attr.name}</TableCell>
                          <TableCell>{attr.dataType}</TableCell>
                          <TableCell>{attr.isRequired ? "Yes" : "No"}</TableCell>
                          <TableCell>{attr.description}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAttribute(attr.id)}
                              className="hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}