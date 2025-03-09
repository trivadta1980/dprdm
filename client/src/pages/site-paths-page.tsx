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
import { Separator } from "@/components/ui/separator";

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

interface Path {
  sequence: string[];
  siteTypes: string[];
  product: string;
  isPrimary: boolean;
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

  // Calculate all possible paths and group them by sequence
  const distinctPaths = useMemo(() => {
    if (!fullGraphData || selectedProduct === "none") return [];

    const paths = new Map<string, Path>();
    const visited = new Set<string>();

    // Helper function to find all possible paths from a starting node
    const findPaths = (
      currentNode: string,
      path: string[],
      siteTypes: string[],
      isNewPath: boolean
    ) => {
      const node = fullGraphData.nodes.find(n => n.id === currentNode);
      if (!node) return;

      // Add current node to path
      path.push(currentNode);
      siteTypes.push(node.siteType);

      // Get sequence key for the current path
      const sequenceKey = path.join('→');
      console.log('Path found:', {
        sequence: sequenceKey,
        length: path.length,
        types: siteTypes.join('→')
      });

      // Store the path if it's new or longer than existing path with same sequence
      if (!paths.has(sequenceKey) || isNewPath) {
        paths.set(sequenceKey, {
          sequence: [...path],
          siteTypes: [...siteTypes],
          product: selectedProduct,
          isPrimary: true
        });
      }

      // Find all relationships for the current node with selected product
      const relationships = fullGraphData.relationships.filter(
        rel => rel.source === currentNode && rel.product === selectedProduct
      );

      console.log('Found relationships:', {
        node: currentNode,
        count: relationships.length,
        relationships: relationships.map(r => `${r.source} -> ${r.target}`)
      });

      // Explore each relationship
      for (const rel of relationships) {
        if (!visited.has(rel.target)) {
          visited.add(rel.target);
          findPaths(rel.target, [...path], [...siteTypes], isNewPath);
          visited.delete(rel.target);
        }
      }
    };

    // Start path finding from all nodes
    fullGraphData.nodes.forEach(node => {
      visited.clear();
      visited.add(node.id);
      findPaths(node.id, [], [], true);
    });

    return Array.from(paths.values());
  }, [fullGraphData, selectedProduct]);

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
            <CardTitle>Supply Chain Path Query</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Path Statistics Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Supply Chain Paths</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Path Statistics */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Unique Paths:</span>
                      <Badge variant="outline">{distinctPaths.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Sites Shown:</span>
                      <Badge variant="outline">{filteredGraphData.nodes.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Connections:</span>
                      <Badge variant="outline">{filteredGraphData.links.length}</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Site Type Legend */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Site Types</h3>
                  <div className="space-y-2">
                    {[
                      { type: 'API', color: '#4dabf7', description: 'Active Pharmaceutical Ingredient' },
                      { type: 'DP', color: '#ff6b6b', description: 'Drug Product' },
                      { type: 'SD', color: '#51cf66', description: 'Storage & Distribution' },
                      { type: 'PL', color: '#ffd43b', description: 'Packaging & Labeling' }
                    ].map(({ type, color, description }) => (
                      <div key={type} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                        <span className="text-sm font-medium">{type}</span>
                        <span className="text-sm text-gray-500">- {description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Distinct Paths List */}
                {selectedProduct !== "none" && distinctPaths.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Available Paths</h3>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {distinctPaths.map((path, index) => (
                          <div key={index} className="p-2 border rounded">
                            <div className="text-sm font-medium">Path {index + 1}</div>
                            <div className="text-sm text-gray-500">
                              {path.sequence.map((node, i) => (
                                <span key={i}>
                                  {node}
                                  {i < path.sequence.length - 1 ? ' → ' : ''}
                                </span>
                              ))}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Types: {path.siteTypes.join(' → ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Graph Visualization */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Supply Chain Visualization</CardTitle>
            </CardHeader>
            <CardContent>
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
                    const size = 8 / globalScale;

                    // Draw node circle
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
                    ctx.fillStyle =
                      node.siteType === 'API' ? '#4dabf7' :
                        node.siteType === 'DP' ? '#ff6b6b' :
                          node.siteType === 'SD' ? '#51cf66' :
                            node.siteType === 'PL' ? '#ffd43b' :
                              '#868e96';
                    ctx.fill();

                    // Draw node border
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2 / globalScale;
                    ctx.stroke();

                    // Draw label
                    ctx.font = `${fontSize}px Sans-Serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#000000';
                    ctx.fillText(label, node.x, node.y + size + fontSize);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}