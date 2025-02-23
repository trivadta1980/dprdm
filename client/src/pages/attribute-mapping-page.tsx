import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataSet {
  id: number;
  name: string;
  typeId: number;
}

interface SchemaField {
  name: string;
}

interface Instance {
  id: number;
  name: string;
  data: Record<string, Record<string, string>>;
}

export default function AttributeMappingPage() {
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [selectedSourceInstance, setSelectedSourceInstance] = useState<string | null>(null);
  const [selectedAttribute, setSelectedAttribute] = useState<string | null>(null);

  // Fetch all datasets
  const { data: datasets = [], isLoading: datasetsLoading } = useQuery<DataSet[]>({
    queryKey: ['/api/reference-data']
  });

  // Find the selected dataset to get its typeId
  const selectedDatasetObj = datasets.find(d => d.id === Number(selectedDataset));

  // Fetch schemas for selected dataset's type
  const { data: schemas = [], isLoading: schemasLoading } = useQuery<SchemaField[]>({
    queryKey: [`/api/reference-types/${selectedDatasetObj?.typeId}/schemas`],
    enabled: !!selectedDatasetObj?.typeId
  });

  // Source system instances
  const { data: sourceInstances = [], isLoading: sourceInstancesLoading } = useQuery<Instance[]>({
    queryKey: [`/api/reference-data/${selectedDataset}/instances`],
    enabled: !!selectedDataset
  });

  // Get the values for the selected attribute from all instances
  const getAttributeValues = () => {
    if (!selectedAttribute || !sourceInstances) return [];

    const values = sourceInstances.map(instance => {
      // Extract value for selected attribute from each instance's data
      for (const instanceKey in instance.data) {
        const instanceData = instance.data[instanceKey];
        if (instanceData && instanceData[selectedAttribute]) {
          return {
            id: instance.id,
            value: instanceData[selectedAttribute]
          };
        }
      }
      return null;
    }).filter(Boolean);

    console.log('Extracted values:', values);
    return values;
  };

  const attributeValues = getAttributeValues();

  // Debug information
  const debugInfo = {
    selectedDataset,
    selectedAttribute,
    sourceInstances: sourceInstances?.map(instance => ({
      id: instance.id,
      data: instance.data
    })),
    extractedValues: attributeValues
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold">Attribute Mapping</h1>

        <Card>
          <CardHeader>
            <CardTitle>Select Dataset and Schema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dataset Selection */}
            <div className="space-y-2">
              <Label>Source Dataset</Label>
              <Select
                value={selectedDataset || undefined}
                onValueChange={(value) => {
                  setSelectedDataset(value);
                  setSelectedAttribute(null); // Reset attribute when dataset changes
                  setSelectedSourceInstance(null);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasetsLoading ? (
                    <SelectItem value="loading">Loading datasets...</SelectItem>
                  ) : datasets.map((dataset) => (
                    <SelectItem key={dataset.id} value={String(dataset.id)}>
                      {dataset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schema Selection */}
            <div className="space-y-2">
              <Label>Source Attribute</Label>
              <Select 
                disabled={!selectedDataset}
                value={selectedAttribute || undefined}
                onValueChange={(value) => {
                  setSelectedAttribute(value);
                  setSelectedSourceInstance(null);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={selectedDataset ? "Choose an attribute" : "Select a dataset first"} />
                </SelectTrigger>
                <SelectContent>
                  {schemasLoading ? (
                    <SelectItem value="loading">Loading attributes...</SelectItem>
                  ) : schemas.map((schema, index) => (
                    <SelectItem key={index} value={schema.name}>
                      {schema.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data Values Selection */}
            <div className="space-y-2">
              <Label>Source Value</Label>
              <Select
                disabled={!selectedAttribute}
                value={selectedSourceInstance || undefined}
                onValueChange={setSelectedSourceInstance}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={selectedAttribute ? "Choose a value" : "Select an attribute first"} />
                </SelectTrigger>
                <SelectContent>
                  {sourceInstancesLoading ? (
                    <SelectItem value="loading">Loading values...</SelectItem>
                  ) : attributeValues.map((item) => (
                    <SelectItem key={item?.id} value={String(item?.id)}>
                      {item?.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Debug Panel */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}