import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Check, X } from "lucide-react";

interface DataSet {
  id: number;
  name: string;
  typeId: number;
}

interface SchemaField {
  name: string;
}

interface Mapping {
  sourceValue: string;
  targetValue: string;
  confidence: number;
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

  // Mapping states
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

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

  // Function to calculate string similarity (simple for now, can be enhanced)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    return 0;
  };

  // Function to automatically generate mappings
  const generateMappings = () => {
    const newMappings: Mapping[] = [];

    sourceAttributeValues.forEach(sourceValue => {
      let bestMatch = {
        targetValue: '',
        confidence: 0
      };

      targetAttributeValues.forEach(targetValue => {
        const similarity = calculateSimilarity(sourceValue, targetValue);
        if (similarity > bestMatch.confidence) {
          bestMatch = {
            targetValue,
            confidence: similarity
          };
        }
      });

      if (bestMatch.confidence > 0) {
        newMappings.push({
          sourceValue,
          targetValue: bestMatch.targetValue,
          confidence: bestMatch.confidence
        });
      }
    });

    setMappings(newMappings);
  };

  // Effect to generate mappings when both attributes are selected
  useEffect(() => {
    if (selectedSourceAttribute && selectedTargetAttribute) {
      generateMappings();
    }
  }, [selectedSourceAttribute, selectedTargetAttribute, sourceAttributeValues, targetAttributeValues]);

  // Function to update a mapping
  const updateMapping = (index: number, newTargetValue: string) => {
    const newMappings = [...mappings];
    newMappings[index] = {
      ...newMappings[index],
      targetValue: newTargetValue,
      confidence: calculateSimilarity(newMappings[index].sourceValue, newTargetValue)
    };
    setMappings(newMappings);
    setEditingIndex(null);
  };

  // Filter target datasets to match source type
  const availableTargetDatasets = datasets.filter(dataset => {
    if (!selectedSourceDatasetObj) return true; // Show all if no source selected
    return dataset.typeId === selectedSourceDatasetObj.typeId;
  });

  // Effect to reset target selection if source type changes
  useEffect(() => {
    if (selectedSourceDatasetObj && selectedTargetDatasetObj) {
      if (selectedSourceDatasetObj.typeId !== selectedTargetDatasetObj.typeId) {
        setSelectedTargetDataset(null);
        setSelectedTargetAttribute(null);
        setSelectedTargetValue(null);
      }
    }
  }, [selectedSourceDatasetObj?.typeId]);


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
    },
    mappings
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
                      // Reset target if types don't match
                      const newSourceType = datasets.find(d => d.id === Number(value))?.typeId;
                      if (selectedTargetDatasetObj && newSourceType !== selectedTargetDatasetObj.typeId) {
                        setSelectedTargetDataset(null);
                        setSelectedTargetAttribute(null);
                        setSelectedTargetValue(null);
                      }
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
                    disabled={!selectedSourceDataset}
                    value={selectedTargetDataset || undefined}
                    onValueChange={(value) => {
                      setSelectedTargetDataset(value);
                      setSelectedTargetAttribute(null);
                      setSelectedTargetValue(null);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        !selectedSourceDataset
                          ? "Select a source dataset first"
                          : "Choose a target dataset"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {datasetsLoading ? (
                        <SelectItem value="loading">Loading datasets...</SelectItem>
                      ) : availableTargetDatasets.map((dataset) => (
                        <SelectItem key={dataset.id} value={String(dataset.id)}>
                          {dataset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSourceDataset && selectedTargetDataset &&
                    selectedSourceDatasetObj?.typeId !== selectedTargetDatasetObj?.typeId && (
                      <p className="text-sm text-destructive">
                        Target dataset type must match source dataset type
                      </p>
                    )}
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

            {/* Mapping Table */}
            {mappings.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Value Mappings</h2>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source Value</TableHead>
                        <TableHead>Target Value</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mappings.map((mapping, index) => (
                        <TableRow key={mapping.sourceValue}>
                          <TableCell>{mapping.sourceValue}</TableCell>
                          <TableCell>
                            {editingIndex === index ? (
                              <Select
                                value={editValue || mapping.targetValue}
                                onValueChange={setEditValue}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Choose target value" />
                                </SelectTrigger>
                                <SelectContent>
                                  {targetAttributeValues.map((value) => (
                                    <SelectItem key={value} value={value}>
                                      {value}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              mapping.targetValue
                            )}
                          </TableCell>
                          <TableCell>{(mapping.confidence * 100).toFixed(0)}%</TableCell>
                          <TableCell>
                            {editingIndex === index ? (
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => updateMapping(index, editValue)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingIndex(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingIndex(index);
                                  setEditValue(mapping.targetValue);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

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