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
import { Plus, GitFork, Trash2, Upload } from "lucide-react";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  Relationship,
  ReferenceDataSet,
  RelationshipValue,
  RelationshipAttributeDefinition,
} from "@shared/schema";

export default function RelationshipValuesPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<{
    sourceInstanceId?: string;
    targetInstanceId?: string;
    attributes: Record<number, string>;
  }>({
    attributes: {},
  });

  // Fetch relationship details
  const { data: relationship } = useQuery<Relationship>({
    queryKey: [`/api/relationships/${id}`],
    enabled: !!id,
  });

  // Fetch relationship values
  const { data: values = [] } = useQuery<RelationshipValue[]>({
    queryKey: [`/api/relationships/${id}/values`],
    enabled: !!id,
  });

  // Fetch source and target datasets
  const { data: sourceDataSet } = useQuery<ReferenceDataSet>({
    queryKey: [`/api/reference-data/${relationship?.sourceDataSetId}`],
    enabled: !!relationship?.sourceDataSetId,
  });

  const { data: targetDataSet } = useQuery<ReferenceDataSet>({
    queryKey: [`/api/reference-data/${relationship?.targetDataSetId}`],
    enabled: !!relationship?.targetDataSetId,
  });

  // Fetch available targets for selected source
  const { data: availableTargets = [] } = useQuery<Array<{ id: string; [key: string]: any }>>({
    queryKey: [`/api/relationships/${id}/values/available-targets`, selectedSource],
    queryFn: async () => {
      if (!selectedSource) return [];
      const response = await apiRequest(`/api/relationships/${id}/values/available-targets?sourceId=${selectedSource}`, {
        method: 'GET'
      });
      return response.json();
    },
    enabled: !!selectedSource,
  });


  // Fetch attribute definitions
  const { data: attributeDefinitions = [] } = useQuery<RelationshipAttributeDefinition[]>({
    queryKey: [`/api/relationships/${id}/attribute-definitions`],
    enabled: !!id,
  });

  // Handle CSV file upload
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    // Read CSV headers
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const headers = text.split('\n')[0].split(',').map(h => h.trim());
      setCsvHeaders(headers);
    };
    reader.readAsText(file);
  };

  // Handle column mapping change
  const handleMappingChange = (field: string, value: string) => {
    if (field.startsWith('attribute_')) {
      const attributeId = Number(field.replace('attribute_', ''));
      setColumnMapping(prev => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          [attributeId]: value,
        },
      }));
    } else {
      setColumnMapping(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!csvFile || !columnMapping.sourceInstanceId || !columnMapping.targetInstanceId) {
        throw new Error("Please select mapping for required fields");
      }

      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('mapping', JSON.stringify(columnMapping));

      const response = await fetch(`/api/relationships/${id}/values/import`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/relationships/${id}/values`] });
      setIsImportDialogOpen(false);
      setCsvFile(null);
      setCsvHeaders([]);
      setColumnMapping({ attributes: {} });
      toast({
        title: "Success",
        description: "Relationship values imported successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import relationship values",
        variant: "destructive",
      });
    },
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
  if (!relationship || !sourceDataSet || !targetDataSet || !attributeDefinitions) {
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
            <div className="flex gap-2">
              <Dialog
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Values
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Import Relationship Values</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Upload CSV</label>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                    </div>

                    {csvHeaders.length > 0 && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Source Instance ID Column</label>
                          <Select
                            value={columnMapping.sourceInstanceId}
                            onValueChange={(value) => handleMappingChange('sourceInstanceId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              {csvHeaders.map((header) => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Target Instance ID Column</label>
                          <Select
                            value={columnMapping.targetInstanceId}
                            onValueChange={(value) => handleMappingChange('targetInstanceId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              {csvHeaders.map((header) => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {attributeDefinitions.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium mb-2">Attribute Mappings</h3>
                            <div className="space-y-2">
                              {attributeDefinitions.map((attr) => (
                                <div key={attr.id}>
                                  <label className="text-sm">{attr.name}</label>
                                  <Select
                                    value={columnMapping.attributes[attr.id]}
                                    onValueChange={(value) => handleMappingChange(`attribute_${attr.id}`, value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select column (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">None</SelectItem>
                                      {csvHeaders.map((header) => (
                                        <SelectItem key={header} value={header}>
                                          {header}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <Button
                          className="w-full"
                          onClick={() => importMutation.mutate()}
                          disabled={!columnMapping.sourceInstanceId || !columnMapping.targetInstanceId}
                        >
                          Import Values
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

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
            </div>
          </CardHeader>
          <CardContent>
            {values.length > 0 ? (
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