import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, History, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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

interface DebugInfo {
  actions: string[];
  error?: string;
  apiResponse: any;
  rawResponse: string | null;
  requestDetails: any;
  sessionValid: boolean | null;
  user: string | null;
  authStatus?: { isAuthenticated: boolean; status: number; statusText: string };
  beforeApproval?: {
    instanceData: any;
    statusBefore?: string;
    datasetId: number;
    instanceId: string;
  };
  afterApproval?: {
    instanceData: any;
    statusAfter?: string;
    datasetId: number;
    instanceId: string;
    time?: string;
  };
  responseStatus?: { ok: boolean; status: number; statusText: string };
  serverPayload?: {
    instanceId: string;
    oldStatus: string;
    newStatus: string;
    timestamp: string;
  };
}

export default function ApprovalsDashboard() {
  const { toast } = useToast();
  const [selectedInstance, setSelectedInstance] = useState<PendingApproval | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({ actions: [], error: null, apiResponse: null, rawResponse: null, requestDetails: null, sessionValid: null, user: null });

  // Add debug logging to the query
  const { data: pendingApprovals, isLoading, error } = useQuery<PendingApproval[]>({
    queryKey: ["/api/approvals/pending"],
    onSuccess: (data) => {
      console.log("Received pending approvals data:", data);
    },
    onError: (err) => {
      console.error("Error fetching pending approvals:", err);
      setDebugInfo(prev => ({...prev, error: err instanceof Error ? err.message : String(err)}))
    }
  });

  // Mutation for handling approvals
  const approveMutation = useMutation({
    mutationFn: async (approval: PendingApproval) => {
      const url = `/api/reference-data/${approval.dataSetId}/instances/${approval.instanceId}/approve`;
      console.log(`Approving instance ${approval.instanceId} in dataset ${approval.dataSetId}`);

      try {
        // Fetch the dataset to get the current state before approval
        const beforeDataResponse = await fetch(`/api/reference-data/${approval.dataSetId}`, {
          method: 'GET',
          credentials: 'include'
        });

        let beforeData;
        if (beforeDataResponse.ok) {
          beforeData = await beforeDataResponse.json();
        }

        // First, check if we're authenticated by using a status check
        const authCheckResponse = await fetch('/api/status', {
          method: 'GET',
          credentials: 'include'
        });

        const authStatus = {
          isAuthenticated: authCheckResponse.ok,
          status: authCheckResponse.status,
          statusText: authCheckResponse.statusText
        };


        const response = await fetch(url, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include' // Ensure credentials are included
        });

        let responseData;
        let responseText = '';

        try {
          // Try to get response as text first
          responseText = await response.text();

          // Then try to parse as JSON if possible
          try {
            responseData = JSON.parse(responseText);
          } catch (parseError) {
            // If it's not valid JSON, keep as text
            responseData = null;
          }
        } catch (textError) {
          responseText = 'Failed to read response body';
        }


        let afterData;
        if (response.ok) {
          const afterDataResponse = await fetch(`/api/reference-data/${approval.dataSetId}`, {
            method: 'GET',
            credentials: 'include'
          });

          if (afterDataResponse.ok) {
            afterData = await afterDataResponse.json();
          }
        }

        // Get updated instance state
        const updatedInstanceState = afterData?.data?.[approval.instanceId] || null;

        if (!response.ok) {
          throw new Error(`Error approving instance: ${response.statusText}`);
        }

        return responseData;
      } catch (error) {
        console.log('Approval error:', error);
        setDebugInfo(prev => ({ 
          ...prev, 
          error: error.message || String(error)
        }));
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      toast({
        title: "Approved",
        description: "The instance has been approved successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Approval error:", error);
      setDebugInfo(prev => ({
        ...prev,
        error: error.message,
        actions: [...prev.actions, `${new Date().toISOString()} - Error approving instance: ${error.message}`]
      }));
      toast({
        title: "Error",
        description: error.message || "Failed to approve the instance",
        variant: "destructive",
      });
    },
  });

  // Mutation for handling rejections
  const rejectMutation = useMutation({
    mutationFn: async ({ dataSetId, instanceId }: { dataSetId: number; instanceId: string }) => {
      console.log(`Rejecting instance ${instanceId} in dataset ${dataSetId}`);
      setDebugInfo(prev => ({
        ...prev,
        actions: [...prev.actions, `${new Date().toISOString()} - Rejecting instance ${instanceId} in dataset ${dataSetId}`]
      }));
      const response = await apiRequest(`reference-data/${dataSetId}/instances/${instanceId}/reject`, {
        method: "POST",
      });
      const responseData = await response.json();
      setDebugInfo(prev => ({
        ...prev,
        actions: [...prev.actions, `${new Date().toISOString()} - Rejection API response: ${JSON.stringify(responseData)}`]
      }));
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      toast({
        title: "Rejected",
        description: "The instance has been rejected.",
      });
    },
    onError: (error: Error) => {
      console.error("Rejection error:", error);
      setDebugInfo(prev => ({
        ...prev,
        error: error.message,
        actions: [...prev.actions, `${new Date().toISOString()} - Error rejecting instance: ${error.message}`]
      }));
      toast({
        title: "Error",
        description: error.message || "Failed to reject the instance",
        variant: "destructive",
      });
    },
  });

  // Helper function to format instance data for display
  const formatInstanceData = (data: Record<string, any>) => {
    // Filter out internal fields and format for display
    const displayData = Object.entries(data).filter(([key]) => 
      !['_history', 'status', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(key)
    );
    return displayData;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-center py-8 text-destructive">
          Error loading approvals: {error instanceof Error ? error.message : 'Unknown error'}
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
            {pendingApprovals?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending approvals
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dataset</TableHead>
                    <TableHead>Instance Name</TableHead>
                    <TableHead>Instance ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals?.map((item) => (
                    <TableRow key={`${item.dataSetId}-${item.instanceId}`}>
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
                                  {formatInstanceData(item.data).map(([key, value]) => (
                                    <div key={key} className="contents">
                                      <span className="text-sm font-medium">{key}:</span>
                                      <span className="text-sm truncate">{String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Last modified: {new Date(item.data.lastModifiedAt).toLocaleString()} by {item.data.lastModifiedBy}
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
            )}
          </CardContent>
        </Card>

        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change History</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedInstance?.history.map((entry, index) => (
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