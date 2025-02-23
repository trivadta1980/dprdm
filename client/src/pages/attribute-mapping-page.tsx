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

interface DataSet {
  id: number;
  name: string;
}

interface SchemaField {
  id: number;
  name: string;
  dataType: string;
  isRequired: boolean;
  description?: string;
}

export default function AttributeMappingPage() {
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  // Fetch all datasets
  const { data: datasets = [], isLoading: datasetsLoading } = useQuery<DataSet[]>({
    queryKey: ['/api/reference-data']
  });

  // Fetch schemas for selected dataset
  const { data: schemas = [], isLoading: schemasLoading } = useQuery<SchemaField[]>({
    queryKey: [`/api/reference-types/${selectedDataset}/schemas`],
    enabled: !!selectedDataset
  });

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
              <Label>Select Dataset</Label>
              <Select
                value={selectedDataset || undefined}
                onValueChange={setSelectedDataset}
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
              <Label>Select Schema</Label>
              <Select disabled={!selectedDataset}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={selectedDataset ? "Choose a schema" : "Select a dataset first"} />
                </SelectTrigger>
                <SelectContent>
                  {schemasLoading ? (
                    <SelectItem value="loading">Loading schemas...</SelectItem>
                  ) : schemas.map((schema) => (
                    <SelectItem key={schema.id} value={String(schema.id)}>
                      {schema.name} ({schema.dataType})
                      {schema.isRequired && " *"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
