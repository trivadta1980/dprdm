import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Pencil, Trash2, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  ReferenceDataType,
  ReferenceDataSet,
  InsertReferenceDataSet
} from "@shared/schema";
import { useLocation } from "wouter";
import { useState } from "react";

export default function ReferenceDataPage() {
  const { toast } = useToast();
  const [editingDataSet, setEditingDataSet] = useState<ReferenceDataSet | null>(null);
  const [_, setLocation] = useLocation();

  // Fetch reference types
  const { data: types = [] } = useQuery<ReferenceDataType[]>({
    queryKey: ["/api/reference-types"],
  });

  // Fetch reference data sets
  const { data: dataSets = [], isLoading } = useQuery<ReferenceDataSet[]>({
    queryKey: ["/api/reference-data"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reference-data/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reference-data"] });
      toast({
        title: "Success",
        description: "Reference Data Set has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete Reference Data Set.",
        variant: "destructive",
      });
    },
  });

  function handleEdit(dataSet: ReferenceDataSet) {
    setLocation(`/reference-data/${dataSet.id}/edit`);
  }

  function handleDelete(dataSet: ReferenceDataSet) {
    if (window.confirm(`Are you sure you want to delete "${dataSet.name}"?`)) {
      deleteMutation.mutate(dataSet.id);
    }
  }

  function handleCreateNew() {
    setLocation("/reference-data/create");
  }

  function handleManageInstances(dataSet: ReferenceDataSet) {
    console.log('Navigation Debug:', {
      dataSetId: dataSet.id,
      dataSetName: dataSet.name,
      targetUrl: `/reference-data/${dataSet.id}/instances`
    });

    setLocation(`/reference-data/${dataSet.id}/instances`);
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
    </MainLayout>
  );
}