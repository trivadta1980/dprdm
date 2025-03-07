import { useEffect, useRef, useState, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, ZoomIn } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface GraphNode {
  id: string;
  label: string;
  properties: {
    name?: string;
    [key: string]: any;
  };
  color?: string;
  val?: number;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  properties?: Record<string, any>;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export default function GraphVisualizationPage() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterDataset, setFilterDataset] = useState('all');

  const graphRef = useRef<any>(null);

  // Extract unique node types and dataset names for filtering
  const nodeTypes = Array.from(new Set(graphData.nodes.map(node => node.label)));
  const datasetNames = Array.from(new Set(graphData.nodes
    .filter(node => node.label === 'DataSet')
    .map(node => node.properties?.name || '')
  ));

  // Fetch graph data from API
  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest('/api/graph/visualization', { method: 'GET' });
      const data = await response.json();
      console.log("Graph data fetched:", data);
      setGraphData(data);
    } catch (err: any) {
      console.error("Error fetching graph data:", err);
      setError(err.message || "Failed to load graph data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter graph data based on selected type and dataset
  const filteredData = useCallback(() => {
    let filteredNodes = graphData.nodes;
    let nodeIds = new Set<string>();

    // Filter by node type
    if (filterType !== 'all') {
      filteredNodes = filteredNodes.filter(node => node.label === filterType);
    }

    // Filter by dataset
    if (filterDataset !== 'all') {
      // Get the dataset node and its connected nodes
      const datasetNode = graphData.nodes.find(
        node => node.label === 'DataSet' && node.properties?.name === filterDataset
      );
      if (datasetNode) {
        const connectedNodes = new Set([datasetNode.id]);
        graphData.links.forEach(link => {
          if (link.source === datasetNode.id) {
            connectedNodes.add(typeof link.target === 'object' ? link.target.id : link.target);
          }
          if (link.target === datasetNode.id) {
            connectedNodes.add(typeof link.source === 'object' ? link.source.id : link.source);
          }
        });
        filteredNodes = filteredNodes.filter(node => connectedNodes.has(node.id));
      }
    }

    nodeIds = new Set(filteredNodes.map(node => node.id));

    const filteredLinks = graphData.links.filter(
      link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return nodeIds.has(sourceId) && nodeIds.has(targetId);
      }
    );

    return {
      nodes: filteredNodes,
      links: filteredLinks
    };
  }, [graphData, filterType, filterDataset]);

  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNodeId(node.id);
    setSelectedNodeInfo(node);
  }, []);

  // Reset graph view
  const handleResetView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  }, []);

  // Load graph data when component mounts
  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Custom node renderer
  const nodeCanvasObject = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.properties?.name || node.label;
    const fontSize = 12/globalScale;
    const nodeSize = node.val || 10;

    // Draw node circle
    ctx.beginPath();
    ctx.fillStyle = node.color || '#4285F4';
    ctx.arc(node.x!, node.y!, nodeSize / globalScale, 0, 2 * Math.PI);
    ctx.fill();

    // Draw node border, highlight if selected
    ctx.strokeStyle = node.id === selectedNodeId ? '#FF5722' : '#FFFFFF';
    ctx.lineWidth = node.id === selectedNodeId ? 2 / globalScale : 1 / globalScale;
    ctx.stroke();

    // Draw node label if scale is appropriate
    if (globalScale > 0.5) {
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';

      // Draw label background
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(
        node.x! - textWidth/2 - 2,
        node.y! + nodeSize/globalScale + 2,
        textWidth + 4,
        fontSize + 2
      );

      // Draw text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(
        label,
        node.x!,
        node.y! + nodeSize/globalScale + fontSize/2 + 2
      );
    }
  }, [selectedNodeId]);

  // Reset view when graph data or filter changes
  useEffect(() => {
    if (!loading && graphRef.current) {
      setTimeout(() => handleResetView(), 300);
    }
  }, [loading, handleResetView, filterType, filterDataset]);

  return (
    <MainLayout>
      <div className="container mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Graph Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
              <div className="lg:col-span-3">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div>
                    <span className="text-sm font-medium mr-2">Filter by Type:</span>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {nodeTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <span className="text-sm font-medium mr-2">Filter by Dataset:</span>
                    <Select value={filterDataset} onValueChange={setFilterDataset}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select dataset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Datasets</SelectItem>
                        {datasetNames.map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchGraphData}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleResetView}
                    disabled={loading || graphData.nodes?.length === 0}
                  >
                    <ZoomIn className="h-4 w-4 mr-2" />
                    Fit View
                  </Button>
                </div>

                <div className="border rounded-md h-[500px] overflow-hidden bg-muted/10">
                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Loading graph data...</span>
                    </div>
                  ) : error ? (
                    <div className="flex h-full items-center justify-center text-destructive">
                      <p>Error: {error}</p>
                    </div>
                  ) : graphData.nodes?.length > 0 ? (
                    <ForceGraph2D
                      ref={graphRef}
                      graphData={filteredData()}
                      nodeCanvasObject={nodeCanvasObject}
                      nodeLabel={node => `${node.label}: ${node.properties?.name || node.id}`}
                      linkLabel={link => link.type}
                      linkDirectionalArrowLength={3.5}
                      linkDirectionalArrowRelPos={1}
                      linkWidth={1}
                      onNodeClick={handleNodeClick}
                      cooldownTicks={100}
                      onEngineStop={() => handleResetView()}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No graph data available. Try refreshing or check your Neo4j connection.
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Selected Node</h3>
                  {selectedNodeInfo ? (
                    <div className="bg-muted rounded-md p-3 text-sm space-y-2">
                      <div>
                        <Badge>{selectedNodeInfo.label}</Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ID:</span> {selectedNodeInfo.id}
                      </div>
                      {selectedNodeInfo.properties && Object.entries(selectedNodeInfo.properties).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-muted-foreground">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-muted rounded-md p-3 text-sm text-muted-foreground">
                      Click on a node to see details
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Statistics</h3>
                  <div className="flex gap-2">
                    <div className="bg-muted rounded-md p-3">
                      <div className="text-sm text-muted-foreground">Nodes</div>
                      <div className="text-2xl font-bold">{graphData.nodes?.length || 0}</div>
                    </div>
                    <div className="bg-muted rounded-md p-3">
                      <div className="text-sm text-muted-foreground">Links</div>
                      <div className="text-2xl font-bold">{graphData.links?.length || 0}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Legend</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 rounded-full bg-[#4285F4]"></div>
                      <span>Data Set</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 rounded-full bg-[#34A853]"></div>
                      <span>Data Item</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 rounded-full bg-[#FBBC05]"></div>
                      <span>Relationship</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 rounded-full bg-[#EA4335]"></div>
                      <span>Crosswalk Mapping</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}