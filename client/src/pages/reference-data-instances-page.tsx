import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import type { ReferenceDataSet, ReferenceDataInstance } from "@shared/schema";
import { useLocation } from "wouter";

interface Params {
  id: string;
}

export default function ReferenceDataInstancesPage({ params }: { params: Params }) {
  const [_, setLocation] = useLocation();
  const dataSetId = Number(params.id);

  // Fetch the reference data set with the correct endpoint
  const { data: dataSet, isLoading, error } = useQuery<ReferenceDataSet>({
    queryKey: [`/api/reference-data/${dataSetId}`],
    enabled: !!dataSetId && !isNaN(dataSetId),
    refetchOnWindowFocus: false
  });

  // Get schema fields from the first instance
  const schemaFields = (() => {
    if (!dataSet?.data || Object.keys(dataSet.data).length === 0) {
      return [];
    }
    // Get the first instance
    const firstInstance = Object.values(dataSet.data)[0] as ReferenceDataInstance;
    return Object.keys(firstInstance);
  })();

  // Process instances for tabular display
  const instances = (() => {
    if (!dataSet?.data) {
      return [];
    }

    try {
      return Object.entries(dataSet.data).map(([id, data]) => ({
        id,
        ...data as ReferenceDataInstance
      }));
    } catch (error) {
      console.error('Error processing instance data:', error);
      return [];
    }
  })();

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
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-medium text-red-600">Error loading data</h2>
            <p className="text-sm text-muted-foreground">{String(error)}</p>
            <Button
              variant="ghost"
              onClick={() => setLocation("/reference-data")}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reference Data
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/reference-data")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reference Data
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reference Data Instances - {dataSet?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {instances.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instance ID</TableHead>
                    {schemaFields.map((field) => (
                      <TableHead key={field}>{field}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instances.map((instance) => (
                    <TableRow key={instance.id}>
                      <TableCell className="font-medium">{instance.id}</TableCell>
                      {schemaFields.map((field) => (
                        <TableCell key={field}>{instance[field]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No instances available for this reference data set.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}