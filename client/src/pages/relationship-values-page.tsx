import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, GitFork, Trash2 } from "lucide-react";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  Relationship,
  ReferenceDataSet,
  RelationshipValue,
} from "@shared/schema";

export default function RelationshipValuesPage() {
  // Get the relationship ID from the URL parameters
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  console.log('RelationshipValuesPage mounted with ID:', id); // Debug log

  // Fetch relationship details
  const { data: relationship, isLoading: isLoadingRelationship } = useQuery<Relationship>({
    queryKey: [`/api/relationships/${id}`],
    enabled: !!id,
    onSuccess: (data) => console.log('Relationship data loaded:', data), // Debug log
    onError: (error) => console.error('Error loading relationship:', error), // Debug log
  });

  // Fetch relationship values
  const { data: values = [], isLoading: isLoadingValues } = useQuery<RelationshipValue[]>({
    queryKey: [`/api/relationships/${id}/values`],
    enabled: !!id,
    onSuccess: (data) => console.log('Values loaded:', data), // Debug log
    onError: (error) => console.error('Error loading values:', error), // Debug log
  });

  // Fetch source and target datasets
  const { data: sourceDataSet } = useQuery<ReferenceDataSet>({
    queryKey: [`/api/reference-data/${relationship?.sourceDataSetId}`],
    enabled: !!relationship?.sourceDataSetId,
    onSuccess: (data) => console.log('Source dataset loaded:', data), // Debug log
  });

  const { data: targetDataSet } = useQuery<ReferenceDataSet>({
    queryKey: [`/api/reference-data/${relationship?.targetDataSetId}`],
    enabled: !!relationship?.targetDataSetId,
    onSuccess: (data) => console.log('Target dataset loaded:', data), // Debug log
  });

  // Fetch available targets for selected source
  const { data: availableTargets = [] } = useQuery<Array<{ id: string; [key: string]: any }>>({
    queryKey: [`/api/relationships/${id}/values/available-targets`, selectedSource],
    queryFn: async () => {
      if (!selectedSource) return [];
      const res = await apiRequest(
        "GET",
        `/api/relationships/${id}/values/available-targets?sourceId=${selectedSource}`
      );
      return res.json();
    },
    enabled: !!selectedSource,
  });

  // Create relationship value mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSource || !selectedTarget) return;

      const res = await apiRequest("POST", `/api/relationships/${id}/values`, {
        relationshipId: Number(id),
        sourceInstanceId: selectedSource,
        targetInstanceId: selectedTarget,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/relationships/${id}/values`] });
      setIsDialogOpen(false);
      setSelectedSource(null);
      setSelectedTarget(null);
      toast({
        title: "Success",
        description: "Relationship value created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create relationship value",
        variant: "destructive",
      });
    },
  });

  // Delete relationship value mutation
  const deleteMutation = useMutation({
    mutationFn: async (valueId: number) => {
      await apiRequest("DELETE", `/api/relationships/${id}/values/${valueId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/relationships/${id}/values`] });
      toast({
        title: "Success",
        description: "Relationship value deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete relationship value",
        variant: "destructive",
      });
    },
  });

  function handleDelete(valueId: number) {
    if (window.confirm("Are you sure you want to delete this relationship value?")) {
      deleteMutation.mutate(valueId);
    }
  }

  function getInstanceDisplayValue(
    instanceId: string,
    dataSet?: ReferenceDataSet,
    field?: string
  ): string {
    if (!dataSet || !field) return instanceId;
    const instance = dataSet.data[instanceId];
    return instance && field in instance ? String(instance[field]) : instanceId;
  }

  // Show loading state if any of the required data is still loading
  if (isLoadingRelationship || isLoadingValues) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  // Show error state if relationship is not found
  if (!relationship) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Relationship not found or you don't have permission to view it.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitFork className="h-5 w-5" />
              Relationship Values: {relationship?.name}
            </CardTitle>
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedSource(null);
                  setSelectedTarget(null);
                }
                setIsDialogOpen(open);
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Value
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Relationship Value</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm font-medium">Source Instance</label>
                    <Select
                      value={selectedSource || ""}
                      onValueChange={setSelectedSource}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source instance" />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceDataSet && Object.entries(sourceDataSet.data).map(([id, data]) => (
                          <SelectItem key={id} value={id}>
                            {getInstanceDisplayValue(id, sourceDataSet, relationship?.sourceField)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Target Instance</label>
                    <Select
                      value={selectedTarget || ""}
                      onValueChange={setSelectedTarget}
                      disabled={!selectedSource}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target instance" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTargets.map((target) => (
                          <SelectItem key={target.id} value={target.id}>
                            {getInstanceDisplayValue(
                              target.id,
                              targetDataSet,
                              relationship?.targetField
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => createMutation.mutate()}
                    disabled={!selectedSource || !selectedTarget}
                  >
                    Create Relationship Value
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoadingValues ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : values.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source Instance</TableHead>
                    <TableHead>Target Instance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {values.map((value) => (
                    <TableRow key={value.id}>
                      <TableCell>
                        {getInstanceDisplayValue(
                          value.sourceInstanceId,
                          sourceDataSet,
                          relationship?.sourceField
                        )}
                      </TableCell>
                      <TableCell>
                        {getInstanceDisplayValue(
                          value.targetInstanceId,
                          targetDataSet,
                          relationship?.targetField
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(value.id)}
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
                <p>No relationship values defined yet.</p>
                <p className="text-sm">Click the "New Value" button to create one.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}