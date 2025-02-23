import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface DataSet {
  id: number;
  name: string;
  attributes?: string[];
}

export default function AttributeMappingPage() {
  const [selectedSourceDataset, setSelectedSourceDataset] = useState<string | null>(null);
  const [selectedTargetDataset, setSelectedTargetDataset] = useState<string | null>(null);
  const [selectedSourceAttribute, setSelectedSourceAttribute] = useState<string | null>(null);
  const [selectedTargetAttribute, setSelectedTargetAttribute] = useState<string | null>(null);

  // Fetch all datasets
  const { data: datasets = [], isLoading: datasetsLoading } = useQuery<DataSet[]>({
    queryKey: ['/api/reference-data']
  });

  // Fetch source dataset attributes
  const { data: sourceAttributes = [], isLoading: sourceAttributesLoading } = useQuery<string[]>({
    queryKey: [`/api/reference-data/${selectedSourceDataset}/attributes`],
    enabled: !!selectedSourceDataset
  });

  // Fetch target dataset attributes
  const { data: targetAttributes = [], isLoading: targetAttributesLoading } = useQuery<string[]>({
    queryKey: [`/api/reference-data/${selectedTargetDataset}/attributes`],
    enabled: !!selectedTargetDataset
  });

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold">Attribute Mapping</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Map Attributes Between Datasets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Source Dataset Selection */}
            <div className="space-y-2">
              <Label>Source Dataset</Label>
              <Select
                value={selectedSourceDataset || undefined}
                onValueChange={(value) => {
                  setSelectedSourceDataset(value);
                  setSelectedSourceAttribute(null); // Reset attribute selection
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source dataset" />
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

            {/* Source Attributes Selection */}
            {selectedSourceDataset && (
              <div className="space-y-2">
                <Label>Source Attributes</Label>
                <Select
                  value={selectedSourceAttribute || undefined}
                  onValueChange={setSelectedSourceAttribute}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source attribute" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceAttributesLoading ? (
                      <SelectItem value="loading">Loading attributes...</SelectItem>
                    ) : sourceAttributes.map((attribute) => (
                      <SelectItem key={attribute} value={attribute}>
                        {attribute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Target Dataset Selection */}
            <div className="space-y-2">
              <Label>Target Dataset</Label>
              <Select
                value={selectedTargetDataset || undefined}
                onValueChange={(value) => {
                  setSelectedTargetDataset(value);
                  setSelectedTargetAttribute(null); // Reset attribute selection
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target dataset" />
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

            {/* Target Attributes Selection */}
            {selectedTargetDataset && (
              <div className="space-y-2">
                <Label>Target Attributes</Label>
                <Select
                  value={selectedTargetAttribute || undefined}
                  onValueChange={setSelectedTargetAttribute}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target attribute" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetAttributesLoading ? (
                      <SelectItem value="loading">Loading attributes...</SelectItem>
                    ) : targetAttributes.map((attribute) => (
                      <SelectItem key={attribute} value={attribute}>
                        {attribute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
