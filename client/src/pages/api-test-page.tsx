import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";

interface ReferenceData {
  id: number;
  name: string;
}

interface Relationship {
  id: number;
  name: string;
  sourceDataSetId: number;
  targetDataSetId: number;
}

interface Instance {
  id: string;
  name: string;
  [key: string]: any;
}

interface RelationshipValue {
  id: number;
  sourceInstanceId: string;
  targetInstanceId: string;
  sourceName: string;
  targetName: string;
  approvalStatus: string;
  [key: string]: any;
}

interface SchemaField {
  name: string;
  dataType: string;
}

interface DatasetSchema {
  typeName: string;
  fields: SchemaField[];
}

export default function ApiTestPage() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [activeTab, setActiveTab] = useState("datasets");
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState<any[]>([]);
  const [datasetSchema, setDatasetSchema] = useState<DatasetSchema | null>(null);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch datasets and relationships when API key is provided
  const { data: datasets, refetch: refetchDatasets } = useQuery<ReferenceData[]>({
    queryKey: ["external-datasets", apiKey],
    queryFn: async () => {
      if (!apiKey) return [];
      const options: RequestInit = {
        headers: {
          "x-api-key": apiKey,
        },
      };
      const response = await fetch("/api/external/datasets", options);
      if (!response.ok) throw new Error("Failed to fetch datasets");
      return response.json();
    },
    enabled: !!apiKey,
  });

  const { data: relationships, refetch: refetchRelationships } = useQuery<Relationship[]>({
    queryKey: ["external-relationships", apiKey],
    queryFn: async () => {
      if (!apiKey) return [];
      const options: RequestInit = {
        headers: {
          "x-api-key": apiKey,
        },
      };
      const response = await fetch("/api/external/relationships", options);
      if (!response.ok) throw new Error("Failed to fetch relationships");
      return response.json();
    },
    enabled: !!apiKey,
  });

  const validateApiKey = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      await refetchDatasets();
      await refetchRelationships();
      toast({
        title: "API Key Validated",
        description: "The API key has been successfully validated.",
        variant: "success",
      });
    } catch (error) {
      setIsError(true);
      setErrorMessage("Invalid API key or server error.");
      toast({
        title: "Validation Failed",
        description: "Unable to validate the API key. Please check and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setIsError(false);
    setResponseData([]);
    setDatasetSchema(null);

    try {
      let endpoint = "";
      if (activeTab === "datasets" && selectedDatasetId) {
        endpoint = `/api/external/reference-data/${selectedDatasetId}`;
      } else if (activeTab === "relationships" && selectedRelationshipId) {
        endpoint = `/api/external/relationships/${selectedRelationshipId}/values`;
      } else {
        throw new Error("Please select a valid dataset or relationship.");
      }

      const options: RequestInit = {
        headers: {
          "x-api-key": apiKey,
        },
      };

      const response = await fetch(endpoint, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (activeTab === "datasets") {
        // Store the schema information
        if (data.schema) {
          setDatasetSchema(data.schema);
        }
        
        // Transform dataset instances into an array
        const instances = [];
        for (const [id, value] of Object.entries(data.data)) {
          instances.push({ id, ...value });
        }
        setResponseData(instances);
      } else {
        setResponseData(data);
      }
      
      toast({
        title: "Data Fetched Successfully",
        description: `Successfully retrieved data from the API.`,
        variant: "success",
      });
    } catch (error) {
      console.error("API fetch error:", error);
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
      toast({
        title: "Error Fetching Data",
        description: error instanceof Error ? error.message : "Failed to fetch data from the API",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">API Test Page</h1>
        <p className="text-muted-foreground">
          Use this page to test the external API with your API key.
        </p>

        <Card>
        <CardHeader>
          <CardTitle>API Key Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  type="text"
                  placeholder="Enter your API key"
                  className="w-full"
                />
              </div>
              <Button
                onClick={validateApiKey}
                disabled={!apiKey || isLoading}
                className="mt-6"
              >
                Validate
              </Button>
            </div>
            {isError && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}
            {!isError && apiKey && datasets && datasets.length > 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={16} />
                <span>API Key Valid - {datasets.length} datasets available</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {apiKey && !isError && (
        <Card>
          <CardHeader>
            <CardTitle>API Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="datasets">Reference Datasets</TabsTrigger>
                <TabsTrigger value="relationships">Relationships</TabsTrigger>
              </TabsList>
              <TabsContent value="datasets" className="space-y-4">
                <div className="py-4">
                  <Label htmlFor="dataset-select">Select a Dataset</Label>
                  <Select 
                    value={selectedDatasetId}
                    onValueChange={setSelectedDatasetId}
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
                <Button onClick={fetchData} disabled={!selectedDatasetId || isLoading}>
                  {isLoading ? "Loading..." : "Fetch Dataset Data"}
                </Button>
              </TabsContent>
              <TabsContent value="relationships" className="space-y-4">
                <div className="py-4">
                  <Label htmlFor="relationship-select">Select a Relationship</Label>
                  <Select
                    value={selectedRelationshipId}
                    onValueChange={setSelectedRelationshipId}
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
                <Button onClick={fetchData} disabled={!selectedRelationshipId || isLoading}>
                  {isLoading ? "Loading..." : "Fetch Relationship Values"}
                </Button>
              </TabsContent>
            </Tabs>

            {isError && (
              <div className="mt-4 p-4 border rounded-md bg-red-50 text-red-600">
                <h3 className="font-semibold">Error</h3>
                <p>{errorMessage}</p>
              </div>
            )}

            {responseData.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Results (showing first 10 items)</h3>
                <Separator className="my-4" />
                <div className="overflow-auto max-h-96 rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        {activeTab === "datasets" && datasetSchema && datasetSchema.fields && 
                          datasetSchema.fields.map((field) => (
                            <TableHead key={field.name}>{field.name}</TableHead>
                          ))
                        }
                        {activeTab === "relationships" && (
                          <>
                            <TableHead>Source ID</TableHead>
                            <TableHead>Target ID</TableHead>
                            <TableHead>Status</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {responseData.slice(0, 10).map((value: any, index) => (
                        <TableRow key={index}>
                          <TableCell>{value.id}</TableCell>
                          {activeTab === "datasets" && datasetSchema && datasetSchema.fields && 
                            datasetSchema.fields.map((field) => (
                              <TableCell key={`${value.id}-${field.name}`}>
                                {value[field.name] || "—"}
                              </TableCell>
                            ))
                          }
                          {activeTab === "relationships" && (
                            <>
                              <TableCell>{value.sourceInstanceId}</TableCell>
                              <TableCell>{value.targetInstanceId}</TableCell>
                              <TableCell>{value.approvalStatus}</TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {responseData.length > 10 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Showing 10 of {responseData.length} results
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      </div>
    </MainLayout>
  );
}