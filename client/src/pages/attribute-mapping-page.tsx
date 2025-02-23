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

export default function AttributeMappingPage() {
  // Source states
  const [selectedSourceDataset, setSelectedSourceDataset] = useState<string | null>(null);
  const [selectedSourceAttribute, setSelectedSourceAttribute] = useState<string | null>(null);
  const [selectedSourceValue, setSelectedSourceValue] = useState<string | null>(null);

  // Target states
  const [selectedTargetDataset, setSelectedTargetDataset] = useState<string | null>(null);
  const [selectedTargetAttribute, setSelectedTargetAttribute] = useState<string | null>(null);
  const [selectedTargetValue, setSelectedTargetValue] = useState<string | null>(null);

  // Fetch all datasets
  const { data: datasets = [], isLoading: datasetsLoading } = useQuery<DataSet[]>({
    queryKey: ['/api/reference-data']
  });

  // Source dataset type
  const selectedSourceDatasetObj = datasets.find(d => d.id === Number(selectedSourceDataset));

  // Target dataset type
  const selectedTargetDatasetObj = datasets.find(d => d.id === Number(selectedTargetDataset));

  // Fetch schemas for source dataset's type
  const { data: sourceSchemas = [], isLoading: sourceSchemaLoading } = useQuery<SchemaField[]>({
    queryKey: [`/api/reference-types/${selectedSourceDatasetObj?.typeId}/schemas`],
    enabled: !!selectedSourceDatasetObj?.typeId
  });

  // Fetch schemas for target dataset's type
  const { data: targetSchemas = [], isLoading: targetSchemaLoading } = useQuery<SchemaField[]>({
    queryKey: [`/api/reference-types/${selectedTargetDatasetObj?.typeId}/schemas`],
    enabled: !!selectedTargetDatasetObj?.typeId
  });

  // Get the source dataset's raw data
  const { data: sourceDatasetData, isLoading: sourceDatasetLoading } = useQuery({
    queryKey: [`/api/reference-data/${selectedSourceDataset}`],
    enabled: !!selectedSourceDataset
  });

  // Get the target dataset's raw data
  const { data: targetDatasetData, isLoading: targetDatasetLoading } = useQuery({
    queryKey: [`/api/reference-data/${selectedTargetDataset}`],
    enabled: !!selectedTargetDataset
  });

  // Extract unique values for the selected source attribute
  const getSourceAttributeValues = () => {
    if (!selectedSourceAttribute || !sourceDatasetData?.data) return [];

    const values = new Set<string>();
    Object.values(sourceDatasetData.data).forEach(instance => {
      if (instance[selectedSourceAttribute]) {
        values.add(instance[selectedSourceAttribute]);
      }
    });

    return Array.from(values);
  };

  // Extract unique values for the selected target attribute
  const getTargetAttributeValues = () => {
    if (!selectedTargetAttribute || !targetDatasetData?.data) return [];

    const values = new Set<string>();
    Object.values(targetDatasetData.data).forEach(instance => {
      if (instance[selectedTargetAttribute]) {
        values.add(instance[selectedTargetAttribute]);
      }
    });

    return Array.from(values);
  };

  const sourceAttributeValues = getSourceAttributeValues();
  const targetAttributeValues = getTargetAttributeValues();

  // Debug information
  const debugInfo = {
    source: {
      dataset: selectedSourceDataset,
      attribute: selectedSourceAttribute,
      value: selectedSourceValue,
      rawData: sourceDatasetData,
      extractedValues: sourceAttributeValues
    },
    target: {
      dataset: selectedTargetDataset,
      attribute: selectedTargetAttribute,
      value: selectedTargetValue,
      rawData: targetDatasetData,
      extractedValues: targetAttributeValues
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold">Attribute Mapping</h1>

        <Card>
          <CardHeader>
            <CardTitle>Map Source to Target Attributes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-8">
              {/* Source Section */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Source</h2>
                {/* Source Dataset Selection */}
                <div className="space-y-2">
                  <Label>Source Dataset</Label>
                  <Select
                    value={selectedSourceDataset || undefined}
                    onValueChange={(value) => {
                      setSelectedSourceDataset(value);
                      setSelectedSourceAttribute(null);
                      setSelectedSourceValue(null);
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

                {/* Source Attribute Selection */}
                <div className="space-y-2">
                  <Label>Source Attribute</Label>
                  <Select 
                    disabled={!selectedSourceDataset}
                    value={selectedSourceAttribute || undefined}
                    onValueChange={(value) => {
                      setSelectedSourceAttribute(value);
                      setSelectedSourceValue(null);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={selectedSourceDataset ? "Choose an attribute" : "Select a dataset first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceSchemaLoading ? (
                        <SelectItem value="loading">Loading attributes...</SelectItem>
                      ) : sourceSchemas.map((schema) => (
                        <SelectItem key={schema.name} value={schema.name}>
                          {schema.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Source Values Selection */}
                <div className="space-y-2">
                  <Label>Source Values</Label>
                  <Select
                    disabled={!selectedSourceAttribute}
                    value={selectedSourceValue || undefined}
                    onValueChange={setSelectedSourceValue}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={selectedSourceAttribute ? "Choose a value" : "Select an attribute first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceDatasetLoading ? (
                        <SelectItem value="loading">Loading values...</SelectItem>
                      ) : sourceAttributeValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Target Section */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Target</h2>
                {/* Target Dataset Selection */}
                <div className="space-y-2">
                  <Label>Target Dataset</Label>
                  <Select
                    value={selectedTargetDataset || undefined}
                    onValueChange={(value) => {
                      setSelectedTargetDataset(value);
                      setSelectedTargetAttribute(null);
                      setSelectedTargetValue(null);
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

                {/* Target Attribute Selection */}
                <div className="space-y-2">
                  <Label>Target Attribute</Label>
                  <Select 
                    disabled={!selectedTargetDataset}
                    value={selectedTargetAttribute || undefined}
                    onValueChange={(value) => {
                      setSelectedTargetAttribute(value);
                      setSelectedTargetValue(null);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={selectedTargetDataset ? "Choose an attribute" : "Select a dataset first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {targetSchemaLoading ? (
                        <SelectItem value="loading">Loading attributes...</SelectItem>
                      ) : targetSchemas.map((schema) => (
                        <SelectItem key={schema.name} value={schema.name}>
                          {schema.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Values Selection */}
                <div className="space-y-2">
                  <Label>Target Values</Label>
                  <Select
                    disabled={!selectedTargetAttribute}
                    value={selectedTargetValue || undefined}
                    onValueChange={setSelectedTargetValue}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={selectedTargetAttribute ? "Choose a value" : "Select an attribute first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {targetDatasetLoading ? (
                        <SelectItem value="loading">Loading values...</SelectItem>
                      ) : targetAttributeValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
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