import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database, Loader2, RefreshCw } from "lucide-react";
import ForceGraph2D from "react-force-graph-2d";
import { useToast } from "@/hooks/use-toast";

interface GraphData {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
  }>;
  links: Array<{
    source: string;
    target: string;
    type: string;
  }>;
}

export default function DatasetNeo4jPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch graph data for the dataset
  const { data: graphData, isLoading, refetch } = useQuery<GraphData>({
    queryKey: [`/api/graph/dataset/${id}`],
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshing",
      description: "Updating graph visualization...",
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Neo4j Graph Visualization</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button variant="outline" onClick={() => setLocation('/neo4j-info')}>
                <Database className="h-4 w-4 mr-2" />
                View Neo4j Info
              </Button>
              <Button onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {graphData && graphData.nodes.length > 0 ? (
              <div className="h-[600px] border rounded-lg overflow-hidden">
                <ForceGraph2D
                  graphData={graphData}
                  nodeLabel="label"
                  nodeColor={(node: any) => 
                    node.type === 'DataSet' ? '#ff6b6b' : '#4dabf7'
                  }
                  linkColor={() => '#868e96'}
                  linkDirectionalArrowLength={6}
                  linkDirectionalArrowRelPos={1}
                  linkCurvature={0.2}
                  nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.label;
                    const fontSize = 12/globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = node.type === 'DataSet' ? '#ff6b6b' : '#4dabf7';
                    ctx.fillText(label, node.x, node.y);
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No graph data available for this dataset.</p>
                <p className="text-sm">Click refresh to check for updates.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}