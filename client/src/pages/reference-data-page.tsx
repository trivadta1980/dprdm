import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Pencil, Trash2, Database, GitCompare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  ReferenceDataType,
  ReferenceDataSet,
  InsertReferenceDataSet
} from "@shared/schema";
import { useLocation } from "wouter";
import { useState } from "react";

export default function ReferenceDataPage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [dataSetToDelete, setDataSetToDelete] = useState<ReferenceDataSet | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch reference types
  const { data: types = [] } = useQuery<ReferenceDataType[]>({
    queryKey: ["/api/reference-types"],
  });

  // Fetch reference data sets
  const { data: dataSets = [], isLoading } = useQuery<ReferenceDataSet[]>({
    queryKey: ["/api/reference-data"],
  });

  // Fetch dependencies when dialog is shown
  const { data: dependencies, isLoading: loadingDependencies } = useQuery({
    queryKey: [`/api/reference-data/${dataSetToDelete?.id}/dependencies`],
    enabled: !!dataSetToDelete,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/reference-data/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete reference data set');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reference-data"] });
      toast({
        title: "Success",
        description: "Reference Data Set has been deleted.",
      });
      setShowDeleteDialog(false);
      setDataSetToDelete(null);
    },
    onError: (error: Error) => {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete Reference Data Set.",
        variant: "destructive",
      });
      setShowDeleteDialog(false);
      setDataSetToDelete(null);
    },
  });

  function handleEdit(dataSet: ReferenceDataSet) {
    setLocation(`/reference-data/${dataSet.id}/edit`);
  }

  function handleDelete(dataSet: ReferenceDataSet) {
    setDataSetToDelete(dataSet);
    setShowDeleteDialog(true);
  }

  function handleConfirmDelete() {
    console.log('handleConfirmDelete called with dataset:', dataSetToDelete);
    if (dataSetToDelete) {
      deleteMutation.mutate(dataSetToDelete.id);
    }
  }

  function handleCreateNew() {
    setLocation("/reference-data/create");
  }

  function handleManageInstances(dataSet: ReferenceDataSet) {
    setLocation(`/reference-data/${dataSet.id}/instances`);
  }
  
  function handleCompareView(dataSet: ReferenceDataSet) {
    setLocation(`/crosswalk/comparison/${dataSet.id}`);
  }

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
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Reference Data Sets</CardTitle>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              New Data Set
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Instances</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataSets.map((dataSet) => {
                  const type = types.find((t) => t.id === dataSet.typeId);
                  const instanceCount = Object.keys(dataSet.data || {}).length;
                  return (
                    <TableRow key={dataSet.id}>
                      <TableCell>{dataSet.name}</TableCell>
                      <TableCell>{type?.name}</TableCell>
                      <TableCell>{dataSet.description}</TableCell>
                      <TableCell>{instanceCount} records</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageInstances(dataSet)}
                        >
                          <Database className="h-4 w-4 mr-2" />
                          Manage Instances
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompareView(dataSet)}
                        >
                          <GitCompare className="h-4 w-4 mr-2" />
                          Compare Mappings
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(dataSet)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(dataSet)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this reference data set?</AlertDialogTitle>
            <AlertDialogDescription>
              {loadingDependencies ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking dependencies...
                </div>
              ) : dependencies ? (
                <div className="space-y-2">
                  <p>This action cannot be undone.</p>
                  {dependencies.relationships.length > 0 && (
                    <p>⚠️ This dataset is used in {dependencies.relationships.length} relationship(s)</p>
                  )}
                  {dependencies.crosswalks.length > 0 && (
                    <p>⚠️ This dataset is used in {dependencies.crosswalks.length} crosswalk mapping(s)</p>
                  )}
                  {dependencies.canDelete ? (
                    <p>No blocking dependencies found. You can safely delete this dataset.</p>
                  ) : (
                    <p className="text-red-500">
                      This dataset cannot be deleted because it is referenced by other items.
                      Please remove the relationships and crosswalks first.
                    </p>
                  )}
                </div>
              ) : (
                "Failed to check dependencies"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setDataSetToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                console.log('Delete button clicked');
                console.log('Current dataset:', dataSetToDelete);
                console.log('Dependencies:', dependencies);
                handleConfirmDelete();
              }}
              disabled={dependencies && !dependencies.canDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}