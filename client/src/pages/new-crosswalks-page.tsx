import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MappingItem } from "@/components/mapping/mapping-editor";
import { CrosswalkEditor } from "@/components/crosswalk/crosswalk-editor";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PlusIcon, Pencil, Trash2 } from "lucide-react";
import { z } from "zod";

// Define types for the data
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

// Form schema for creating or updating crosswalks
const crosswalkFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sourceSystemId: z.number({ required_error: "Source system is required" }),
  targetSystemId: z.number({ required_error: "Target system is required" }),
  sourceAttribute: z.string().min(1, "Source attribute is required"),
  targetAttribute: z.string().min(1, "Target attribute is required"),
});

type CrosswalkFormData = z.infer<typeof crosswalkFormSchema>;

export default function NewCrosswalksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for UI elements
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCrosswalk, setSelectedCrosswalk] = useState<CrosswalkMapping | null>(null);
  const [deletingCrosswalkId, setDeletingCrosswalkId] = useState<number | null>(null);

  // Fetch all crosswalks
  const {
    data: crosswalks = [],
    isLoading: isLoadingCrosswalks,
    error: crosswalksError,
    refetch: refetchCrosswalks,
  } = useQuery({
    queryKey: ["/api/crosswalks"],
    queryFn: async () => {
      const response = await fetch("/api/crosswalks");
      if (!response.ok) {
        throw new Error("Failed to fetch crosswalks");
      }
      return response.json() as Promise<CrosswalkMapping[]>;
    },
  });

  // Handle error display
  useEffect(() => {
    if (crosswalksError) {
      toast({
        title: "Error",
        description: `Failed to load crosswalks: ${crosswalksError instanceof Error ? crosswalksError.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  }, [crosswalksError, toast]);

  // Fetch all reference data sets
  const {
    data: dataSets,
    isLoading: isLoadingDataSets,
    error: dataSetsError,
  } = useQuery({
    queryKey: ["/api/reference-data"],
    queryFn: async () => {
      const response = await fetch("/api/reference-data");
      if (!response.ok) {
        throw new Error("Failed to fetch reference data sets");
      }
      return response.json() as Promise<DataSet[]>;
    },
  });

  // Handle error display
  useEffect(() => {
    if (dataSetsError) {
      toast({
        title: "Error",
        description: `Failed to load reference data sets: ${dataSetsError instanceof Error ? dataSetsError.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  }, [dataSetsError, toast]);

  // Create crosswalk mutation
  const createCrosswalkMutation = useMutation({
    mutationFn: async (data: CrosswalkFormData & { mappings: MappingItem[] }) => {
      const response = await apiRequest("/api/crosswalks", {
        method: "POST",
        data: {
          name: data.name,
          description: data.description || "",
          sourceSystemId: data.sourceSystemId,
          targetSystemId: data.targetSystemId,
          mappingData: {
            sourceAttribute: data.sourceAttribute,
            targetAttribute: data.targetAttribute,
            mappings: data.mappings.map(m => ({
              sourceValue: m.sourceValue,
              targetValue: m.targetValue,
              confidence: m.confidence,
            })),
          },
        },
      });
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Crosswalk mapping created successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/crosswalks"] });
      setIsEditorOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create crosswalk: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update crosswalk mutation
  const updateCrosswalkMutation = useMutation({
    mutationFn: async (data: CrosswalkFormData & { mappings: MappingItem[]; id: number }) => {
      const response = await apiRequest(`/api/crosswalks/${data.id}`, {
        method: "PATCH",
        data: {
          name: data.name,
          description: data.description || "",
          sourceSystemId: data.sourceSystemId,
          targetSystemId: data.targetSystemId,
          mappingData: {
            sourceAttribute: data.sourceAttribute,
            targetAttribute: data.targetAttribute,
            mappings: data.mappings.map(m => ({
              sourceValue: m.sourceValue,
              targetValue: m.targetValue,
              confidence: m.confidence,
            })),
          },
        },
      });
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Crosswalk mapping updated successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/crosswalks"] });
      setIsEditorOpen(false);
      setSelectedCrosswalk(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update crosswalk: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete crosswalk mutation
  const deleteCrosswalkMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/crosswalks/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete crosswalk");
      }
      
      return true; // Return a simple success flag
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Crosswalk mapping deleted successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/crosswalks"] });
      setIsDeleteDialogOpen(false);
      setDeletingCrosswalkId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete crosswalk: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle creating a new crosswalk
  const handleCreateCrosswalk = () => {
    setSelectedCrosswalk(null);
    setIsEditorOpen(true);
  };

  // Handle editing an existing crosswalk
  const handleEdit = (crosswalk: CrosswalkMapping) => {
    setSelectedCrosswalk(crosswalk);
    setIsEditorOpen(true);
  };

  // Handle deleting a crosswalk
  const handleDelete = (id: number) => {
    setDeletingCrosswalkId(id);
    setIsDeleteDialogOpen(true);
  };

  // Handle confirming delete
  const handleConfirmDelete = () => {
    if (deletingCrosswalkId !== null) {
      deleteCrosswalkMutation.mutate(deletingCrosswalkId);
    }
  };

  // Save crosswalk data (create or update)
  const handleSaveCrosswalk = async (data: CrosswalkFormData & { mappings: MappingItem[] }) => {
    if (selectedCrosswalk) {
      // Update existing crosswalk
      await updateCrosswalkMutation.mutateAsync({
        ...data,
        id: selectedCrosswalk.id,
      });
    } else {
      // Create new crosswalk
      await createCrosswalkMutation.mutateAsync(data);
    }
  };

  // Filter crosswalks based on search query
  const filteredCrosswalks = crosswalks.filter(
    (crosswalk) =>
      crosswalk.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crosswalk.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Crosswalk Mappings</h1>
        <Button onClick={handleCreateCrosswalk}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Crosswalk
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Crosswalks</CardTitle>
          <CardDescription>
            Create and manage mappings between different reference data sets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and filters */}
          <div className="mb-4">
            <Label htmlFor="search" className="mb-2 block">
              Search
            </Label>
            <Input
              id="search"
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Crosswalks table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Source System</TableHead>
                  <TableHead>Target System</TableHead>
                  <TableHead>Mappings</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingCrosswalks ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Loading crosswalks...
                    </TableCell>
                  </TableRow>
                ) : filteredCrosswalks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No crosswalks found.
                      {searchQuery && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Try adjusting your search query.
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCrosswalks.map((crosswalk: CrosswalkMapping) => (
                    <TableRow key={crosswalk.id}>
                      <TableCell className="font-medium">{crosswalk.name}</TableCell>
                      <TableCell>{crosswalk.description}</TableCell>
                      <TableCell>
                        {dataSets?.find((ds: DataSet) => ds.id === crosswalk.sourceSystemId)?.name || 
                          "Unknown"}
                      </TableCell>
                      <TableCell>
                        {dataSets?.find((ds: DataSet) => ds.id === crosswalk.targetSystemId)?.name || 
                          "Unknown"}
                      </TableCell>
                      <TableCell>
                        {crosswalk.mappingData?.mappings?.length || 0} mappings
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(crosswalk)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(crosswalk.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Crosswalk Editor Dialog */}
      {isEditorOpen && (
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedCrosswalk ? "Edit Crosswalk Mapping" : "Create New Crosswalk Mapping"}
              </DialogTitle>
              <DialogDescription>
                {selectedCrosswalk
                  ? "Update the details of this crosswalk mapping"
                  : "Define a new mapping between reference data systems"}
              </DialogDescription>
            </DialogHeader>

            {dataSets && (
              <CrosswalkEditor
                isEditMode={!!selectedCrosswalk}
                initialData={
                  selectedCrosswalk
                    ? {
                        id: selectedCrosswalk.id,
                        name: selectedCrosswalk.name,
                        description: selectedCrosswalk.description,
                        sourceSystemId: selectedCrosswalk.sourceSystemId,
                        targetSystemId: selectedCrosswalk.targetSystemId,
                        sourceAttribute: selectedCrosswalk.mappingData.sourceAttribute,
                        targetAttribute: selectedCrosswalk.mappingData.targetAttribute,
                        mappings: selectedCrosswalk.mappingData.mappings.map((m) => ({
                          sourceValue: m.sourceValue,
                          targetValue: m.targetValue,
                          confidence: m.confidence,
                          id: `${m.sourceValue}-${m.targetValue}`,
                        })),
                      }
                    : undefined
                }
                dataSets={dataSets}
                onSave={handleSaveCrosswalk}
                onCancel={() => setIsEditorOpen(false)}
                isLoading={
                  createCrosswalkMutation.isPending || updateCrosswalkMutation.isPending
                }
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this crosswalk mapping? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteCrosswalkMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteCrosswalkMutation.isPending}
            >
              {deleteCrosswalkMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}