import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, History, FileText, CheckSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useState } from "react";

interface PendingApproval {
  dataSetId: number;
  dataSetName: string;
  instanceId: string;
  instanceName: string;
  data: Record<string, any>;
  history: Array<{
    timestamp: string;
    changes: Array<{
      field: string;
      oldValue: string;
      newValue: string;
    }>;
  }>;
}

interface PendingRelationshipValue {
  id: number;
  relationshipId: number;
  relationshipName: string;
  sourceInstanceId: string;
  targetInstanceId: string;
  sourceDataSet: {
    id: number;
    name: string;
    data: Record<string, any>;
  };
  targetDataSet: {
    id: number;
    name: string;
    data: Record<string, any>;
  };
  history: Array<{
    timestamp: string;
    changes: Array<{
      field: string;
      oldValue: string;
      newValue: string;
    }>;
  }>;
}

export default function ApprovalsDashboard() {
  const { toast } = useToast();
  const [selectedInstance, setSelectedInstance] = useState<PendingApproval | null>(null);
  const [selectedRelationshipValue, setSelectedRelationshipValue] = useState<PendingRelationshipValue | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedInstances, setSelectedInstances] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("dataset-instances");

  // Fetch pending dataset instances
  const { 
    data: pendingDatasetInstances = [], 
    isLoading: isLoadingDatasets,
    error: datasetsError 
  } = useQuery<PendingApproval[]>({
    queryKey: ["/api/approvals/pending"],
  });

  // Fetch pending relationship values
  const { 
    data: pendingRelationshipValues = [], 
    isLoading: isLoadingRelationships,
    error: relationshipsError 
  } = useQuery<PendingRelationshipValue[]>({
    queryKey: ["/api/approvals/relationship-values/pending"],
  });

  // Dataset instance approval mutations
  const approveMutation = useMutation({
    mutationFn: async (approval: PendingApproval) => {
      const response = await apiRequest(`/api/reference-data/${approval.dataSetId}/instances/${approval.instanceId}/approve`, {
        method: "POST"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      toast({
        title: "Approved",
        description: "The instance has been approved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve the instance",
        variant: "destructive",
      });
    },
  });

  // Relationship value approval mutations
  const approveRelationshipMutation = useMutation({
    mutationFn: async (value: PendingRelationshipValue) => {
      const response = await apiRequest(`/api/relationships/${value.relationshipId}/values/${value.id}/approve`, {
        method: "POST"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/relationship-values/pending"] });
      toast({
        title: "Approved",
        description: "The relationship value has been approved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve the relationship value",
        variant: "destructive",
      });
    },
  });

  // Rejection mutation for relationship values
  const rejectRelationshipMutation = useMutation({
    mutationFn: async (value: PendingRelationshipValue) => {
      const response = await apiRequest(`/api/relationships/${value.relationshipId}/values/${value.id}/reject`, {
        method: "POST"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/relationship-values/pending"] });
      toast({
        title: "Rejected",
        description: "The relationship value has been rejected successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject the relationship value",
        variant: "destructive",
      });
    },
  });


  // Bulk approval mutations
  const bulkApproveDatasetsMutation = useMutation({
    mutationFn: async (approvals: PendingApproval[]) => {
      const results = [];
      for (const approval of approvals) {
        const response = await apiRequest(`/api/reference-data/${approval.dataSetId}/instances/${approval.instanceId}/approve`, {
          method: "POST"
        });
        results.push(await response.json());
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      toast({
        title: "Bulk Approval Success",
        description: "Selected instances have been approved successfully.",
      });
      setSelectedInstances(new Set());
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve selected instances",
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = pendingDatasetInstances.map(item => `${item.dataSetId}-${item.instanceId}`);
      setSelectedInstances(new Set(allIds));
    } else {
      setSelectedInstances(new Set());
    }
  };

  const handleSelectInstance = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedInstances);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedInstances(newSelected);
  };

  const handleBulkApprove = () => {
    if (selectedInstances.size === 0) {
      toast({
        title: "No Selections",
        description: "Please select instances to approve",
        variant: "destructive",
      });
      return;
    }

    const selectedApprovals = pendingDatasetInstances.filter(
      item => selectedInstances.has(`${item.dataSetId}-${item.instanceId}`)
    );

    bulkApproveDatasetsMutation.mutate(selectedApprovals);
  };

  if (isLoadingDatasets || isLoadingRelationships) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (datasetsError || relationshipsError) {
    return (
      <MainLayout>
        <div className="text-center py-8 text-destructive">
          Error loading approvals: {(datasetsError || relationshipsError) instanceof Error ? 
            (datasetsError || relationshipsError).message : 'Unknown error'}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="dataset-instances">
                  Dataset Instances ({pendingDatasetInstances.length})
                </TabsTrigger>
                <TabsTrigger value="relationship-values">
                  Relationship Values ({pendingRelationshipValues.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dataset-instances">
                {pendingDatasetInstances.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending dataset instance approvals
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button
                        onClick={handleBulkApprove}
                        disabled={selectedInstances.size === 0 || bulkApproveDatasetsMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {bulkApproveDatasetsMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckSquare className="h-4 w-4 mr-2" />
                        )}
                        Approve Selected ({selectedInstances.size})
                      </Button>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={selectedInstances.size === pendingDatasetInstances.length}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead>Dataset</TableHead>
                          <TableHead>Instance Name</TableHead>
                          <TableHead>Instance ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Changes</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingDatasetInstances.map((item) => (
                          <TableRow key={`${item.dataSetId}-${item.instanceId}`}>
                            <TableCell>
                              <Checkbox
                                checked={selectedInstances.has(`${item.dataSetId}-${item.instanceId}`)}
                                onCheckedChange={(checked) => 
                                  handleSelectInstance(`${item.dataSetId}-${item.instanceId}`, checked)
                                }
                              />
                            </TableCell>
                            <TableCell>{item.dataSetName}</TableCell>
                            <TableCell>{item.instanceName}</TableCell>
                            <TableCell>
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <Button variant="link" className="p-0">
                                    <FileText className="h-4 w-4 mr-2" />
                                    {item.instanceId}
                                  </Button>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-96">
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="text-sm font-semibold mb-1">Instance Details</h4>
                                      <p className="text-xs text-muted-foreground">
                                        Dataset: {item.dataSetName}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Name: {item.instanceName}
                                      </p>
                                    </div>
                                    <div className="border rounded-lg p-3 bg-muted/50">
                                      <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(item.data)
                                          .filter(([key]) => !['_history', 'status', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(key))
                                          .map(([key, value]) => (
                                            <div key={key} className="contents">
                                              <span className="text-sm font-medium">{key}:</span>
                                              <span className="text-sm truncate">{String(value)}</span>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">Pending Approval</Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedInstance(item);
                                  setHistoryDialogOpen(true);
                                }}
                              >
                                <History className="h-4 w-4 mr-2" />
                                View History
                              </Button>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => approveMutation.mutate(item)}
                                disabled={approveMutation.isPending}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => rejectMutation.mutate({
                                  dataSetId: item.dataSetId,
                                  instanceId: item.instanceId,
                                })}
                                disabled={rejectMutation.isPending}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="relationship-values">
                {isLoadingRelationships ? (
                  <div className="space-y-3">
                    <div className="h-8 bg-muted animate-pulse rounded" />
                    <div className="h-20 bg-muted animate-pulse rounded" />
                    <div className="h-20 bg-muted animate-pulse rounded" />
                    <div className="h-20 bg-muted animate-pulse rounded" />
                  </div>
                ) : pendingRelationshipValues.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending relationship value approvals
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Relationship</TableHead>
                        <TableHead>Source Instance</TableHead>
                        <TableHead>Target Instance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Changes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRelationshipValues.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.relationshipName}</TableCell>
                          <TableCell>
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <Button variant="link" className="p-0">
                                  <FileText className="h-4 w-4 mr-2" />
                                  {item.sourceInstanceId}
                                </Button>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-96">
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="text-sm font-semibold mb-1">Source Instance Details</h4>
                                    <p className="text-xs text-muted-foreground">
                                      Dataset: {item.sourceDataSet.name}
                                    </p>
                                  </div>
                                  <div className="border rounded-lg p-3 bg-muted/50">
                                    <div className="grid grid-cols-2 gap-3">
                                      {Object.entries(item.sourceDataSet.data[item.sourceInstanceId] || {})
                                        .filter(([key]) => !['_history', 'status', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(key))
                                        .map(([key, value]) => (
                                          <div key={key} className="contents">
                                            <span className="text-sm font-medium">{key}:</span>
                                            <span className="text-sm truncate">{String(value)}</span>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          </TableCell>
                          <TableCell>
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <Button variant="link" className="p-0">
                                  <FileText className="h-4 w-4 mr-2" />
                                  {item.targetInstanceId}
                                </Button>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-96">
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="text-sm font-semibold mb-1">Target Instance Details</h4>
                                    <p className="text-xs text-muted-foreground">
                                      Dataset: {item.targetDataSet.name}
                                    </p>
                                  </div>
                                  <div className="border rounded-lg p-3 bg-muted/50">
                                    <div className="grid grid-cols-2 gap-3">
                                      {Object.entries(item.targetDataSet.data[item.targetInstanceId] || {})
                                        .filter(([key]) => !['_history', 'status', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(key))
                                        .map(([key, value]) => (
                                          <div key={key} className="contents">
                                            <span className="text-sm font-medium">{key}:</span>
                                            <span className="text-sm truncate">{String(value)}</span>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">Pending Approval</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRelationshipValue(item);
                                setHistoryDialogOpen(true);
                              }}
                            >
                              <History className="h-4 w-4 mr-2" />
                              View History
                            </Button>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => approveRelationshipMutation.mutate(item)}
                              disabled={approveRelationshipMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => rejectRelationshipMutation.mutate(item)}
                              disabled={rejectRelationshipMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change History</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {(selectedInstance?.history || selectedRelationshipValue?.history || []).map((entry, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                  <div className="space-y-2">
                    {entry.changes.map((change, changeIndex) => (
                      <div key={changeIndex} className="text-sm">
                        <span className="font-medium">{change.field}:</span>{" "}
                        <span className="text-destructive">{change.oldValue}</span>{" "}
                        <span className="text-muted-foreground">→</span>{" "}
                        <span className="text-primary">{change.newValue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}