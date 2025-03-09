import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
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

// Helper function to check if path A is a subset of path B
const isPathSubset = (shorterPath: string[], longerPath: string[]): boolean => {
  if (shorterPath.length >= longerPath.length) return false;

  // Check if shorter path appears at the start of longer path
  for (let i = 0; i < shorterPath.length; i++) {
    if (shorterPath[i] !== longerPath[i]) return false;
  }
  return true;
};

export default function SitePathsPage() {
  const [selectedProduct, setSelectedProduct] = useState<string>("none");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sourceLocation, setSourceLocation] = useState<string>("none");
  const [targetLocation, setTargetLocation] = useState<string>("none");

  const { data: fullGraphData, isLoading: graphLoading, error: graphError } = useQuery<GraphData>({
    queryKey: ["/api/graph/full"],
  });

  const { data: products, isLoading: productsLoading, error: productsError } = useQuery<string[]>({
    queryKey: ["/api/graph/products"],
  });

  const distinctPaths = useMemo(() => {
    if (!fullGraphData || selectedProduct === "none") return [];

    const paths = new Map<string, Path>();
    const visited = new Set<string>();

    const findPaths = (
      currentNode: string,
      path: string[],
      siteTypes: string[]
    ) => {
      const node = fullGraphData.nodes.find(n => n.id === currentNode);
      if (!node) return;

      path.push(currentNode);
      siteTypes.push(node.siteType);

      // Only consider paths with 2 or more nodes
      if (path.length >= 2) {
        const sequenceKey = path.join('→');
        const isValidPath = path.every((node, index) => {
          if (index === path.length - 1) return true;
          const nextNode = path[index + 1];
          return fullGraphData.relationships.some(rel =>
            rel.source === node &&
            rel.target === nextNode &&
            rel.product === selectedProduct
          );
        });

        if (isValidPath) {
          paths.set(sequenceKey, {
            sequence: [...path],
            siteTypes: [...siteTypes],
            product: selectedProduct,
            isPrimary: true
          });
        }
      }

      const relationships = fullGraphData.relationships.filter(
        rel => rel.source === currentNode && rel.product === selectedProduct
      );

      for (const rel of relationships) {
        if (!visited.has(rel.target)) {
          visited.add(rel.target);
          findPaths(rel.target, [...path], [...siteTypes]);
          visited.delete(rel.target);
        }
      }
    };

    // Find all possible paths
    fullGraphData.nodes.forEach(startNode => {
      const hasRelationships = fullGraphData.relationships.some(
        rel => rel.source === startNode.id && rel.product === selectedProduct
      );

      if (hasRelationships) {
        visited.clear();
        visited.add(startNode.id);
        findPaths(startNode.id, [], []);
      }
    });

    // Sort paths by length (longest first) and filter out subset paths
    const allPaths = Array.from(paths.values())
      .sort((a, b) => b.sequence.length - a.sequence.length);

    // Filter out paths that are subsets of longer paths
    return allPaths.filter((path, index) => {
      // Check if this path is a subset of any longer path
      const isSubset = allPaths.some((longerPath, longerIndex) => {
        if (longerIndex >= index) return false; // Only check against longer paths
        return isPathSubset(path.sequence, longerPath.sequence);
      });
      return !isSubset; // Keep only if not a subset
    });

  }, [fullGraphData, selectedProduct]);

  const filteredGraphData = useMemo(() => {
    if (!fullGraphData) return { nodes: [], links: [] };

    let filteredNodes = [...fullGraphData.nodes];
    let filteredRelationships = [...fullGraphData.relationships];

    if (selectedType !== "all") {
      filteredNodes = filteredNodes.filter(node => node.siteType === selectedType);
      filteredRelationships = filteredRelationships.filter(rel =>
        filteredNodes.some(node => node.id === rel.source) &&
        filteredNodes.some(node => node.id === rel.target)
      );
    }

    if (selectedProduct !== "none") {
      filteredRelationships = filteredRelationships.filter(rel => rel.product === selectedProduct);
      const relatedNodeIds = new Set([
        ...filteredRelationships.map(rel => rel.source),
        ...filteredRelationships.map(rel => rel.target)
      ]);
      filteredNodes = filteredNodes.filter(node => relatedNodeIds.has(node.id));
    }

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

  const resetFilters = () => {
    setSelectedProduct("none");
    setSelectedType("all");
    setSourceLocation("none");
    setTargetLocation("none");
  };

  const [graphZoom, setGraphZoom] = useState(1);

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
      <div className="p-4 space-y-4">
        <Card className="w-full">
          <CardContent className="py-3">
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-xs">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select Product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All Products</SelectItem>
                    {products?.map(product => (
                      <SelectItem key={product} value={product}>
                        {product}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 max-w-xs">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Filter by Type" />
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
              <div className="flex-1 max-w-xs">
                <Select value={sourceLocation} onValueChange={setSourceLocation}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Source Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Any Source</SelectItem>
                    {fullGraphData?.nodes.map(node => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.name} ({node.siteType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 max-w-xs">
                <Select value={targetLocation} onValueChange={setTargetLocation}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Target Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Any Target</SelectItem>
                    {fullGraphData?.nodes.map(node => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.name} ({node.siteType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="whitespace-nowrap"
              >
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="lg:col-span-1">
            <CardHeader className="py-3">
              <CardTitle className="text-lg">Supply Chain Paths</CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Badge variant="outline">{distinctPaths.length} Paths</Badge>
                <Badge variant="outline">{filteredGraphData.nodes.length} Sites</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-4 py-2 border-t border-b bg-gray-50">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'API', color: '#4dabf7', description: 'Active Pharmaceutical Ingredient' },
                    { type: 'DP', color: '#ff6b6b', description: 'Drug Product' },
                    { type: 'SD', color: '#51cf66', description: 'Storage & Distribution' },
                    { type: 'PL', color: '#ffd43b', description: 'Packaging & Labeling' }
                  ].map(({ type, color, description }) => (
                    <div key={type} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                      <span className="text-xs font-medium">{type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedProduct !== "none" && distinctPaths.length > 0 && (
                <ScrollArea className="h-[calc(100vh-400px)]">
                  <div className="p-4 space-y-2">
                    {distinctPaths.map((path, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Path {index + 1}</span>
                          <Badge variant="outline" className="text-xs">
                            {path.sequence.length} Steps
                          </Badge>
                        </div>
                        <div className="text-sm">
                          {path.sequence.map((node, i) => (
                            <span key={i} className="text-gray-600">
                              {node}
                              {i < path.sequence.length - 1 && (
                                <span className="text-gray-400 mx-1">→</span>
                              )}
                            </span>
                          ))}
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          {path.siteTypes.map((type, i) => (
                            <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardContent className="p-4">
              <div className="relative h-[calc(100vh-250px)] border rounded-lg overflow-hidden">
                <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg border p-1">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setGraphZoom(z => z * 1.2)}
                      className="p-1.5"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setGraphZoom(z => z / 1.2)}
                      className="p-1.5"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setGraphZoom(1)}
                      className="p-1.5"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

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
                  zoom={graphZoom}
                  nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.name.split(' - ')[0];
                    const fontSize = 12 / globalScale;
                    const size = 8 / globalScale;

                    ctx.beginPath();
                    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
                    ctx.fillStyle =
                      node.siteType === 'API' ? '#4dabf7' :
                        node.siteType === 'DP' ? '#ff6b6b' :
                          node.siteType === 'SD' ? '#51cf66' :
                            node.siteType === 'PL' ? '#ffd43b' :
                              '#868e96';
                    ctx.fill();

                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2 / globalScale;
                    ctx.stroke();

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