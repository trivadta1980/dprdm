import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import ForceGraph2D from "react-force-graph-2d";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SiteInfo {
  name: string;
  siteType: string;
  siteId: string;
}

interface PathInfo {
  nodes: string[];
  relationships: string[];
  length: number;
}

interface GraphNode {
  id: string;
  name: string;
  type: string;
  siteId: string;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
  pathIndex: number;
}

export default function SitePathsPage() {
  const [sourceType, setSourceType] = useState<string>("API");
  const [targetType, setTargetType] = useState<string>("DP");
  const [selectedProduct, setSelectedProduct] = useState<string>("none");
  const [sourceLocation, setSourceLocation] = useState<string>("none");
  const [targetLocation, setTargetLocation] = useState<string>("none");

  // Fetch all sites
  const { data: sites, isLoading: sitesLoading, error: sitesError } = useQuery<SiteInfo[]>({
    queryKey: ["/api/graph/sites"],
  });

  // Fetch all products
  const { data: products, isLoading: productsLoading, error: productsError } = useQuery<string[]>({
    queryKey: ["/api/graph/products"],
  });

  // Fetch paths when criteria are selected
  const { data: paths, isLoading: pathsLoading } = useQuery<PathInfo[]>({
    queryKey: ["/api/graph/paths", selectedProduct, sourceLocation, targetLocation],
    enabled: Boolean(selectedProduct !== "none" && (sourceLocation !== "none" || targetLocation !== "none")),
  });

  // Filter sites by type
  const filteredSourceSites = sites?.filter(site => site.siteType === sourceType) || [];
  const filteredTargetSites = sites?.filter(site => site.siteType === targetType) || [];

  // Transform paths data for visualization with error handling
  const graphData = paths && paths.length > 0 ? {
    nodes: Array.from(new Set(paths.flatMap(p => p.nodes)))
      .map(nodeName => {
        const siteInfo = sites?.find(s => s.name === nodeName);
        return {
          id: nodeName,
          name: nodeName,
          type: siteInfo?.siteType || "unknown",
          siteId: siteInfo?.siteId || "unknown",
          x: Math.random() * 1000,
          y: Math.random() * 1000
        };
      }),
    links: paths.flatMap((path, pathIndex) => 
      path.nodes.slice(0, -1).map((source, i) => ({
        source,
        target: path.nodes[i + 1],
        type: path.relationships[i],
        pathIndex
      }))
    )
  } : { nodes: [], links: [] };

  if (sitesLoading || productsLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (sitesError || productsError) {
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
                      <SelectItem value="none">Select a product</SelectItem>
                      {products?.map(product => (
                        <SelectItem key={product} value={product}>
                          {product}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              {/* Source Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Source Type</label>
                <Select value={sourceType} onValueChange={setSourceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none_type">Select type</SelectItem>
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
                    <SelectValue placeholder="Select source site" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      <SelectItem value="none">Select a location</SelectItem>
                      {filteredSourceSites.map(site => (
                        <SelectItem key={site.siteId} value={site.name}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Type</label>
                <Select value={targetType} onValueChange={setTargetType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none_type">Select type</SelectItem>
                    {["API", "DP", "SD", "PL"].map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Location</label>
                <Select value={targetLocation} onValueChange={setTargetLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target site" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      <SelectItem value="none">Select a location</SelectItem>
                      {filteredTargetSites.map(site => (
                        <SelectItem key={site.siteId} value={site.name}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Display */}
        <Card>
          <CardHeader>
            <CardTitle>Supply Chain Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            {pathsLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : paths && paths.length > 0 ? (
              <>
                <div className="mb-4 space-y-2">
                  <h3 className="text-sm font-medium">Found Paths: {paths.length}</h3>
                  <div className="flex flex-wrap gap-2">
                    {paths.map((path, index) => (
                      <Badge key={index} variant="outline">
                        Path {index + 1}: {path.length} steps
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="h-[600px] border rounded-lg overflow-hidden">
                  <ForceGraph2D
                    graphData={graphData}
                    nodeLabel={node => `${node.name}\nType: ${node.type}\nID: ${node.siteId}`}
                    nodeColor={node => 
                      node.type === 'API' ? '#4dabf7' : 
                      node.type === 'DP' ? '#ff6b6b' :
                      node.type === 'SD' ? '#51cf66' :
                      node.type === 'PL' ? '#ffd43b' :
                      '#868e96'
                    }
                    linkColor={link => {
                      const colors = ['#868e96', '#4dabf7', '#ff6b6b', '#51cf66', '#ffd43b'];
                      return colors[link.pathIndex % colors.length];
                    }}
                    linkDirectionalArrowLength={6}
                    linkDirectionalArrowRelPos={1}
                    linkCurvature={0.2}
                    linkLabel={link => `Type: ${link.type}`}
                    nodeCanvasObject={(node: any, ctx, globalScale) => {
                      const label = node.name.split(' - ')[0]; // Show shortened label
                      const fontSize = 12 / globalScale;
                      ctx.font = `${fontSize}px Sans-Serif`;
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      ctx.fillStyle = 
                        node.type === 'API' ? '#4dabf7' : 
                        node.type === 'DP' ? '#ff6b6b' :
                        node.type === 'SD' ? '#51cf66' :
                        node.type === 'PL' ? '#ffd43b' :
                        '#868e96';
                      ctx.fillText(label, node.x, node.y);
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Select a product and source/target locations to see supply chain paths.</p>
                <p className="text-sm mt-2">
                  Tip: Start with API sites as source and DP sites as target to see manufacturing routes.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}