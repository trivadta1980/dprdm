
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/main-layout";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ReloadIcon } from "@radix-ui/react-icons";

export default function DebugPanel() {
  const [crosswalkData, setCrosswalkData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCrosswalkData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching crosswalk debug data...");
      const response = await apiRequest("GET", "/api/crosswalks/debug");
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Debug crosswalk data received:", data);
      
      if (Array.isArray(data)) {
        console.log(`Received ${data.length} crosswalk records`);
        setCrosswalkData(data);
      } else {
        console.warn("Data is not an array:", data);
        setCrosswalkData([]);
      }
    } catch (error) {
      console.error("Error fetching debug data:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
      setCrosswalkData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrosswalkData();
  }, []);

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Debug Panel</h1>
          <Button onClick={fetchCrosswalkData} disabled={loading}>
            {loading ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Refresh Data"
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to fetch crosswalk data: {error}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Raw Crosswalk Mapping Data</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] w-full rounded-md border p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <ReloadIcon className="mr-2 h-6 w-6 animate-spin" />
                  <span>Loading data...</span>
                </div>
              ) : crosswalkData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {error ? "Error loading data" : "No crosswalk data found"}
                </div>
              ) : (
                <pre className="text-sm">
                  {JSON.stringify(crosswalkData, null, 2)}
                </pre>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {crosswalkData.length > 0 && (
          <h2 className="text-xl font-semibold mt-6">Individual Crosswalk Records</h2>
        )}

        {crosswalkData.map((crosswalk) => (
          <Card key={crosswalk.id}>
            <CardHeader>
              <CardTitle>
                Crosswalk: {crosswalk.name} (ID: {crosswalk.id})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Mapping Data:</h3>
                  <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                    <pre className="text-sm">
                      {crosswalk.mappingData 
                        ? JSON.stringify(crosswalk.mappingData, null, 2)
                        : "No mapping data available"}
                    </pre>
                  </ScrollArea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Source System ID: {crosswalk.sourceSystemId}</h3>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Target System ID: {crosswalk.targetSystemId}</h3>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}
