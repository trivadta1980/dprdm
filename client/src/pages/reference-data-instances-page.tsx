import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import type { ReferenceDataSet, ReferenceDataInstance } from "@shared/schema";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface Params {
  id: string;
}

export default function ReferenceDataInstancesPage({ params }: { params: Params }) {
  const [_, setLocation] = useLocation();
  const dataSetId = Number(params.id);

  // Add debug logging for initialization
  useEffect(() => {
    console.log('Component initialized with params:', {
      rawId: params.id,
      parsedId: dataSetId,
      isValidNumber: !isNaN(dataSetId)
    });
  }, [params.id, dataSetId]);

  // Fetch the reference data set with explicit JSONB data typing
  const { data: dataSet, isLoading, error } = useQuery<ReferenceDataSet>({
    queryKey: ["/api/reference-data", dataSetId],
    enabled: !!dataSetId && !isNaN(dataSetId),
    refetchOnWindowFocus: false,
  });

  // Process instances from the typed data
  const instances = (() => {
    if (!dataSet?.data) {
      console.log('No data available in dataset');
      return [];
    }

    try {
      // Convert the strongly typed data to entries
      const entries = Object.entries(dataSet.data);
      console.log('Processing data entries:', entries);
      return entries;
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
            {/* Debug information panel */}
            <div className="mb-4 p-4 bg-gray-100 rounded">
              <p className="font-medium mb-2">Data Structure:</p>
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify({
                  query: {
                    id: dataSetId,
                    succeeded: !!dataSet,
                  },
                  dataset: dataSet ? {
                    id: dataSet.id,
                    name: dataSet.name,
                    dataType: typeof dataSet.data,
                    hasData: !!dataSet.data,
                    instanceCount: instances.length,
                  } : null,
                  firstInstance: instances[0] ? {
                    key: instances[0][0],
                    data: instances[0][1]
                  } : null
                }, null, 2)}
              </pre>
            </div>

            {instances.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instance ID</TableHead>
                    <TableHead>Fields</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instances.map(([instanceId, instanceData]) => (
                    <TableRow key={instanceId}>
                      <TableCell className="font-medium">{instanceId}</TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {Object.entries(instanceData).map(([field, value]) => (
                            <div key={field} className="flex gap-2">
                              <span className="font-medium">{field}:</span>
                              <span>{value}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
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