import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Code } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ReferenceData {
  id: number;
  name: string;
}

interface Relationship {
  id: number;
  name: string;
  sourceDatasetId: number;
  targetDatasetId: number;
}

interface Instance {
  id: string;
  name: string;
  [key: string]: any;
}

interface RelationshipValue {
  id: number;
  sourceId: string;
  targetId: string;
  sourceName: string;
  targetName: string;
  approval_status: string;
  [key: string]: any;
}

const testSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
  endpoint: z.string().min(1, "Endpoint is required"),
  datasetId: z.string().optional(),
  relationshipId: z.string().optional(),
});

export default function ApiTestPage() {
  const [activeTab, setActiveTab] = useState<string>("datasets");
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string>("");
  const [responseData, setResponseData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: datasets = [] } = useQuery({
    queryKey: ["/api/reference-data"],
  });

  const { data: relationships = [] } = useQuery({
    queryKey: ["/api/relationships"],
  });

  const form = useForm({
    resolver: zodResolver(testSchema),
    defaultValues: {
      apiKey: "",
      endpoint: "/api/external/datasets",
      datasetId: "",
      relationshipId: "",
    },
  });

  // Update form values when tabs change
  useEffect(() => {
    if (activeTab === "datasets") {
      form.setValue("endpoint", "/api/external/datasets");
    } else if (activeTab === "reference-data") {
      form.setValue("endpoint", `/api/external/reference-data/${selectedDatasetId}`);
    } else if (activeTab === "relationships") {
      form.setValue("endpoint", `/api/external/relationships/${selectedRelationshipId}/values`);
    }
  }, [activeTab, selectedDatasetId, selectedRelationshipId, form]);

  const handleDatasetChange = (value: string) => {
    setSelectedDatasetId(value);
    form.setValue("datasetId", value);
    form.setValue("endpoint", `/api/external/reference-data/${value}`);
  };

  const handleRelationshipChange = (value: string) => {
    setSelectedRelationshipId(value);
    form.setValue("relationshipId", value);
    form.setValue("endpoint", `/api/external/relationships/${value}/values`);
  };

  const onSubmit = async (data: z.infer<typeof testSchema>) => {
    setIsLoading(true);
    setError(null);
    setResponseData(null);

    const options: RequestInit = {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "x-api-key": data.apiKey,
      },
    };

    try {
      const response = await fetch(data.endpoint, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }
      
      const jsonData = await response.json();
      setResponseData(jsonData);
      toast({
        title: "API Request Successful",
        description: `Received data from ${data.endpoint}`,
      });
    } catch (err: any) {
      setError(err.message || "An unknown error occurred");
      toast({
        title: "API Request Failed",
        description: err.message || "Failed to fetch data from the API",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format JSON nicely with 2-space indentation
  const formatJson = (data: any): string => {
    return JSON.stringify(data, null, 2);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">External API Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Test API Endpoints</CardTitle>
                <CardDescription>
                  Use this tool to test the external API endpoints with your API key.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="datasets" onValueChange={setActiveTab} value={activeTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="datasets">Datasets List</TabsTrigger>
                    <TabsTrigger value="reference-data">Reference Data</TabsTrigger>
                    <TabsTrigger value="relationships">Relationship Values</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="datasets" className="space-y-4 mt-4">
                    <p className="text-sm text-gray-500">
                      Get a list of all available datasets
                    </p>
                  </TabsContent>
                  
                  <TabsContent value="reference-data" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="datasetSelector">Select Dataset</Label>
                        <Select 
                          onValueChange={handleDatasetChange} 
                          value={selectedDatasetId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a dataset" />
                          </SelectTrigger>
                          <SelectContent>
                            {datasets && datasets.map((dataset: ReferenceData) => (
                              <SelectItem key={dataset.id} value={dataset.id.toString()}>
                                {dataset.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-sm text-gray-500">
                        Get all instances for the selected dataset
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="relationships" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="relationshipSelector">Select Relationship</Label>
                        <Select 
                          onValueChange={handleRelationshipChange} 
                          value={selectedRelationshipId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            {relationships && relationships.map((relationship: Relationship) => (
                              <SelectItem key={relationship.id} value={relationship.id.toString()}>
                                {relationship.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-sm text-gray-500">
                        Get all values for the selected relationship
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      placeholder="Enter your API key"
                      {...form.register("apiKey")}
                    />
                    {form.formState.errors.apiKey && (
                      <p className="text-sm text-red-500">{form.formState.errors.apiKey.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endpoint">Endpoint URL</Label>
                    <Input
                      id="endpoint"
                      readOnly
                      {...form.register("endpoint")}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending Request..." : "Test API Endpoint"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>API Response</CardTitle>
                <CardDescription>
                  The response from the API will appear here
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow overflow-auto">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                
                {responseData && (
                  <div>
                    {activeTab === "datasets" && Array.isArray(responseData) && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {responseData.map((dataset: any) => (
                            <TableRow key={dataset.id}>
                              <TableCell>{dataset.id}</TableCell>
                              <TableCell>{dataset.name}</TableCell>
                              <TableCell>{dataset.type}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    
                    {activeTab === "reference-data" && responseData.data && (
                      <div>
                        <h3 className="font-medium mb-2">Total Instances: {Object.keys(responseData.data).length}</h3>
                        {Object.values(responseData.data).slice(0, 10).map((instance: any, index) => (
                          <div key={index} className="border p-2 mb-2 rounded">
                            <h4 className="font-medium">{instance.name || 'Unnamed Instance'}</h4>
                            <div className="text-sm">
                              {Object.entries(instance)
                                .filter(([key]) => !key.startsWith('_') && key !== 'name')
                                .map(([key, value]) => (
                                  <div key={key} className="grid grid-cols-2 gap-2">
                                    <span className="text-gray-500">{key}:</span>
                                    <span>{String(value)}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                        {Object.keys(responseData.data).length > 10 && (
                          <p className="text-sm text-gray-500 mt-2">
                            Showing 10 of {Object.keys(responseData.data).length} instances
                          </p>
                        )}
                      </div>
                    )}
                    
                    {activeTab === "relationships" && Array.isArray(responseData) && (
                      <div>
                        <h3 className="font-medium mb-2">Total Relationship Values: {responseData.length}</h3>
                        {responseData.slice(0, 10).map((value: RelationshipValue, index) => (
                          <div key={index} className="border p-2 mb-2 rounded">
                            <div className="grid grid-cols-2 gap-1 text-sm">
                              <span className="text-gray-500">Source:</span>
                              <span>{value.sourceName}</span>
                              <span className="text-gray-500">Target:</span>
                              <span>{value.targetName}</span>
                              <span className="text-gray-500">Status:</span>
                              <span>{value.approval_status}</span>
                            </div>
                          </div>
                        ))}
                        {responseData.length > 10 && (
                          <p className="text-sm text-gray-500 mt-2">
                            Showing 10 of {responseData.length} relationship values
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <Label className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Raw JSON Response
                      </Label>
                      <div className="bg-gray-50 p-4 rounded mt-2 overflow-auto max-h-[400px]">
                        <pre className="text-xs">{formatJson(responseData)}</pre>
                      </div>
                    </div>
                  </div>
                )}
                
                {!responseData && !error && (
                  <div className="text-center text-gray-500 py-12">
                    <Code className="h-12 w-12 mx-auto mb-4" />
                    <p>No data to display. Make an API request to see results.</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t bg-gray-50 px-6 py-4">
                <div className="text-xs text-gray-500">
                  External API requests require a valid API key and will only return approved data.
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}