import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, GitFork, Trash2, Upload, FileDown, Info, Pencil, ChevronDown } from "lucide-react";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  Relationship,
  ReferenceDataSet,
  RelationshipValue,
  RelationshipAttributeDefinition,
  RelationshipAttributeValue,
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
  const [selectedValueId, setSelectedValueId] = useState<number | null>(null);
  const [columnMapping, setColumnMapping] = useState<{
    sourceInstanceId?: string;
    targetInstanceId?: string;
    attributes: Record<number, string>;
  }>({
    attributes: {},
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<RelationshipValue | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isBulkSubmitDialogOpen, setIsBulkSubmitDialogOpen] = useState(false);

  // Fetch relationship details and data
  const { data: relationship } = useQuery<Relationship>({
    queryKey: [`/api/relationships/${id}`],
    enabled: !!id,
  });

  // Fetch relationship values
  const { data: values = [] } = useQuery<RelationshipValue[]>({
    queryKey: [`/api/relationships/${id}/values`, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus !== "all") {
        params.append("status", selectedStatus);
      }
      const response = await fetch(`/api/relationships/${id}/values?${params}`);
      if (!response.ok) throw new Error("Failed to fetch values");
      return response.json();
    },
    enabled: !!id,
  });

  const { data: sourceDataSet } = useQuery<ReferenceDataSet>({
    queryKey: [`/api/reference-data/${relationship?.sourceDataSetId}`],
    enabled: !!relationship?.sourceDataSetId,
  });

  const { data: targetDataSet } = useQuery<ReferenceDataSet>({
    queryKey: [`/api/reference-data/${relationship?.targetDataSetId}`],
    enabled: !!relationship?.targetDataSetId,
  });

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

  const { data: attributeDefinitions = [] } = useQuery<RelationshipAttributeDefinition[]>({
    queryKey: [`/api/relationships/${id}/attribute-definitions`],
    enabled: !!id,
  });

  const { data: attributeValues = [] } = useQuery<RelationshipAttributeValue[]>({
    queryKey: [`/api/relationships/${id}/values/${selectedValueId}/attributes`],
    enabled: !!selectedValueId,
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const headers = text.split('\n')[0].split(',').map(h => h.trim());
      setCsvHeaders(headers);
    };
    reader.readAsText(file);
  };

  const handleMappingChange = (field: string, value: string | null) => {
    if (!value) return;

    if (field.startsWith('attribute_')) {
      const attributeId = Number(field.replace('attribute_', ''));
      setColumnMapping(prev => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          [attributeId]: value === 'none' ? undefined : value,
        },
      }));
    } else {
      setColumnMapping(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

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

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSource || !selectedTarget) return;

      const response = await apiRequest(`/api/relationships/${id}/values`, {
        method: "POST",
        data: {
          relationshipId: Number(id),
          sourceInstanceId: selectedSource,
          targetInstanceId: selectedTarget,
        }
      });
      return response.json();
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

  const deleteMutation = useMutation({
    mutationFn: async (valueId: number) => {
      await apiRequest(`/api/relationships/${id}/values/${valueId}`, {
        method: "DELETE"
      });
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

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [valueToDelete, setValueToDelete] = useState<number | null>(null);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/relationships/${id}/values`, {
        method: "DELETE"
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/relationships/${id}/values`] });
      toast({
        title: "Success",
        description: data?.message || "All relationship values deleted successfully",
      });
      setDeleteAllDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete relationship values",
        variant: "destructive",
      });
    },
  });

  const submitForApprovalMutation = useMutation({
    mutationFn: async (valueId: number) => {
      const response = await apiRequest(`/api/relationships/${id}/values/${valueId}/submit`, {
        method: "POST"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/relationships/${id}/values`] });
      toast({
        title: "Success",
        description: "Relationship value submitted for approval",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit relationship value for approval",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (valueId: number) => {
      const response = await apiRequest(`/api/relationships/${id}/values/${valueId}/approve`, {
        method: "POST"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/relationships/${id}/values`] });
      toast({
        title: "Success",
        description: "Relationship value approved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve relationship value",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (valueId: number) => {
      const response = await apiRequest(`/api/relationships/${id}/values/${valueId}/reject`, {
        method: "POST"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/relationships/${id}/values`] });
      toast({
        title: "Success",
        description: "Relationship value rejected",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject relationship value",
        variant: "destructive",
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: async (data: { valueId: number; sourceInstanceId: string; targetInstanceId: string }) => {
      const response = await apiRequest(`/api/relationships/${id}/values/${data.valueId}`, {
        method: "PATCH",
        data: {
          sourceInstanceId: data.sourceInstanceId,
          targetInstanceId: data.targetInstanceId,
        }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/relationships/${id}/values`] });
      setIsEditDialogOpen(false);
      setEditingValue(null);
      toast({
        title: "Success",
        description: "Relationship value updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update relationship value",
        variant: "destructive",
      });
    },
  });

  const bulkSubmitMutation = useMutation({
    mutationFn: async (valueIds: number[]) => {
      const response = await apiRequest(`/api/relationships/${id}/values/bulk-submit`, {
        method: "POST",
        data: { valueIds }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/relationships/${id}/values`] });
      setSelectedItems(new Set());
      setIsBulkSubmitDialogOpen(false);
      toast({
        title: "Success",
        description: `Successfully submitted ${selectedItems.size} items for approval`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit items for approval",
        variant: "destructive",
      });
    },
  });


  function handleDelete(valueId: number) {
    setValueToDelete(valueId);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (valueToDelete) {
      deleteMutation.mutate(valueToDelete);
      setDeleteDialogOpen(false);
      setValueToDelete(null);
    }
  }

  function confirmDeleteAll() {
    deleteAllMutation.mutate();
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

  if (!relationship || !sourceDataSet || !targetDataSet || !attributeDefinitions) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const draftValues = values.filter(v => v.approvalStatus === "DRAFT");
      setSelectedItems(new Set(draftValues.map(v => v.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const toggleItemSelection = (valueId: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(valueId)) {
      newSelected.delete(valueId);
    } else {
      newSelected.add(valueId);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkSubmit = () => {
    if (selectedItems.size === 0) return;
    bulkSubmitMutation.mutate(Array.from(selectedItems));
  };


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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={selectedItems.size === 0}
                  >
                    Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => setIsBulkSubmitDialogOpen(true)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Selected for Approval
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" onClick={() => {
                const headers = ['source_instance_id', 'target_instance_id'];

                if (attributeDefinitions) {
                  attributeDefinitions.forEach(attr => {
                    headers.push(`attribute_${attr.name.toLowerCase().replace(/\s+/g, '_')}`);
                  });
                }

                const csvContent = headers.join(',');
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${relationship?.name || 'relationship'}_template.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
              }}>
                <FileDown className="h-4 w-4 mr-2" />
                Export Template
              </Button>

              <Dialog
                open={deleteAllDialogOpen}
                onOpenChange={setDeleteAllDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All Values
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete All Relationship Values</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete all relationship values?
                      This will also delete all associated attribute values.
                      This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteAllDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={confirmDeleteAll}
                      disabled={deleteAllMutation.isPending}
                    >
                      {deleteAllMutation.isPending ? "Deleting..." : "Delete All"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Import Relationship Values</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto pr-2">
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
                                      value={columnMapping.attributes[attr.id] || 'none'}
                                      onValueChange={(value) => handleMappingChange(`attribute_${attr.id}`, value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select column (optional)" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">No mapping</SelectItem>
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
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end pt-4 mt-4 border-t">
                    <Button
                      onClick={() => importMutation.mutate()}
                      disabled={!columnMapping.sourceInstanceId || !columnMapping.targetInstanceId}
                    >
                      Import Values
                    </Button>
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
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PENDING">Pending Approval</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {values.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={values.filter(v => v.approvalStatus === "DRAFT").length > 0 &&
                            values.filter(v => v.approvalStatus === "DRAFT").every(v => selectedItems.has(v.id))}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Source Instance</TableHead>
                      <TableHead>Target Instance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {values.map((value) => (
                      <TableRow key={value.id}>
                        <TableCell>
                          {value.approvalStatus === "DRAFT" && (
                            <Checkbox
                              checked={selectedItems.has(value.id)}
                              onCheckedChange={() => toggleItemSelection(value.id)}
                            />
                          )}
                        </TableCell>
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
                        <TableCell>
                          <Badge
                            variant={
                              value.approvalStatus === "APPROVED"
                                ? "success"
                                : value.approvalStatus === "REJECTED"
                                ? "destructive"
                                : value.approvalStatus === "PENDING"
                                ? "warning"
                                : "secondary"
                            }
                          >
                            {value.approvalStatus || "DRAFT"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {value.approvalStatus !== "PENDING" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingValue(value);
                                setIsEditDialogOpen(true);
                              }}
                              className="hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                          {value.approvalStatus === "DRAFT" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => submitForApprovalMutation.mutate(value.id)}
                              disabled={submitForApprovalMutation.isPending}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Submit for Approval
                            </Button>
                          )}
                          <Dialog onOpenChange={(open) => {
                            if (open) {
                              setSelectedValueId(value.id);
                            } else {
                              setSelectedValueId(null);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-blue-50"
                              >
                                <Info className="h-4 w-4 text-blue-600" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Attribute Values</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h3 className="text-sm font-medium mb-2">Relationship Details</h3>
                                  <div className="space-y-2">
                                    <p>
                                      <span className="font-medium">Source:</span>{" "}
                                      {getInstanceDisplayValue(
                                        value.sourceInstanceId,
                                        sourceDataSet,
                                        relationship?.sourceField
                                      )}
                                    </p>
                                    <p>
                                      <span className="font-medium">Target:</span>{" "}
                                      {getInstanceDisplayValue(
                                        value.targetInstanceId,
                                        targetDataSet,
                                        relationship?.targetField
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-sm font-medium mb-2">Attributes</h3>
                                  {attributeValues.length > 0 ? (
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Attribute</TableHead>
                                          <TableHead>Value</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {attributeValues.map((attrValue) => {
                                          const definition = attributeDefinitions.find(
                                            (def) => def.id === attrValue.attributeDefinitionId
                                          );
                                          return (
                                            <TableRow key={attrValue.id}>
                                              <TableCell>{definition?.name || 'Unknown'}</TableCell>
                                              <TableCell>{attrValue.value}</TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  ) : (
                                    <p className="text-gray-500">No attribute values defined.</p>
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(value.id)}
                            className="hover:bg-red-50"
                            disabled={value.approvalStatus !== "DRAFT"}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No relationship values found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Relationship Value</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this relationship value?
                This will also delete all associated attribute values.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEditingValue(null);            }
            setIsEditDialogOpen(open);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Relationship Value</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Source Instance</label>
                <Select
                  value={editingValue?.sourceInstanceId || ""}
                  onValueChange={(value) => setEditingValue(prev => prev ? { ...prev, sourceInstanceId: value } : null)}
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
                  value={editingValue?.targetInstanceId || ""}
                  onValueChange={(value) => setEditingValue(prev => prev ? { ...prev, targetInstanceId: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target instance" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetDataSet && Object.entries(targetDataSet.data).map(([id, data]) => (
                      <SelectItem key={id} value={id}>
                        {getInstanceDisplayValue(id, targetDataSet, relationship?.targetField)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (editingValue) {
                    editMutation.mutate({
                      valueId: editingValue.id,
                      sourceInstanceId: editingValue.sourceInstanceId,
                      targetInstanceId: editingValue.targetInstanceId,
                    });
                  }
                }}
                disabled={!editingValue || editMutation.isPending}
              >
                {editMutation.isPending ? "Updating..." : "Update Relationship Value"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={isBulkSubmitDialogOpen} onOpenChange={setIsBulkSubmitDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Items for Approval</DialogTitle>
              <DialogDescription>
                Are you sure you want to submit {selectedItems.size} items for approval?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsBulkSubmitDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkSubmit}
                disabled={bulkSubmitMutation.isPending}
              >
                {bulkSubmitMutation.isPending
                  ? "Submitting..."
                  : `Submit ${selectedItems.size} Items`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}