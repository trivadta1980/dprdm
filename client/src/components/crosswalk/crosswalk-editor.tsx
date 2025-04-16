import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { MappingDialog } from "@/components/mapping/mapping-dialog";
import { MappingItem } from "@/components/mapping/mapping-editor";

// Create the schema for the form
const crosswalkFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sourceSystemId: z.number({ required_error: "Source system is required" }),
  targetSystemId: z.number({ required_error: "Target system is required" }),
  sourceAttribute: z.string().min(1, "Source attribute is required"),
  targetAttribute: z.string().min(1, "Target attribute is required"),
});

// Define the form data type
type CrosswalkFormData = z.infer<typeof crosswalkFormSchema>;

// Define props for the component
interface CrosswalkEditorProps {
  isEditMode?: boolean;
  initialData?: {
    id?: number;
    name: string;
    description?: string;
    sourceSystemId: number;
    targetSystemId: number;
    sourceAttribute: string;
    targetAttribute: string;
    mappings: MappingItem[];
  };
  dataSets: Array<{
    id: number;
    name: string;
    typeId: number;
  }>;
  onSave: (data: CrosswalkFormData & { mappings: MappingItem[] }) => Promise<void> | void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * A reusable component for creating and editing crosswalk mappings.
 * This demonstrates how to integrate the mapping components into a specific use case.
 */
export function CrosswalkEditor({
  isEditMode = false,
  initialData,
  dataSets,
  onSave,
  onCancel,
  isLoading = false,
}: CrosswalkEditorProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // State for selected datasets and attributes
  const [selectedSourceDataset, setSelectedSourceDataset] = useState<number | null>(
    initialData?.sourceSystemId || null
  );
  const [selectedTargetDataset, setSelectedTargetDataset] = useState<number | null>(
    initialData?.targetSystemId || null
  );
  
  // State for schema data
  const [sourceSchema, setSourceSchema] = useState<Array<{ name: string }>>([]);
  const [targetSchema, setTargetSchema] = useState<Array<{ name: string }>>([]);
  const [isLoadingSourceSchema, setIsLoadingSourceSchema] = useState(false);
  const [isLoadingTargetSchema, setIsLoadingTargetSchema] = useState(false);
  
  // State for attribute data
  const [sourceAttributeValues, setSourceAttributeValues] = useState<string[]>([]);
  const [targetAttributeValues, setTargetAttributeValues] = useState<string[]>([]);
  const [isLoadingSourceData, setIsLoadingSourceData] = useState(false);
  const [isLoadingTargetData, setIsLoadingTargetData] = useState(false);
  
  // State for mappings dialog
  const [mappings, setMappings] = useState<MappingItem[]>(initialData?.mappings || []);
  const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form setup
  const form = useForm<CrosswalkFormData>({
    resolver: zodResolver(crosswalkFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      sourceSystemId: initialData?.sourceSystemId,
      targetSystemId: initialData?.targetSystemId,
      sourceAttribute: initialData?.sourceAttribute || "",
      targetAttribute: initialData?.targetAttribute || "",
    },
  });

  // Load source dataset type and schema
  useEffect(() => {
    async function loadSourceSchema() {
      if (!selectedSourceDataset) return;
      
      try {
        setIsLoadingSourceSchema(true);
        
        // Step 1: Get dataset details to find its type ID
        const datasetResponse = await fetch(`/api/reference-data/${selectedSourceDataset}`);
        if (!datasetResponse.ok) {
          throw new Error("Failed to fetch source dataset details");
        }
        const datasetData = await datasetResponse.json();
        
        // Step 2: Get schema for the dataset's type
        const schemaResponse = await fetch(`/api/reference-types/${datasetData.typeId}/schemas`);
        if (!schemaResponse.ok) {
          throw new Error("Failed to fetch source schema");
        }
        const schemaData = await schemaResponse.json();
        
        setSourceSchema(schemaData);
        
        // Clear selected attribute if changing dataset
        if (form.getValues().sourceSystemId !== selectedSourceDataset) {
          form.setValue("sourceAttribute", "");
        }
      } catch (error) {
        console.error("Error loading source schema:", error);
        toast({
          title: "Error",
          description: `Failed to load source schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      } finally {
        setIsLoadingSourceSchema(false);
      }
    }
    
    loadSourceSchema();
  }, [selectedSourceDataset, form, toast]);
  
  // Load target dataset type and schema
  useEffect(() => {
    async function loadTargetSchema() {
      if (!selectedTargetDataset) return;
      
      try {
        setIsLoadingTargetSchema(true);
        
        // Step 1: Get dataset details to find its type ID
        const datasetResponse = await fetch(`/api/reference-data/${selectedTargetDataset}`);
        if (!datasetResponse.ok) {
          throw new Error("Failed to fetch target dataset details");
        }
        const datasetData = await datasetResponse.json();
        
        // Step 2: Get schema for the dataset's type
        const schemaResponse = await fetch(`/api/reference-types/${datasetData.typeId}/schemas`);
        if (!schemaResponse.ok) {
          throw new Error("Failed to fetch target schema");
        }
        const schemaData = await schemaResponse.json();
        
        setTargetSchema(schemaData);
        
        // Clear selected attribute if changing dataset
        if (form.getValues().targetSystemId !== selectedTargetDataset) {
          form.setValue("targetAttribute", "");
        }
      } catch (error) {
        console.error("Error loading target schema:", error);
        toast({
          title: "Error",
          description: `Failed to load target schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      } finally {
        setIsLoadingTargetSchema(false);
      }
    }
    
    loadTargetSchema();
  }, [selectedTargetDataset, form, toast]);
  
  // Load source attribute values
  useEffect(() => {
    async function loadSourceAttributeValues() {
      const sourceAttribute = form.getValues().sourceAttribute;
      if (!selectedSourceDataset || !sourceAttribute) {
        console.log("Debug Source Values: Early return - missing dataset or attribute", {
          selectedSourceDataset,
          sourceAttribute
        });
        return;
      }
      
      try {
        setIsLoadingSourceData(true);
        console.log(`Debug Source Values: Loading data for dataset ${selectedSourceDataset}, attribute ${sourceAttribute}`);
        
        // Fetch dataset values
        const response = await fetch(`/api/reference-data/${selectedSourceDataset}`);
        if (!response.ok) {
          throw new Error("Failed to load source data");
        }
        
        const data = await response.json();
        console.log("Debug Source Values: Received dataset data:", data);
        
        // Extract unique values for the selected attribute
        if (data && data.data) {
          console.log("Debug Source Values: Raw data instances:", data.data);
          
          const instances = Object.values(data.data);
          console.log("Debug Source Values: Instances:", instances);
          
          const attributeValues = instances.map((instance: any) => {
            const value = instance[sourceAttribute];
            console.log(`Debug Source Values: Instance ${JSON.stringify(instance)} has ${sourceAttribute} = ${value}`);
            return value;
          });
          console.log("Debug Source Values: All attribute values:", attributeValues);
          
          const filteredValues = attributeValues.filter(Boolean);
          console.log("Debug Source Values: Non-null values:", filteredValues);
          
          const uniqueValues = filteredValues.filter((value, index, self) => self.indexOf(value) === index);
          console.log("Debug Source Values: Final unique values:", uniqueValues);
          
          setSourceAttributeValues(uniqueValues as string[]);
        } else {
          console.error("Debug Source Values: Data is missing or malformed:", data);
        }
      } catch (error) {
        console.error("Error loading source values:", error);
        toast({
          title: "Error",
          description: `Failed to load source values: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      } finally {
        setIsLoadingSourceData(false);
      }
    }
    
    loadSourceAttributeValues();
  }, [selectedSourceDataset, form.watch("sourceAttribute"), toast]);
  
  // Load target attribute values
  useEffect(() => {
    async function loadTargetAttributeValues() {
      const targetAttribute = form.getValues().targetAttribute;
      if (!selectedTargetDataset || !targetAttribute) {
        console.log("Debug Target Values: Early return - missing dataset or attribute", {
          selectedTargetDataset,
          targetAttribute
        });
        return;
      }
      
      try {
        setIsLoadingTargetData(true);
        console.log(`Debug Target Values: Loading data for dataset ${selectedTargetDataset}, attribute ${targetAttribute}`);
        
        // Fetch dataset values
        const response = await fetch(`/api/reference-data/${selectedTargetDataset}`);
        if (!response.ok) {
          throw new Error("Failed to load target data");
        }
        
        const data = await response.json();
        console.log("Debug Target Values: Received dataset data:", data);
        
        // Extract unique values for the selected attribute
        if (data && data.data) {
          console.log("Debug Target Values: Raw data instances:", data.data);
          
          const instances = Object.values(data.data);
          console.log("Debug Target Values: Instances:", instances);
          
          const attributeValues = instances.map((instance: any) => {
            const value = instance[targetAttribute];
            console.log(`Debug Target Values: Instance ${JSON.stringify(instance)} has ${targetAttribute} = ${value}`);
            return value;
          });
          console.log("Debug Target Values: All attribute values:", attributeValues);
          
          const filteredValues = attributeValues.filter(Boolean);
          console.log("Debug Target Values: Non-null values:", filteredValues);
          
          const uniqueValues = filteredValues.filter((value, index, self) => self.indexOf(value) === index);
          console.log("Debug Target Values: Final unique values:", uniqueValues);
          
          setTargetAttributeValues(uniqueValues as string[]);
        } else {
          console.error("Debug Target Values: Data is missing or malformed:", data);
        }
      } catch (error) {
        console.error("Error loading target values:", error);
        toast({
          title: "Error",
          description: `Failed to load target values: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      } finally {
        setIsLoadingTargetData(false);
      }
    }
    
    loadTargetAttributeValues();
  }, [selectedTargetDataset, form.watch("targetAttribute"), toast]);
  
  // Handle form submission
  const onSubmit = async (data: CrosswalkFormData) => {
    try {
      setIsSaving(true);

      // Ensure each mapping has a status field before saving
      const updatedMappings = mappings.map(mapping => ({
        ...mapping,
        // If status is missing, set to DRAFT
        status: mapping.status || "DRAFT"
      }));
      
      // Update the local state with status-enhanced mappings
      setMappings(updatedMappings);
      
      // Submit both form data and enhanced mappings
      await onSave({
        ...data,
        mappings: updatedMappings
      });
      
      toast({
        title: "Success",
        description: `Crosswalk ${isEditMode ? 'updated' : 'created'} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} crosswalk: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle submitting for approval
  const handleSubmitForApproval = async (mappingsToSubmit: MappingItem[]) => {
    if (!initialData?.id) {
      toast({
        title: "Error",
        description: "Cannot submit for approval: Crosswalk ID is missing. Please save the crosswalk first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Ensure all mappings have status set to PENDING before submission
      const enhancedMappings = mappingsToSubmit.map(mapping => ({
        ...mapping,
        status: "PENDING" as const // Set status to PENDING for submission with type assertion
      }));
      
      // Call the API to submit the crosswalk for approval
      const response = await fetch(`/api/crosswalks/${initialData.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mappings: enhancedMappings,
          comment: "Submitted for approval"
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit for approval");
      }
      
      // Update the UI to show the latest mappings with PENDING status
      setMappings(enhancedMappings as MappingItem[]);
      
      // Dispatch an event to notify the approvals dashboard about the status change
      import("@/lib/eventBus").then(({ dispatchApprovalStatusChange }) => {
        console.log(`[CrosswalkEditor] Dispatching approval status change event for crosswalk ${initialData.id}`);
        dispatchApprovalStatusChange({
          crosswalkMappingId: initialData.id,
          actionType: 'update',
          userId: undefined // Will be set by the server
        });
      });
      
      toast({
        title: "Success",
        description: "Crosswalk submitted for approval successfully.",
      });
      
      // Close the dialog
      setIsMappingDialogOpen(false);
    } catch (error) {
      console.error("Error submitting for approval:", error);
      toast({
        title: "Error",
        description: `Failed to submit for approval: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Crosswalk Mapping" : "Create New Crosswalk Mapping"}</CardTitle>
        <CardDescription>
          {isEditMode
            ? "Update the details of this crosswalk mapping"
            : "Define a new mapping between reference data systems"}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
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
                      <Input 
                        placeholder="Enter a name" 
                        {...field} 
                        readOnly={isEditMode}
                        className={isEditMode ? "bg-muted cursor-not-allowed" : ""} 
                      />
                    </FormControl>
                    {isEditMode && (
                      <FormDescription>This field cannot be modified after creation</FormDescription>
                    )}
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
                        className={`resize-none ${isEditMode ? "bg-muted cursor-not-allowed" : ""}`}
                        {...field}
                        readOnly={isEditMode}
                      />
                    </FormControl>
                    {isEditMode && (
                      <FormDescription>This field cannot be modified after creation</FormDescription>
                    )}
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
                        }}
                        disabled={isEditMode}
                      >
                        <SelectTrigger className={isEditMode ? "bg-muted cursor-not-allowed" : ""}>
                          <SelectValue placeholder="Select a source system" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoading ? (
                            <div className="flex justify-center p-2">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          ) : (
                            dataSets.map((dataSet) => (
                              <SelectItem key={dataSet.id} value={dataSet.id.toString()}>
                                {dataSet.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {isEditMode && (
                      <FormDescription>This field cannot be modified after creation</FormDescription>
                    )}
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
                        }}
                        disabled={isEditMode}
                      >
                        <SelectTrigger className={isEditMode ? "bg-muted cursor-not-allowed" : ""}>
                          <SelectValue placeholder="Select a target system" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoading ? (
                            <div className="flex justify-center p-2">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          ) : (
                            dataSets.map((dataSet) => (
                              <SelectItem key={dataSet.id} value={dataSet.id.toString()}>
                                {dataSet.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {isEditMode && (
                      <FormDescription>This field cannot be modified after creation</FormDescription>
                    )}
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
                        onValueChange={field.onChange}
                        disabled={!selectedSourceDataset || isLoadingSourceSchema || isEditMode}
                      >
                        <SelectTrigger className={isEditMode ? "bg-muted cursor-not-allowed" : ""}>
                          <SelectValue placeholder="Select source attribute" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingSourceSchema ? (
                            <div className="flex justify-center p-2">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          ) : (
                            sourceSchema.map((field) => (
                              <SelectItem key={field.name} value={field.name}>
                                {field.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {isEditMode && (
                      <FormDescription>This field cannot be modified after creation</FormDescription>
                    )}
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
                        onValueChange={field.onChange}
                        disabled={!selectedTargetDataset || isLoadingTargetSchema || isEditMode}
                      >
                        <SelectTrigger className={isEditMode ? "bg-muted cursor-not-allowed" : ""}>
                          <SelectValue placeholder="Select target attribute" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingTargetSchema ? (
                            <div className="flex justify-center p-2">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          ) : (
                            targetSchema.map((field) => (
                              <SelectItem key={field.name} value={field.name}>
                                {field.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {isEditMode && (
                      <FormDescription>This field cannot be modified after creation</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Mappings Section - Displayed info and manage button */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium">Value Mappings</h3>
                  <p className="text-sm text-muted-foreground">
                    {mappings.length > 0
                      ? `${mappings.length} mapping${mappings.length !== 1 ? 's' : ''} defined`
                      : "No mappings defined yet"}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setIsMappingDialogOpen(true)}
                  disabled={
                    !form.getValues().sourceAttribute ||
                    !form.getValues().targetAttribute ||
                    isLoadingSourceData ||
                    isLoadingTargetData ||
                    isLoading ||
                    isSaving
                  }
                >
                  {isLoadingSourceData || isLoadingTargetData ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Manage Mappings
                </Button>
              </div>
              
              {/* Preview of mappings */}
              {mappings.length > 0 && (
                <div className="bg-background border rounded-md p-2 max-h-32 overflow-y-auto">
                  <div className="text-xs text-muted-foreground mb-1">Preview:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm font-medium">Source</div>
                    <div className="text-sm font-medium">Target</div>
                    {mappings.slice(0, 5).map((mapping, index) => (
                      <React.Fragment key={index}>
                        <div className="text-sm">{mapping.sourceValue}</div>
                        <div className="text-sm">{mapping.targetValue}</div>
                      </React.Fragment>
                    ))}
                    {mappings.length > 5 && (
                      <div className="col-span-2 text-sm text-muted-foreground text-center">
                        {mappings.length - 5} more mapping{mappings.length - 5 !== 1 ? 's' : ''}...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading || isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Update" : "Create"} Crosswalk
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      
      {/* Mapping Dialog */}
      <MappingDialog
        open={isMappingDialogOpen}
        onOpenChange={setIsMappingDialogOpen}
        title="Manage Value Mappings"
        description="Define mappings between source and target values"
        sourceLabel={form.getValues().sourceAttribute}
        targetLabel={form.getValues().targetAttribute}
        initialMappings={mappings}
        sourceValues={sourceAttributeValues}
        targetValues={targetAttributeValues}
        onSave={async (newMappings) => {
          setMappings(newMappings);
          return Promise.resolve();
        }}
        onSubmitForApproval={handleSubmitForApproval}
        showSubmitButton={isEditMode && initialData?.id !== undefined}
        crosswalkId={initialData?.id}
        isLoading={isLoadingSourceData || isLoadingTargetData}
      />
    </Card>
  );
}