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

  // Log initial mount and params
  useEffect(() => {
    console.log('=== Component Mount ===');
    console.log('Params:', params);
    console.log('Parsed dataSetId:', dataSetId);
  }, [params, dataSetId]);

  // Fetch the reference data set
  const { data: dataSet, isLoading, error } = useQuery<ReferenceDataSet>({
    queryKey: ["/api/reference-data", dataSetId],
    enabled: !!dataSetId && !isNaN(dataSetId),
  });

  // Log raw data from API
  useEffect(() => {
    if (dataSet) {
      console.log('=== Raw Data from API ===');
      console.log('Full dataset:', dataSet);
      console.log('Data column type:', typeof dataSet.data);
      console.log('Raw data content:', dataSet.data);
    }
  }, [dataSet]);

  // Process instances with detailed logging
  const instances = (() => {
    console.log('=== Processing Data ===');

    if (!dataSet?.data) {
      console.log('No data available in dataset');
      return [];
    }

    try {
      // Log the data type we're working with
      console.log('Data type received:', typeof dataSet.data);

      if (typeof dataSet.data === 'string') {
        console.log('Parsing string data...');
        const parsed = JSON.parse(dataSet.data);
        console.log('Parsed result:', parsed);
        const entries = Object.entries(parsed);
        console.log('Entries from string:', entries);
        return entries;
      }

      if (typeof dataSet.data === 'object' && dataSet.data !== null) {
        console.log('Processing object data...');
        const entries = Object.entries(dataSet.data);
        console.log('Entries from object:', entries);
        console.log('Number of instances:', entries.length);
        return entries;
      }

      console.log('Unexpected data format:', typeof dataSet.data);
      return [];
    } catch (error) {
      console.error('Error processing data:', error);
      return [];
    }
  })();

  // Log final processed data
  useEffect(() => {
    console.log('=== Final Data Structure ===');
    console.log('Total instances:', instances.length);
    console.log('Instances array:', instances);
  }, [instances]);

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
            {/* Detailed debug information */}
            <div className="mb-4 p-4 bg-gray-100 rounded">
              <p className="font-medium mb-2">Debug Information:</p>
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify({
                  metadata: {
                    dataSetId,
                    dataSetName: dataSet?.name,
                    hasData: !!dataSet?.data,
                  },
                  dataAnalysis: {
                    dataType: typeof dataSet?.data,
                    isString: typeof dataSet?.data === 'string',
                    isObject: typeof dataSet?.data === 'object',
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
                        <pre className="text-sm whitespace-pre-wrap">
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