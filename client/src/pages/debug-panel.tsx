
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/main-layout";
import { apiRequest } from "@/lib/queryClient";

export default function DebugPanel() {
  const [crosswalkData, setCrosswalkData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCrosswalkData = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("GET", "/api/crosswalks/debug");
      const data = await response.json();
      setCrosswalkData(data);
      console.log("Debug crosswalk data:", data);
    } catch (error) {
      console.error("Error fetching debug data:", error);
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
            {loading ? "Loading..." : "Refresh Data"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Raw Crosswalk Mapping Data</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] w-full rounded-md border p-4">
              <pre className="text-sm">
                {JSON.stringify(crosswalkData, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>

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
                      {JSON.stringify(crosswalk.mappingData, null, 2)}
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
