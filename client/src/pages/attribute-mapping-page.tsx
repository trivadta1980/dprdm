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
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
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


  // Get the specific dataset's raw data
  const { data: selectedDatasetData, isLoading: selectedDatasetLoading } = useQuery({
    queryKey: [`/api/reference-data/${selectedDataset}`],
    enabled: !!selectedDataset
  });

  // Debug information
  const debugInfo = {
    selectedDataset,
    selectedAttribute,
    rawDatasetData: selectedDatasetData
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
                onValueChange={setSelectedAttribute}
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