
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

export default function GraphVisualizationPage() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState(null);
  const [filterType, setFilterType] = useState('all');
  
  const graphRef = useRef(null);
  
  // Extract unique node types for filtering
  const nodeTypes = [...new Set((graphData.nodes || []).map(node => node.label))];
  
  // Fetch graph data from API
  const fetchGraphData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiRequest("GET", "/api/graph/visualization");
      setGraphData(response);
    } catch (err) {
      console.error('Error fetching graph data:', err);
      setError(err.message || 'Failed to fetch graph data');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchGraphData();
  }, []);
  
  // Filter nodes based on selected type
  const filteredData = useCallback(() => {
    if (filterType === 'all') return graphData;
    
    const nodes = graphData.nodes || [];
    const links = graphData.links || [];
    
    const filteredNodes = nodes.filter(node => node.label === filterType);
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    
    const filteredLinks = links.filter(
      link => {
        const sourceId = link.source?.id || link.source;
        const targetId = link.target?.id || link.target;
        return nodeIds.has(sourceId) && nodeIds.has(targetId);
      }
    );
    
    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, filterType]);
  
  // Handle node click to show details
  const handleNodeClick = useCallback(node => {
    setSelectedNodeId(node.id);
    setSelectedNodeInfo(node);
  }, []);
  
  // Custom node rendering
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const label = node.label || '';
    const fontSize = 12/globalScale;
    const size = node.val || 10;
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, size/globalScale, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color || '#1f77b4';
    ctx.fill();
    
    if (globalScale >= 0.8) {
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'black';
      ctx.fillText(node.properties?.name || node.id, node.x, node.y + size/globalScale + fontSize);
    }
  }, []);
  
  // Reset graph view
  const handleResetView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  }, []);
  
  // Handle filter change
  const handleFilterChange = (value) => {
    setFilterType(value);
  };
  
  if (loading && !graphData.nodes.length) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading graph data...</span>
        </div>
      </MainLayout>
    );
  }
  
  if (error && !graphData.nodes.length) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center flex-col">
          <div className="text-destructive mb-2">Error loading graph data</div>
          <div className="text-sm text-muted-foreground">{error}</div>
          <Button onClick={fetchGraphData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </MainLayout>
    );
  }
  
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
                    <Select value={filterType} onValueChange={handleFilterChange}>
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
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleResetView}>
                      <ZoomIn className="h-4 w-4 mr-2" />
                      Reset View
                    </Button>
                    <Button variant="outline" onClick={fetchGraphData}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Data
                    </Button>
                  </div>
                </div>
                
                <div className="mb-2">
                  <span className="text-sm font-medium mr-2">Legend:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="outline" className="bg-blue-100">DataSet</Badge>
                    <Badge variant="outline" className="bg-green-100">DataItem</Badge>
                    <Badge variant="outline" className="bg-yellow-100">RelationshipType</Badge>
                    <Badge variant="outline" className="bg-red-100">CrosswalkMapping</Badge>
                  </div>
                </div>
                
                <div className="border rounded-md h-[500px] overflow-hidden bg-muted/10">
                  {graphData.nodes.length > 0 ? (
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
              
              <div>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Node Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedNodeInfo ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium">{selectedNodeInfo.label}</h4>
                          <p className="text-sm text-muted-foreground">ID: {selectedNodeInfo.id}</p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-medium mb-2">Properties</h4>
                          {selectedNodeInfo.properties ? (
                            <div className="space-y-2">
                              {Object.entries(selectedNodeInfo.properties).map(([key, value]) => (
                                <div key={key} className="grid grid-cols-2 gap-1">
                                  <span className="text-sm font-medium">{key}:</span>
                                  <span className="text-sm truncate">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No properties</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground text-sm">
                        Click on a node to view details
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Statistics</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted rounded-md p-3">
                      <div className="text-sm text-muted-foreground">Nodes</div>
                      <div className="text-2xl font-bold">{graphData.nodes.length}</div>
                    </div>
                    <div className="bg-muted rounded-md p-3">
                      <div className="text-sm text-muted-foreground">Links</div>
                      <div className="text-2xl font-bold">{graphData.links.length}</div>
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
