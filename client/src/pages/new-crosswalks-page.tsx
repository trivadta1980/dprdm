import React, { useState, useEffect, createRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  PlusCircle, Edit, Trash2, Download, Upload, FileText,
  Search, CheckCircle, XCircle, ExternalLink
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { parse } from "csv-parse/sync";

// Interfaces
interface CrosswalkMapping {
  id: number;
  name: string;
  description: string;
  sourceSystemId: number;
  targetSystemId: number;
  mappingData: {
    sourceAttribute: string;
    targetAttribute: string;
    mappings: Array<{
      sourceValue: string;
      targetValue: string;
      confidence: number;
    }>;
  };
}

interface DataSet {
  id: number;
  name: string;
  typeId: number;
}

interface SchemaField {
  name: string;
}

interface Mapping {
  sourceValue: string;
  targetValue: string;
  confidence: number;
}

interface CSVMapping {
  sourceValue?: string;
  targetValue?: string;
  [key: string]: string | undefined;
}

// Zod schemas
const crosswalkFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sourceSystemId: z.number().min(1, "Source system is required"),
  targetSystemId: z.number().min(1, "Target system is required"),
  sourceAttribute: z.string().min(1, "Source attribute is required"),
  targetAttribute: z.string().min(1, "Target attribute is required"),
});

export default function NewCrosswalksPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // State for list view
  const [selectedCrosswalk, setSelectedCrosswalk] = useState<CrosswalkMapping | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // State for create/edit form
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showCreateContent, setShowCreateContent] = useState(false);
  
  // State for CSV import
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [filteredMappings, setFilteredMappings] = useState<Mapping[]>([]);
  const [sourceFilter, setSourceFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [confidenceOperator, setConfidenceOperator] = useState<"gt" | "lt" | "eq">("gt");
  const [confidenceValue, setConfidenceValue] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string | null>(null);
  const fileInputRef = createRef<HTMLInputElement>();

  // State for attributes
  const [selectedSourceDataset, setSelectedSourceDataset] = useState<number | null>(null);
  const [selectedTargetDataset, setSelectedTargetDataset] = useState<number | null>(null);
  const [selectedSourceAttribute, setSelectedSourceAttribute] = useState<string | null>(null);
  const [selectedTargetAttribute, setSelectedTargetAttribute] = useState<string | null>(null);
  const [sourceAttributeValues, setSourceAttributeValues] = useState<string[]>([]);
  const [targetAttributeValues, setTargetAttributeValues] = useState<string[]>([]);
  
  // Form setup
  const form = useForm<z.infer<typeof crosswalkFormSchema>>({
    resolver: zodResolver(crosswalkFormSchema),
    defaultValues: {
      name: "",
      description: "",
      sourceSystemId: undefined as unknown as number,
      targetSystemId: undefined as unknown as number,
      sourceAttribute: "",
      targetAttribute: "",
    },
  });

  // Fetch all crosswalks
  const { data: crosswalks, isLoading: isLoadingCrosswalks } = useQuery({
    queryKey: ["/api/crosswalks"],
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to load crosswalks: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Fetch all reference data sets for dropdown
  const { data: dataSets, isLoading: isLoadingDataSets } = useQuery({
    queryKey: ["/api/reference-data"],
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to load reference data sets: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for creating a crosswalk
  const createCrosswalkMutation = useMutation({
    mutationFn: async (data: z.infer<typeof crosswalkFormSchema>) => {
      const response = await fetch("/api/crosswalks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || "",
          sourceSystemId: data.sourceSystemId,
          targetSystemId: data.targetSystemId,
          mappingData: {
            sourceAttribute: data.sourceAttribute,
            targetAttribute: data.targetAttribute,
            mappings: mappings,
          },
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create crosswalk mapping");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Crosswalk mapping created successfully",
      });
      form.reset();
      setMappings([]);
      setFilteredMappings([]);
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/crosswalks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create crosswalk mapping: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a crosswalk
  const updateCrosswalkMutation = useMutation({
    mutationFn: async (data: { id: number; crosswalk: z.infer<typeof crosswalkFormSchema> }) => {
      const response = await fetch(`/api/crosswalks/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.crosswalk.name,
          description: data.crosswalk.description || "",
          sourceSystemId: data.crosswalk.sourceSystemId,
          targetSystemId: data.crosswalk.targetSystemId,
          mappingData: {
            sourceAttribute: data.crosswalk.sourceAttribute,
            targetAttribute: data.crosswalk.targetAttribute,
            mappings: mappings,
          },
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update crosswalk mapping");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Crosswalk mapping updated successfully",
      });
      form.reset();
      setMappings([]);
      setFilteredMappings([]);
      setIsCreateDialogOpen(false);
      setIsEditMode(false);
      setSelectedCrosswalk(null);
      queryClient.invalidateQueries({ queryKey: ["/api/crosswalks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update crosswalk mapping: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a crosswalk
  const deleteCrosswalkMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/crosswalks/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete crosswalk mapping");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Crosswalk mapping deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/crosswalks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete crosswalk mapping: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Fetch schema for source dataset
  const { data: sourceSchema, isLoading: isLoadingSourceSchema } = useQuery({
    queryKey: ["/api/reference-data-type-schemas", selectedSourceDataset],
    enabled: !!selectedSourceDataset,
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to load source schema: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Fetch schema for target dataset
  const { data: targetSchema, isLoading: isLoadingTargetSchema } = useQuery({
    queryKey: ["/api/reference-data-type-schemas", selectedTargetDataset],
    enabled: !!selectedTargetDataset,
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to load target schema: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Fetch data for source dataset
  const { data: sourceData } = useQuery({
    queryKey: ["/api/reference-data", selectedSourceDataset],
    enabled: !!selectedSourceDataset && !!selectedSourceAttribute,
    onSuccess: (data) => {
      if (data && data.data) {
        // Extract unique values for the selected attribute
        const values = Object.values(data.data)
          .map((instance: any) => instance[selectedSourceAttribute || ""])
          .filter(Boolean)
          .filter((value, index, self) => self.indexOf(value) === index);
        
        setSourceAttributeValues(values);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to load source data: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Fetch data for target dataset
  const { data: targetData } = useQuery({
    queryKey: ["/api/reference-data", selectedTargetDataset],
    enabled: !!selectedTargetDataset && !!selectedTargetAttribute,
    onSuccess: (data) => {
      if (data && data.data) {
        // Extract unique values for the selected attribute
        const values = Object.values(data.data)
          .map((instance: any) => instance[selectedTargetAttribute || ""])
          .filter(Boolean)
          .filter((value, index, self) => self.indexOf(value) === index);
        
        setTargetAttributeValues(values);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to load target data: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Effect to update the filtered mappings when filters or mappings change
  useEffect(() => {
    console.log('Mappings state changed:', mappings);
  }, [mappings]);

  useEffect(() => {
    // Check if all filters are empty/default
    const areAllFiltersEmpty = 
      sourceFilter === '' && 
      targetFilter === '' && 
      confidenceValue === '';
    
    if (areAllFiltersEmpty) {
      // If all filters are empty, show all mappings without filtering
      console.log('No active filters, displaying all mappings');
      setFilteredMappings([...mappings]);
      return;
    }
    
    console.log('Active filters detected, applying filtering');
    
    // Simple filtering logic for now
    const filtered = mappings.filter(mapping => {
      // Guard against missing properties
      const sourceValue = mapping.sourceValue || '';
      const targetValue = mapping.targetValue || '';
      const confidence = mapping.confidence ?? 0;

      const sourceMatch = sourceFilter === '' || 
        sourceValue.toLowerCase().includes(sourceFilter.toLowerCase());

      const targetMatch = targetFilter === '' || 
        targetValue.toLowerCase().includes(targetFilter.toLowerCase());

      const confidencePercent = Number((confidence * 100).toFixed(0));
      const confidenceNumValue = Number(confidenceValue);

      const confidenceMatch = confidenceValue === "" || (
        confidenceOperator === "gt" ? confidencePercent > confidenceNumValue :
        confidenceOperator === "lt" ? confidencePercent < confidenceNumValue :
        confidencePercent === confidenceNumValue
      );

      return sourceMatch && targetMatch && confidenceMatch;
    });

    console.log('Filtered mappings result. Count:', filtered.length);
    setFilteredMappings(filtered);

  }, [mappings, sourceFilter, targetFilter, confidenceOperator, confidenceValue]);

  // Form submission handler
  const onSubmit = (data: z.infer<typeof crosswalkFormSchema>) => {
    if (isEditMode && selectedCrosswalk) {
      updateCrosswalkMutation.mutate({ id: selectedCrosswalk.id, crosswalk: data });
    } else {
      createCrosswalkMutation.mutate(data);
    }
  };

  // Handle edit button click
  const handleEdit = (crosswalk: CrosswalkMapping) => {
    setIsEditMode(true);
    setSelectedCrosswalk(crosswalk);
    setIsCreateDialogOpen(true);
    
    // Set form values
    form.reset({
      name: crosswalk.name,
      description: crosswalk.description,
      sourceSystemId: crosswalk.sourceSystemId,
      targetSystemId: crosswalk.targetSystemId,
      sourceAttribute: crosswalk.mappingData.sourceAttribute,
      targetAttribute: crosswalk.mappingData.targetAttribute,
    });
    
    // Set dataset selections
    setSelectedSourceDataset(crosswalk.sourceSystemId);
    setSelectedTargetDataset(crosswalk.targetSystemId);
    setSelectedSourceAttribute(crosswalk.mappingData.sourceAttribute);
    setSelectedTargetAttribute(crosswalk.mappingData.targetAttribute);
    
    // Set mappings
    setMappings(crosswalk.mappingData.mappings);
    setFilteredMappings(crosswalk.mappingData.mappings);
  };

  // Handle delete button click
  const handleDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const confirmDelete = () => {
    if (deleteId) {
      deleteCrosswalkMutation.mutate(deleteId);
    }
  };

  // Handle create new button click
  const handleCreateNew = () => {
    setIsEditMode(false);
    setSelectedCrosswalk(null);
    setMappings([]);
    setFilteredMappings([]);
    form.reset();
    setIsCreateDialogOpen(true);
  };

  // Function to handle CSV file import
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        // Parse CSV content
        const records = parse(content, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });

        // Transform records into mappings
        const newMappings: Mapping[] = records.map((record: CSVMapping) => {
          let sourceValue = record.sourceValue;
          let targetValue = record.targetValue;
          
          // Handle template format (Source_X, Target_X)
          if (!sourceValue && !targetValue) {
            const sourceKey = Object.keys(record).find(key => key.startsWith("Source_"));
            const targetKey = Object.keys(record).find(key => key.startsWith("Target_"));
            
            if (sourceKey) sourceValue = record[sourceKey];
            if (targetKey) targetValue = record[targetKey];
          }

          return {
            sourceValue: sourceValue || "",
            targetValue: targetValue || "",
            confidence: 1.0, // Default confidence
          };
        });

        // Update state
        setMappings(prevMappings => [...prevMappings, ...newMappings]);
        setFilteredMappings(prevMappings => [...prevMappings, ...newMappings]);
        
        toast({
          title: "Success",
          description: `Imported ${newMappings.length} mappings from CSV`,
        });
      } catch (error) {
        console.error("Error parsing CSV:", error);
        toast({
          title: "Error",
          description: "Failed to parse CSV file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  // Generate template CSV for download
  const handleDownloadTemplate = () => {
    const header = "sourceValue,targetValue\n";
    const blob = new Blob([header], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "crosswalk_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export current mappings to CSV
  const handleExportCSV = () => {
    if (mappings.length === 0) {
      toast({
        title: "No Data",
        description: "There are no mappings to export",
        variant: "destructive",
      });
      return;
    }

    const header = "sourceValue,targetValue,confidencePercent\n";
    const rows = mappings.map(
      (m) => 
        `${m.sourceValue},${m.targetValue},${(m.confidence * 100).toFixed(0)}`
    ).join("\n");
    
    const content = header + rows;
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.getValues().name.replace(/\s+/g, "_")}_export.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Function to update a mapping
  const updateMapping = (index: number, newTargetValue: string | null) => {
    if (newTargetValue) {
      setMappings((prevMappings) => {
        const newMappings = [...prevMappings];
        newMappings[index] = {
          ...newMappings[index],
          targetValue: newTargetValue,
        };
        return newMappings;
      });
    }
    setEditingIndex(null);
    setEditValue(null);
  };

  // Function to generate payload for saving
  const generatePayload = () => {
    return {
      name: form.getValues().name,
      description: form.getValues().description || "",
      sourceSystemId: form.getValues().sourceSystemId,
      targetSystemId: form.getValues().targetSystemId,
      mappingData: {
        sourceAttribute: selectedSourceAttribute,
        targetAttribute: selectedTargetAttribute,
        mappings: mappings,
      },
    };
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Crosswalk Mappings</h1>
            <p className="text-muted-foreground">
              Map values between different reference data systems
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Crosswalk
          </Button>
        </div>

        {/* Crosswalks List */}
        <Card>
          <CardHeader>
            <CardTitle>Available Crosswalks</CardTitle>
            <CardDescription>
              List of all crosswalk mappings in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCrosswalks ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : crosswalks && crosswalks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Source System</TableHead>
                    <TableHead>Target System</TableHead>
                    <TableHead>Mappings</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crosswalks.map((crosswalk: CrosswalkMapping) => (
                    <TableRow key={crosswalk.id}>
                      <TableCell className="font-medium">{crosswalk.name}</TableCell>
                      <TableCell>{crosswalk.description}</TableCell>
                      <TableCell>
                        {dataSets?.find((ds: DataSet) => ds.id === crosswalk.sourceSystemId)?.name || 
                          `System ID: ${crosswalk.sourceSystemId}`}
                      </TableCell>
                      <TableCell>
                        {dataSets?.find((ds: DataSet) => ds.id === crosswalk.targetSystemId)?.name || 
                          `System ID: ${crosswalk.targetSystemId}`}
                      </TableCell>
                      <TableCell>
                        {crosswalk.mappingData?.mappings?.length || 0} mappings
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(crosswalk)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(crosswalk.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate(`/crosswalks/${crosswalk.id}`)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No crosswalks found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Get started by creating a new crosswalk mapping.
                </p>
                <Button className="mt-4" onClick={handleCreateNew}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Crosswalk
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Edit Crosswalk Mapping" : "Create New Crosswalk Mapping"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Update the details of this crosswalk mapping"
                  : "Define a new mapping between reference data systems"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a name" {...field} />
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
                          <Textarea
                            placeholder="Enter a description (optional)"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sourceSystemId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source System</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value?.toString()}
                            onValueChange={(value) => {
                              const numValue = parseInt(value, 10);
                              field.onChange(numValue);
                              setSelectedSourceDataset(numValue);
                              setSelectedSourceAttribute(null);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a source system" />
                            </SelectTrigger>
                            <SelectContent>
                              {isLoadingDataSets ? (
                                <div className="flex justify-center p-2">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                </div>
                              ) : (
                                dataSets?.map((dataSet: DataSet) => (
                                  <SelectItem key={dataSet.id} value={dataSet.id.toString()}>
                                    {dataSet.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetSystemId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target System</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value?.toString()}
                            onValueChange={(value) => {
                              const numValue = parseInt(value, 10);
                              field.onChange(numValue);
                              setSelectedTargetDataset(numValue);
                              setSelectedTargetAttribute(null);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a target system" />
                            </SelectTrigger>
                            <SelectContent>
                              {isLoadingDataSets ? (
                                <div className="flex justify-center p-2">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                </div>
                              ) : (
                                dataSets?.map((dataSet: DataSet) => (
                                  <SelectItem key={dataSet.id} value={dataSet.id.toString()}>
                                    {dataSet.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sourceAttribute"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source Attribute</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedSourceAttribute(value);
                            }}
                            disabled={!selectedSourceDataset}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select source attribute" />
                            </SelectTrigger>
                            <SelectContent>
                              {isLoadingSourceSchema ? (
                                <div className="flex justify-center p-2">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                </div>
                              ) : (
                                sourceSchema?.map((field: SchemaField) => (
                                  <SelectItem key={field.name} value={field.name}>
                                    {field.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetAttribute"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Attribute</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedTargetAttribute(value);
                            }}
                            disabled={!selectedTargetDataset}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select target attribute" />
                            </SelectTrigger>
                            <SelectContent>
                              {isLoadingTargetSchema ? (
                                <div className="flex justify-center p-2">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                </div>
                              ) : (
                                targetSchema?.map((field: SchemaField) => (
                                  <SelectItem key={field.name} value={field.name}>
                                    {field.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Mappings Section */}
                {selectedSourceAttribute && selectedTargetAttribute && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Value Mappings</h3>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label htmlFor="csv-upload">
                          <Button variant="outline" asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              Import from CSV
                            </span>
                          </Button>
                        </label>
                        <Button
                          variant="outline"
                          onClick={handleExportCSV}
                          disabled={mappings.length === 0}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export to CSV
                        </Button>
                        <Button
                          type="button"
                          onClick={handleDownloadTemplate}
                          variant="outline"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Template
                        </Button>
                      </div>
                    </div>

                    {/* Mapping Table */}
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              <div className="space-y-2">
                                <span>Source Value</span>
                                <Input
                                  placeholder="Filter source..."
                                  value={sourceFilter}
                                  onChange={(e) => setSourceFilter(e.target.value)}
                                  className="w-full"
                                />
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="space-y-2">
                                <span>Target Value</span>
                                <Input
                                  placeholder="Filter target..."
                                  value={targetFilter}
                                  onChange={(e) => setTargetFilter(e.target.value)}
                                  className="w-full"
                                />
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="space-y-2">
                                <span>Confidence</span>
                                <div className="flex gap-2">
                                  <Select
                                    value={confidenceOperator}
                                    onValueChange={(value: "gt" | "lt" | "eq") => setConfidenceOperator(value)}
                                  >
                                    <SelectTrigger className="w-[100px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="gt">&gt;</SelectItem>
                                      <SelectItem value="lt">&lt;</SelectItem>
                                      <SelectItem value="eq">=</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="Value %"
                                    value={confidenceValue}
                                    onChange={(e) => {
                                      const value = Math.max(0, Math.min(100, Number(e.target.value)));
                                      setConfidenceValue(value.toString());
                                    }}
                                    className="w-[100px]"
                                  />
                                </div>
                              </div>
                            </TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMappings.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center h-24">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  {mappings.length === 0 ? (
                                    <>
                                      <FileText className="h-8 w-8 text-muted-foreground" />
                                      <p className="text-lg font-medium">No mappings yet</p>
                                      <p className="text-muted-foreground">
                                        Import mappings from CSV using the button above
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <Search className="h-8 w-8 text-muted-foreground" />
                                      <p className="text-lg font-medium">No matching mappings</p>
                                      <p className="text-muted-foreground">
                                        Try adjusting your filter criteria or{" "}
                                        <Button variant="link" onClick={() => {
                                          setSourceFilter('');
                                          setTargetFilter('');
                                          setConfidenceValue('');
                                          setConfidenceOperator('gt');
                                        }}>
                                          clear all filters
                                        </Button>
                                      </p>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredMappings.map((mapping, index) => (
                              <TableRow key={`${mapping.sourceValue}-${mapping.targetValue}-${index}`}>
                                <TableCell>{mapping.sourceValue}</TableCell>
                                <TableCell>
                                  {editingIndex === index ? (
                                    <Select
                                      value={editValue || mapping.targetValue}
                                      onValueChange={setEditValue}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose target value" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {targetAttributeValues.map((value) => (
                                          <SelectItem key={value} value={value}>
                                            {value}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    mapping.targetValue
                                  )}
                                </TableCell>
                                <TableCell>{(mapping.confidence * 100).toFixed(0)}%</TableCell>
                                <TableCell>
                                  {editingIndex === index ? (
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => updateMapping(index, editValue)}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingIndex(null)}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setEditingIndex(index);
                                        setEditValue(mapping.targetValue);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Debug Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Debug Information</CardTitle>
                        <CardDescription>Mapping Data (Count: {mappings.length})</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[150px] w-full rounded-md border p-4">
                          <pre className="text-sm">
                            {JSON.stringify(generatePayload(), null, 2)}
                          </pre>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={
                      createCrosswalkMutation.isPending || 
                      updateCrosswalkMutation.isPending
                    }
                  >
                    {(createCrosswalkMutation.isPending || updateCrosswalkMutation.isPending) ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {isEditMode ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      isEditMode ? "Update Crosswalk" : "Create Crosswalk"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this crosswalk mapping? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteCrosswalkMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}