import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import type { ReferenceDataSet } from "@shared/schema";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface Params {
  id: string;
}

export default function ReferenceDataInstancesPage({ params }: { params: Params }) {
  const [_, setLocation] = useLocation();
  const dataSetId = Number(params.id);

  // Add effect to log data loading
  useEffect(() => {
    console.log('=== REFERENCE DATA INSTANCE PAGE MOUNT ===');
    console.log('URL Parameters:', params);
    console.log('Parsed Dataset ID:', dataSetId);
  }, [params, dataSetId]);

  // Add effect to log auth status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user', { credentials: 'include' });
        console.log('Auth check response status:', response.status);
        if (response.ok) {
          const userData = await response.json();
          console.log('User data:', userData);
        } else {
          console.log('Not authenticated');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };
    checkAuth();
  }, []);

  // Fetch the reference data set with logging
  const { data: dataSet, isLoading, error } = useQuery<ReferenceDataSet>({
    queryKey: ["/api/reference-data", dataSetId],
    enabled: !!dataSetId && !isNaN(dataSetId),
  });

  // Add immediate logging after query
  useEffect(() => {
    console.log('=== REFERENCE DATA QUERY UPDATE ===');
    console.log('Query State:', {
      dataSetId,
      hasData: !!dataSet,
      dataSetName: dataSet?.name,
      fullData: dataSet,
      error: error ? String(error) : null
    });
  }, [dataSet, dataSetId, error]);

  // Update the data parsing logic to handle the correct data structure
  const instances = (() => {
    if (!dataSet?.data) {
      console.log('DEBUG: No data in dataset');
      return [];
    }

    try {
      const data = dataSet.data;
      console.log('DEBUG: Raw data content:', data);

      // Check if it's already an object
      if (typeof data === 'object' && data !== null) {
        const entries = Object.entries(data);
        console.log('DEBUG: Parsed entries:', entries);
        return entries;
      }

      // Try parsing if it's a string
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        const entries = Object.entries(parsed);
        console.log('DEBUG: Parsed from string:', entries);
        return entries;
      }

      console.log('DEBUG: Unknown data format:', typeof data);
      return [];
    } catch (error) {
      console.error('DEBUG: Error parsing data:', error);
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
            <CardTitle>Reference Data Instances - {dataSet?.name || 'Loading...'}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Debug information panel */}
            <div className="mb-4 p-4 bg-gray-100 rounded">
              <p className="font-medium mb-2">Debug Information:</p>
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify({
                  pageInfo: {
                    dataSetId,
                    dataSetName: dataSet?.name,
                    hasData: !!dataSet,
                    instanceCount: instances.length,
                  },
                  rawData: dataSet?.data
                }, null, 2)}
              </pre>
            </div>

            {instances.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instance ID</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instances.map(([key, data]) => (
                    <TableRow key={key}>
                      <TableCell>{key}</TableCell>
                      <TableCell>
                        <pre className="text-sm">
                          {JSON.stringify(data, null, 2)}
                        </pre>
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