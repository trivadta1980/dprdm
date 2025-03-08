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

// ... other imports remain the same ...

export default function RelationshipsPage() {
  // ... other state and hooks remain the same ...

  // Add this debug panel component
  const DebugPanel = () => {
    const selectedId = form.watch("sourceDataSetId");
    const { data: debugSourceData } = useQuery<ReferenceDataSet>({
      queryKey: [`/api/reference-data/${selectedId}`],
      enabled: !!selectedId,
    });

    return (
      <div className="mb-4 p-4 bg-muted rounded-lg">
        <h3 className="text-sm font-medium mb-2">Debug Information</h3>
        <div className="space-y-2 text-xs font-mono">
          <div>
            <strong>Selected Dataset ID:</strong> {selectedId || 'none'}
          </div>
          <div>
            <strong>Source Fields:</strong> {sourceFields.join(', ') || 'none'}
          </div>
          <div>
            <strong>Raw API Response:</strong>
            <pre className="mt-1 p-2 bg-background rounded overflow-auto max-h-40">
              {JSON.stringify(debugSourceData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  // ... rest of the component remains the same ...

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEditingRelationship(null);
              form.reset();
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

            <Form {...form}>
              {/* Rest of the form remains the same */}
            </Form>
          </DialogContent>
        </Dialog>

        {/* Rest of the component remains the same */}
      </div>
    </MainLayout>
  );
}
