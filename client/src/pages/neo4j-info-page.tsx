import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Neo4jStats {
  totalNodes: number;
  totalRelationships: number;
  sampleRelationships: Array<{
    source: string;
    type: string;
    target: string;
  }>;
}

export default function Neo4jInfoPage() {
  // Add debugging for query execution and response
  const { data: stats, isLoading, error } = useQuery<Neo4jStats>({
    queryKey: ['/api/graph/debug'],
    onSuccess: (data) => {
      console.log('Neo4j debug data received:', data);
    },
    onError: (err) => {
      console.error('Error fetching Neo4j debug data:', err);
    }
  });

  console.log('Current stats:', stats);
  console.log('Loading state:', isLoading);
  console.log('Error state:', error);

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
        <div className="max-w-6xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Neo4j Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Failed to load Neo4j database information. Please try again later.</p>
              <Button variant="outline" onClick={() => window.history.back()} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Neo4j Database Information
            </CardTitle>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Nodes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold">
                      {stats?.totalNodes || 0}
                    </span>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Total Relationships</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold">
                      {stats?.totalRelationships || 0}
                    </span>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Sample Relationships</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.sampleRelationships && stats.sampleRelationships.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Source Node</TableHead>
                          <TableHead>Relationship Type</TableHead>
                          <TableHead>Target Node</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.sampleRelationships.map((rel, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{rel.source}</TableCell>
                            <TableCell>{rel.type}</TableCell>
                            <TableCell>{rel.target}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No relationships found in the database.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}