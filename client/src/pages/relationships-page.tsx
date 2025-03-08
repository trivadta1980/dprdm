import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, GitFork, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Relationship, ReferenceDataSet } from "@shared/schema";

export default function RelationshipsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
  const [selectedSourceDataset, setSelectedSourceDataset] = useState<string | null>(null);
  const [selectedTargetDataset, setSelectedTargetDataset] = useState<string | null>(null);
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [targetFields, setTargetFields] = useState<string[]>([]);
  const { toast } = useToast();

  // Debug panel to show API response data
  const DebugPanel = () => {
    const { data: sourceData } = useQuery<ReferenceDataSet>({
      queryKey: [`/api/reference-data/${selectedSourceDataset}`],
      enabled: !!selectedSourceDataset,
    });

    return (
      <div className="mb-4 p-4 bg-muted rounded-lg">
        <h3 className="text-sm font-medium mb-2">Debug Information</h3>
        <div className="space-y-2 text-xs font-mono">
          <div>
            <strong>Selected Dataset ID:</strong> {selectedSourceDataset || 'none'}
          </div>
          <div>
            <strong>Available Fields:</strong> {sourceFields.join(', ') || 'none'}
          </div>
          <div>
            <strong>Raw API Response:</strong>
            <pre className="mt-1 p-2 bg-background rounded overflow-auto max-h-40">
              {JSON.stringify(sourceData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  // Query for source dataset fields
  useQuery<ReferenceDataSet>({
    queryKey: [`/api/reference-data/${selectedSourceDataset}`],
    enabled: !!selectedSourceDataset,
    onSuccess: (data) => {
      if (!data?.data) {
        console.log("No data in source dataset");
        setSourceFields([]);
        return;
      }

      // Get the first instance to check structure
      const instances = Object.values(data.data);
      if (instances.length === 0) {
        setSourceFields([]);
        return;
      }

      // Extract all unique fields from the first instance
      const firstInstance = instances[0];
      const fields = Object.keys(firstInstance).filter(field => !field.startsWith('_'));
      console.log("Source dataset fields:", fields);
      setSourceFields(fields);
    }
  });

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Relationships</CardTitle>
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  setEditingRelationship(null);
                }
                setIsDialogOpen(open);
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Relationship
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingRelationship ? 'Edit Relationship' : 'Create New Relationship'}
                  </DialogTitle>
                </DialogHeader>

                {/* Add the debug panel here */}
                <DebugPanel />

                {/* Form will be added here */}
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {/* Table content will be added here */}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}