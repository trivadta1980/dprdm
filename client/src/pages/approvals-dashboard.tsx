import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ReferenceDataSet } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

interface PendingApproval {
  dataSetId: number;
  dataSetName: string;
  instanceId: string;
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

export default function ApprovalsDashboard() {
  const { toast } = useToast();
  const [selectedInstance, setSelectedInstance] = useState<PendingApproval | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  // Add debug logging to the query
  const { data: pendingApprovals, isLoading, error } = useQuery<PendingApproval[]>({
    queryKey: ["/api/approvals/pending"],
    onSuccess: (data) => {
      console.log("Received pending approvals data:", data);
    },
    onError: (err) => {
      console.error("Error fetching pending approvals:", err);
    }
  });

  // Mutation for handling approvals
  const approveMutation = useMutation({
    mutationFn: async ({ dataSetId, instanceId }: { dataSetId: number; instanceId: string }) => {
      const response = await apiRequest(`/api/reference-data/${dataSetId}/instances/${instanceId}/approve`, {
        method: "POST",
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
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for handling rejections
  const rejectMutation = useMutation({
    mutationFn: async ({ dataSetId, instanceId }: { dataSetId: number; instanceId: string }) => {
      const response = await apiRequest(`/api/reference-data/${dataSetId}/instances/${instanceId}/reject`, {
        method: "POST",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      toast({
        title: "Rejected",
        description: "The instance has been rejected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
                      <TableCell>{item.instanceId}</TableCell>
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
                          onClick={() => approveMutation.mutate({
                            dataSetId: item.dataSetId,
                            instanceId: item.instanceId,
                          })}
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