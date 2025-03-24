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
import { Badge } from "@/components/ui/badge";
import { CrosswalkTransformer } from "@/components/transformation/crosswalk-transformer";

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

interface CrosswalkMapping {
  id: number;
  name: string;
  sourceSystemId: number;
  targetSystemId: number;
  sourceSystemName?: string;
  targetSystemName?: string;
  mappingData: {
    sourceAttribute: string;
    targetAttribute: string;
    mappings: Array<{
      sourceValue: string;
      targetValue: string;
      confidence: number;
    }>;
  };
}

interface SchemaField {
  name: string;
  dataType: string;
}

interface DatasetSchema {
  typeName: string;
  fields: SchemaField[];
}

interface CrosswalkSchema {
  sourceSchema: SchemaField[];
  targetSchema: SchemaField[];
}

export default function ApiTestPage() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [activeTab, setActiveTab] = useState("datasets");
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string>("");
  const [selectedCrosswalkId, setSelectedCrosswalkId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState<any[]>([]);
  const [datasetSchema, setDatasetSchema] = useState<DatasetSchema | null>(null);
  const [crosswalkSchema, setCrosswalkSchema] = useState<CrosswalkSchema | null>(null);
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
  
  const { data: crosswalks, refetch: refetchCrosswalks } = useQuery<CrosswalkMapping[]>({
    queryKey: ["external-crosswalks", apiKey],
    queryFn: async () => {
      if (!apiKey) return [];
      const options: RequestInit = {
        headers: {
          "x-api-key": apiKey,
        },
      };
      const response = await fetch("/api/external/crosswalks", options);
      if (!response.ok) throw new Error("Failed to fetch crosswalks");
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
      await refetchCrosswalks();
      toast({
        title: "API Key Validated",
        description: "The API key has been successfully validated.",
        variant: "default",
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
    setCrosswalkSchema(null);

    try {
      let endpoint = "";
      if (activeTab === "datasets" && selectedDatasetId) {
        endpoint = `/api/external/reference-data/${selectedDatasetId}`;
      } else if (activeTab === "relationships" && selectedRelationshipId) {
        endpoint = `/api/external/relationships/${selectedRelationshipId}/values`;
      } else if (activeTab === "crosswalks" && selectedCrosswalkId) {
        endpoint = `/api/external/crosswalks/${selectedCrosswalkId}`;
      } else {
        throw new Error("Please select a valid item to fetch.");
      }

      const options: RequestInit = {
        headers: {
          "x-api-key": apiKey,
        },
      };

      console.log(`Fetching from ${endpoint} with API key: ${apiKey.substring(0, 3)}...`);
      const response = await fetch(endpoint, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Debug logging
      console.log("API Response:", data);
      
      if (activeTab === "datasets") {
        // Store the schema information
        if (data.schema) {
          console.log("Schema found:", data.schema);
          setDatasetSchema(data.schema);
        } else {
          console.warn("No schema found in API response");
        }
        
        // Transform dataset instances into an array
        const instances = [];
        if (data.data) {
          console.log("Dataset data found:", data.data);
          for (const [id, value] of Object.entries(data.data)) {
            if (typeof value === 'object' && value !== null) {
              console.log(`Processing instance ${id}:`, value);
              instances.push({ id, ...value });
            } else {
              console.warn(`Skipping non-object value for ${id}:`, value);
            }
          }
          console.log("Transformed instances:", instances);
          console.log("Number of instances:", instances.length);
        } else {
          console.warn("No data found in API response");
        }
        setResponseData(instances);
      } else if (activeTab === "crosswalks") {
        // Store the crosswalk schema information
        if (data.sourceSchema && data.targetSchema) {
          console.log("Crosswalk schemas found:", data.sourceSchema, data.targetSchema);
          setCrosswalkSchema({
            sourceSchema: data.sourceSchema,
            targetSchema: data.targetSchema
          });
        } else {
          console.warn("No schema found in crosswalk API response");
        }
        
        // Transform crosswalk mappings into an array
        const mappings = [];
        if (data.mappingData && data.mappingData.mappings) {
          console.log("Crosswalk data found:", data.mappingData);
          data.mappingData.mappings.forEach((mapping: any, index: number) => {
            mappings.push({
              id: index + 1,
              sourceValue: mapping.sourceValue,
              targetValue: mapping.targetValue,
              confidence: mapping.confidence,
              sourceAttribute: data.mappingData.sourceAttribute,
              targetAttribute: data.mappingData.targetAttribute
            });
          });
          console.log("Transformed mappings:", mappings);
        } else {
          console.warn("No mapping data found in API response");
        }
        setResponseData(mappings);
      } else {
        // For relationships
        setResponseData(data);
      }
      
      toast({
        title: "Data Fetched Successfully",
        description: `Successfully retrieved data from the API.`,
        variant: "default",
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="datasets">Reference Datasets</TabsTrigger>
                <TabsTrigger value="relationships">Relationships</TabsTrigger>
                <TabsTrigger value="crosswalks">Crosswalks</TabsTrigger>
                <TabsTrigger value="transformation">Transformation Demo</TabsTrigger>
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
              <TabsContent value="crosswalks" className="space-y-4">
                <div className="py-4">
                  <Label htmlFor="crosswalk-select">Select a Crosswalk</Label>
                  <Select
                    value={selectedCrosswalkId}
                    onValueChange={setSelectedCrosswalkId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a crosswalk" />
                    </SelectTrigger>
                    <SelectContent>
                      {crosswalks && crosswalks.map((crosswalk: CrosswalkMapping) => (
                        <SelectItem key={crosswalk.id} value={crosswalk.id.toString()}>
                          {crosswalk.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={fetchData} disabled={!selectedCrosswalkId || isLoading}>
                  {isLoading ? "Loading..." : "Fetch Crosswalk Mappings"}
                </Button>
              </TabsContent>
              
              <TabsContent value="transformation">
                <CrosswalkTransformer />
              </TabsContent>
            </Tabs>

            {isError && activeTab !== "transformation" && (
              <div className="mt-4 p-4 border rounded-md bg-red-50 text-red-600">
                <h3 className="font-semibold">Error</h3>
                <p>{errorMessage}</p>
              </div>
            )}

            {!isLoading && activeTab !== "transformation" && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Results (showing first 10 items)</h3>
                <div className="mb-2">
                  <p className="text-sm text-muted-foreground">
                    Data Count: {responseData.length} items
                    {activeTab === "datasets" && datasetSchema && (
                      <> | Schema: {datasetSchema.typeName} with {datasetSchema.fields?.length || 0} fields</>
                    )}
                    {activeTab === "crosswalks" && crosswalkSchema && (
                      <> | Source Schema: {crosswalkSchema.sourceSchema?.length || 0} fields, 
                         Target Schema: {crosswalkSchema.targetSchema?.length || 0} fields</>
                    )}
                  </p>
                </div>
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
                        {activeTab === "crosswalks" && (
                          <>
                            <TableHead>Source Value</TableHead>
                            <TableHead>Target Value</TableHead>
                            <TableHead>Confidence</TableHead>
                            <TableHead>Attribute</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {responseData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={
                            activeTab === "datasets" 
                              ? (datasetSchema?.fields?.length || 0) + 1 
                              : activeTab === "crosswalks" ? 5 : 4
                          }>
                            No data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        responseData.slice(0, 10).map((value: any, index) => (
                          <TableRow key={index}>
                            <TableCell>{value.id}</TableCell>
                            {activeTab === "datasets" && datasetSchema && datasetSchema.fields && 
                              datasetSchema.fields.map((field) => (
                                <TableCell key={`${value.id}-${field.name}`}>
                                  {value[field.name] !== undefined ? String(value[field.name]) : "—"}
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
                            {activeTab === "crosswalks" && (
                              <>
                                <TableCell>{value.sourceValue}</TableCell>
                                <TableCell>{value.targetValue}</TableCell>
                                <TableCell>{value.confidence !== undefined ? `${value.confidence * 100}%` : "—"}</TableCell>
                                <TableCell>{value.sourceAttribute && value.targetAttribute ? 
                                  `${value.sourceAttribute} → ${value.targetAttribute}` : "—"}
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))
                      )}
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