
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";
import ForceGraph2D from "react-force-graph-2d";
import { apiRequest } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [selectedType, setSelectedType] = useState<string>("all");
  const [apiAvailable, setApiAvailable] = useState<boolean>(true);

  // Check if Neo4j is available
  useEffect(() => {
    apiRequest("GET", "/api/status")
      .then(response => {
        console.log("API Status:", response);
        setApiAvailable(response.graphDbAvailable || false);
      })
      .catch(error => {
        console.error("Failed to check API status:", error);
        setApiAvailable(false);
      });
  }, []);

  // Fetch all sites
  const { data: sites, isLoading: sitesLoading, error: sitesError } = useQuery<SiteInfo[]>({
    queryKey: ["/api/graph/sites"],
    retry: 1,
    staleTime: 300000, // 5 minutes
  });

  // Fetch all products
  const { data: products, isLoading: productsLoading, error: productsError } = useQuery<string[]>({
    queryKey: ["/api/graph/products"],
    retry: 1,
    staleTime: 300000, // 5 minutes
  });

  // Fetch paths when all required fields are selected
  const { data: paths, isLoading: pathsLoading, error: pathsError } = useQuery<PathInfo[]>({
    queryKey: ["/api/graph/paths", selectedProduct, sourceLocation, targetLocation],
    enabled: Boolean(selectedProduct && (sourceLocation || targetLocation)),
    retry: 1,
  });
  
  // Debug logging
  console.log('Sites data:', sites);
  console.log('Sites loading:', sitesLoading, 'Sites error:', sitesError);
  
  console.log('Products data:', products);
  console.log('Products loading:', productsLoading, 'Products error:', productsError);
  
  console.log('Paths data:', paths);
  console.log('Paths loading:', pathsLoading, 'Paths error:', pathsError);
  console.log('Query enabled:', Boolean(selectedProduct && (sourceLocation || targetLocation)));

  // Transform paths data into graph format
  const graphData = paths ? {
    nodes: Array.from(new Set(paths.flatMap(p => p.nodes)))
      .map(nodeName => {
        const siteInfo = sites?.find(s => s.name === nodeName);
        return {
          id: nodeName,
          name: nodeName,
          type: siteInfo?.siteType || "unknown",
          siteId: siteInfo?.siteId,
          x: Math.random() * 1000,
          y: Math.random() * 1000
        };
      })
      .filter(node => selectedType === "all" || node.type === selectedType),
    links: paths.flatMap(path => 
      path.nodes.slice(0, -1).map((sourceNode, i) => ({
        source: sourceNode,
        target: path.nodes[i + 1],
        type: path.relationships[i],
        pathIndex: i // Used for coloring different paths
      }))
    )
  } : { nodes: [], links: [] };

  // Get unique site types for filtering
  const siteTypes = sites ? Array.from(new Set(sites.map(s => s.siteType))).sort() : [];

  // Show Neo4j not available error
  if (!apiAvailable) {
    return (
      <MainLayout>
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Service Unavailable</AlertTitle>
          <AlertDescription>
            The Neo4j graph database is currently not available. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  // Show any API errors
  if (sitesError || productsError) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[200px] p-4 space-y-4">
          <div className="text-red-600 font-semibold text-lg">Error loading data</div>
          {sitesError && <div className="bg-red-100 p-3 rounded-md">{sitesError.toString()}</div>}
          {productsError && <div className="bg-red-100 p-3 rounded-md">{productsError.toString()}</div>}
        </div>
      </MainLayout>
    );
  }

  // Show loading indicator
  if (sitesLoading || productsLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  // Show warning if no data is found
  if (!sites?.length || !products?.length) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
          <div className="text-amber-600 font-semibold text-lg">No data available</div>
          <div className="mt-2 text-center">
            {!sites?.length && <div>No sites found in the database.</div>}
            {!products?.length && <div>No products found in the database.</div>}
            <div className="mt-4">
              Please make sure you have created site data and product associations in the database.
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Supply Chain Path Query</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <label className="text-sm font-medium">Site Type Filter</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by site type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {siteTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
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
                    <SelectItem value="">Any Source</SelectItem>
                    {sites?.filter(site => 
                      selectedType === "all" || site.siteType === selectedType
                    ).map(site => (
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
                    <SelectItem value="">Any Target</SelectItem>
                    {sites?.filter(site => 
                      selectedType === "all" || site.siteType === selectedType
                    ).map(site => (
                      <SelectItem key={site.name} value={site.name}>
                        {site.name} ({site.siteType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Select a product and at least one location (source or target) to visualize supply chain paths.
                If you select only a source, all possible paths from that source will be shown.
                If you select only a target, all possible paths to that target will be shown.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supply Chain Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            {pathsLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pathsError ? (
              <div className="flex flex-col items-center justify-center h-[400px]">
                <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
                <div className="text-amber-500 font-medium">Error loading path data</div>
                <div className="mt-2 text-sm text-gray-500">{pathsError.toString()}</div>
              </div>
            ) : selectedProduct && (sourceLocation || targetLocation) && graphData.nodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                <p>No paths found for the selected criteria.</p>
                <p className="mt-2 text-sm">Try different source/target locations or select a different product.</p>
              </div>
            ) : graphData.nodes.length > 0 ? (
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
                    // Color each path differently
                    const colors = ['#868e96', '#4dabf7', '#ff6b6b', '#51cf66', '#ffd43b'];
                    return colors[link.pathIndex % colors.length];
                  }}
                  linkDirectionalArrowLength={6}
                  linkDirectionalArrowRelPos={1}
                  linkCurvature={0.2}
                  linkLabel={link => `Type: ${link.type}`}
                  nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.name;
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
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Select a product and optionally source/target locations to see supply chain paths.</p>
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
