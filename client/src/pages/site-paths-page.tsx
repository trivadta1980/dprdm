import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import ForceGraph2D from "react-force-graph-2d";

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

export default function SitePathsPage() {
  const [sourceLocation, setSourceLocation] = useState<string>("");
  const [targetLocation, setTargetLocation] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  // Fetch all sites
  const { data: sites, isLoading: sitesLoading } = useQuery<SiteInfo[]>({
    queryKey: ["/api/graph/sites"],
  });

  // Fetch all products
  const { data: products, isLoading: productsLoading } = useQuery<string[]>({
    queryKey: ["/api/graph/products"],
  });

  // Fetch paths when all required fields are selected
  const { data: paths, isLoading: pathsLoading } = useQuery<PathInfo[]>({
    queryKey: ["/api/graph/paths", selectedProduct, sourceLocation, targetLocation],
    enabled: Boolean(selectedProduct && (sourceLocation || targetLocation)),
  });

  // Transform path data for visualization
  const graphData = paths ? {
    nodes: Array.from(new Set(paths.flatMap(p => p.nodes))).map(name => ({
      id: name,
      name,
      type: sites?.find(s => s.name === name)?.siteType || "unknown"
    })),
    links: paths.flatMap(path => 
      path.nodes.slice(0, -1).map((source, i) => ({
        source,
        target: path.nodes[i + 1],
        type: path.relationships[i]
      }))
    )
  } : { nodes: [], links: [] };

  if (sitesLoading || productsLoading) {
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
          <CardHeader>
            <CardTitle>Site Paths Query</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product</label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map(product => (
                      <SelectItem key={product} value={product}>
                        {product}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Source Location</label>
                <Select value={sourceLocation} onValueChange={setSourceLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites?.map(site => (
                      <SelectItem key={site.name} value={site.name}>
                        {site.name} ({site.siteType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Location</label>
                <Select value={targetLocation} onValueChange={setTargetLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites?.map(site => (
                      <SelectItem key={site.name} value={site.name}>
                        {site.name} ({site.siteType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Path Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            {pathsLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : graphData.nodes.length > 0 ? (
              <div className="h-[600px] border rounded-lg overflow-hidden">
                <ForceGraph2D
                  graphData={graphData}
                  nodeLabel="name"
                  nodeColor={node => node.type === 'API' ? '#4dabf7' : node.type === 'DP' ? '#ff6b6b' : '#868e96'}
                  linkColor={() => '#868e96'}
                  linkDirectionalArrowLength={6}
                  linkDirectionalArrowRelPos={1}
                  linkCurvature={0.2}
                  nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.name;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = node.type === 'API' ? '#4dabf7' : node.type === 'DP' ? '#ff6b6b' : '#868e96';
                    ctx.fillText(label, node.x, node.y);
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Select a product and optionally source/target locations to see paths.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {paths && paths.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Path Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paths.map((path, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="font-medium mb-2">Path {index + 1} (Length: {path.length})</div>
                    <div className="text-sm text-gray-600">
                      {path.nodes.join(" → ")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
