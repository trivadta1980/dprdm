import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import ForceGraph2D from "react-force-graph-2d";
import { useToast } from "@/hooks/use-toast";

interface GraphStats {
  totalNodes: number;
  dataItems: number;
  relationships: number;
  datasetName: string;
}

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

export default function DatasetGraphPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  // Fetch graph statistics
  const { data: graphStats, isLoading: statsLoading, refetch: refetchStats } = useQuery<GraphStats>({
    queryKey: [`/api/graph/dataset/${id}`],
  });

  // Fetch graph visualization data
  const { data: graphData, isLoading: graphLoading, refetch: refetchGraph } = useQuery<GraphData>({
    queryKey: [`/api/graph/dataset/${id}/visualization`],
  });

  const handleRefresh = () => {
    refetchStats();
    refetchGraph();
    toast({
      title: "Refreshing",
      description: "Updating graph data...",
    });
  };

  if (statsLoading || graphLoading) {
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
        {/* Statistics Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Graph Statistics</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {graphStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Total Nodes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{graphStats.totalNodes}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Data Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{graphStats.dataItems}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Relationships</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{graphStats.relationships}</p>
                  </CardContent>
                </Card>
                <div className="col-span-full">
                  <h3 className="text-lg font-semibold mb-2">Dataset: {graphStats.datasetName}</h3>
                  <p className="text-gray-500">
                    These statistics show the current state of your data in the graph database.
                    Click refresh to update if you've made recent changes.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No graph statistics available.</p>
                <p className="text-sm">Click refresh to check for updates.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Graph Visualization Card */}
        <Card>
          <CardHeader>
            <CardTitle>Graph Visualization</CardTitle>
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
                <p>No graph visualization data available.</p>
                <p className="text-sm">Click refresh to check for updates.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}