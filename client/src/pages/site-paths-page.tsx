import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ForceGraph2D from "react-force-graph-2d";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SiteInfo {
  id: string;
  name: string;
  siteType: string;
  siteId: string;
}

interface RelationshipInfo {
  source: string;
  target: string;
  type: string;
  protocol?: string;
  product?: string;
  is_primary?: boolean;
  MAH?: string;
  manufacturer?: string;
  comment?: string;
}

interface GraphData {
  nodes: SiteInfo[];
  relationships: RelationshipInfo[];
}

export default function SitePathsPage() {
  // State for filters
  const [selectedProduct, setSelectedProduct] = useState<string>("none");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sourceLocation, setSourceLocation] = useState<string>("none");
  const [targetLocation, setTargetLocation] = useState<string>("none");

  // Fetch the complete graph data
  const { data: fullGraphData, isLoading: graphLoading, error: graphError } = useQuery<GraphData>({
    queryKey: ["/api/graph/full"],
  });

  // Fetch all products for filtering
  const { data: products, isLoading: productsLoading, error: productsError } = useQuery<string[]>({
    queryKey: ["/api/graph/products"],
  });

  // Apply filters to the full graph data
  const filteredGraphData = useMemo(() => {
    if (!fullGraphData) return { nodes: [], links: [] };

    let filteredNodes = [...fullGraphData.nodes];
    let filteredRelationships = [...fullGraphData.relationships];

    // Apply site type filter
    if (selectedType !== "all") {
      filteredNodes = filteredNodes.filter(node => node.siteType === selectedType);
      filteredRelationships = filteredRelationships.filter(rel =>
        filteredNodes.some(node => node.id === rel.source) &&
        filteredNodes.some(node => node.id === rel.target)
      );
    }

    // Apply product filter
    if (selectedProduct !== "none") {
      filteredRelationships = filteredRelationships.filter(rel => rel.product === selectedProduct);
      const relatedNodeIds = new Set([
        ...filteredRelationships.map(rel => rel.source),
        ...filteredRelationships.map(rel => rel.target)
      ]);
      filteredNodes = filteredNodes.filter(node => relatedNodeIds.has(node.id));
    }

    // Apply source/target location filters
    if (sourceLocation !== "none" || targetLocation !== "none") {
      filteredRelationships = filteredRelationships.filter(rel => {
        const matchesSource = sourceLocation === "none" || rel.source === sourceLocation;
        const matchesTarget = targetLocation === "none" || rel.target === targetLocation;
        return matchesSource && matchesTarget;
      });
      const relatedNodeIds = new Set([
        ...filteredRelationships.map(rel => rel.source),
        ...filteredRelationships.map(rel => rel.target)
      ]);
      filteredNodes = filteredNodes.filter(node => relatedNodeIds.has(node.id));
    }

    // Transform to ForceGraph2D format
    return {
      nodes: filteredNodes.map(node => ({
        ...node,
        x: Math.random() * 1000,
        y: Math.random() * 1000
      })),
      links: filteredRelationships.map((rel, index) => ({
        source: rel.source,
        target: rel.target,
        type: rel.type,
        protocol: rel.protocol,
        product: rel.product,
        is_primary: rel.is_primary,
        pathIndex: index
      }))
    };
  }, [fullGraphData, selectedType, selectedProduct, sourceLocation, targetLocation]);

  // Reset all filters
  const resetFilters = () => {
    setSelectedProduct("none");
    setSelectedType("all");
    setSourceLocation("none");
    setTargetLocation("none");
  };

  if (graphLoading || productsLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (graphError || productsError) {
    return (
      <MainLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Supply Chain Path Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Product Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Product</label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      <SelectItem value="none">All Products</SelectItem>
                      {products?.map(product => (
                        <SelectItem key={product} value={product}>
                          {product}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              {/* Site Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Site Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {["API", "DP", "SD", "PL"].map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Source Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Source Location</label>
                <Select value={sourceLocation} onValueChange={setSourceLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      <SelectItem value="none">Any Source</SelectItem>
                      {fullGraphData?.nodes.map(node => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.name} ({node.siteType})
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Location</label>
                <Select value={targetLocation} onValueChange={setTargetLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      <SelectItem value="none">Any Target</SelectItem>
                      {fullGraphData?.nodes.map(node => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.name} ({node.siteType})
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Button */}
              <div className="space-y-2 flex items-end">
                <Button
                  onClick={resetFilters}
                  variant="outline"
                  className="w-full"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Graph Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Supply Chain Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Showing:</span>
                <Badge variant="outline">
                  {filteredGraphData.nodes.length} Sites
                </Badge>
                <Badge variant="outline">
                  {filteredGraphData.links.length} Connections
                </Badge>
              </div>
            </div>
            <div className="h-[600px] border rounded-lg overflow-hidden">
              <ForceGraph2D
                graphData={filteredGraphData}
                nodeLabel={node => `${node.name}\nType: ${node.siteType}\nID: ${node.siteId}`}
                nodeColor={node => 
                  node.siteType === 'API' ? '#4dabf7' : 
                  node.siteType === 'DP' ? '#ff6b6b' :
                  node.siteType === 'SD' ? '#51cf66' :
                  node.siteType === 'PL' ? '#ffd43b' :
                  '#868e96'
                }
                linkColor={link => {
                  const colors = ['#868e96', '#4dabf7', '#ff6b6b', '#51cf66', '#ffd43b'];
                  return colors[link.pathIndex % colors.length];
                }}
                linkDirectionalArrowLength={6}
                linkDirectionalArrowRelPos={1}
                linkCurvature={0.2}
                linkLabel={link => `Type: ${link.type}\nProduct: ${link.product || 'N/A'}\nProtocol: ${link.protocol || 'N/A'}`}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                  const label = node.name.split(' - ')[0];
                  const fontSize = 12 / globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = 
                    node.siteType === 'API' ? '#4dabf7' : 
                    node.siteType === 'DP' ? '#ff6b6b' :
                    node.siteType === 'SD' ? '#51cf66' :
                    node.siteType === 'PL' ? '#ffd43b' :
                    '#868e96';
                  ctx.fillText(label, node.x, node.y);
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}