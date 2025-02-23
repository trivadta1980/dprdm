import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
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
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function CrosswalksListPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMappingId, setSelectedMappingId] = useState<number | null>(null);

  const { data: crosswalks = [], isLoading } = useQuery<CrosswalkMapping[]>({
    queryKey: ['/api/crosswalks'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/crosswalks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete mapping');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crosswalks'] });
      toast({
        title: "Success",
        description: "Crosswalk mapping deleted successfully",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    setSelectedMappingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedMappingId) {
      deleteMutation.mutate(selectedMappingId);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Crosswalk Mappings</h1>
          <Button onClick={() => navigate("/crosswalks/create")} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Create New Crosswalk
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : crosswalks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No crosswalk mappings found.</p>
                <p className="mt-2">Create your first mapping to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Source Attribute</TableHead>
                    <TableHead>Target Attribute</TableHead>
                    <TableHead>Mappings Count</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crosswalks.map((mapping) => (
                    <TableRow key={mapping.id}>
                      <TableCell className="font-medium">{mapping.name}</TableCell>
                      <TableCell>{mapping.description}</TableCell>
                      <TableCell>{mapping.mappingData.sourceAttribute}</TableCell>
                      <TableCell>{mapping.mappingData.targetAttribute}</TableCell>
                      <TableCell>{mapping.mappingData.mappings.length}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/crosswalks/${mapping.id}/edit`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(mapping.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/crosswalks/${mapping.id}`)}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                crosswalk mapping and all its associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
