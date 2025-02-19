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

  console.log('=== ReferenceDataInstancesPage Debug ===');
  console.log('1. Component Initialization');
  console.log('- Params received:', params);
  console.log('- Parsed dataSetId:', dataSetId);

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

  // Fetch the reference data set
  const { data: dataSet, isLoading, error } = useQuery<ReferenceDataSet>({
    queryKey: ["/api/reference-data", dataSetId],
    enabled: !!dataSetId && !isNaN(dataSetId),
  });

  console.log('2. Query State');
  console.log('- isLoading:', isLoading);
  console.log('- error:', error);
  console.log('- Raw dataset:', dataSet);

  // Parse instances from the data
  const instances = (() => {
    console.log('3. Data Processing');

    if (!dataSet?.data) {
      console.log('- No data in dataset');
      return [];
    }

    try {
      console.log('- Processing data type:', typeof dataSet.data);
      const data = typeof dataSet.data === 'string' 
        ? JSON.parse(dataSet.data) 
        : dataSet.data;

      console.log('- Parsed data:', data);
      const entries = Object.entries(data);
      console.log('- Extracted entries:', entries);
      return entries;
    } catch (error) {
      console.error('- Error parsing instance data:', error);
      return [];
    }
  })();

  console.log('4. Render Preparation');
  console.log('- Final instances to render:', instances);
  console.log('- Will show loading?', isLoading);
  console.log('- Will show error?', !!error);
  console.log('- Will show no data message?', instances.length === 0);

  if (isLoading) {
    console.log('Rendering: Loading state');
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    console.log('Rendering: Error state');
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

  if (!dataSet) {
    console.log('Rendering: No dataset state');
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-medium">Reference Data Set not found</h2>
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

  console.log('Rendering: Main content');
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
            <CardTitle>Reference Data Instances - {dataSet.name}</CardTitle>
          </CardHeader>
          <CardContent>
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