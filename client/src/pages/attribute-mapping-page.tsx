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
import { Input } from "@/components/ui/input";

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

  // Target states
  const [selectedTargetDataset, setSelectedTargetDataset] = useState<string | null>(null);

  // Mapping states
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Filter states
  const [sourceFilter, setSourceFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [confidenceOperator, setConfidenceOperator] = useState<"gt" | "lt" | "eq">("gt");
  const [confidenceValue, setConfidenceValue] = useState<string>("");

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
    if (!selectedSourceAttribute || !targetDatasetData?.data) return [];

    const values = new Set<string>();
    Object.values(targetDatasetData.data).forEach(instance => {
      if (instance[selectedSourceAttribute]) {
        values.add(instance[selectedSourceAttribute]);
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
    if (selectedSourceAttribute && selectedTargetDataset) {
      generateMappings();
    }
  }, [selectedSourceAttribute, selectedTargetDataset, sourceAttributeValues, targetAttributeValues]);

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

  // Filter target datasets to match source type and exclude source dataset
  const availableTargetDatasets = datasets.filter(dataset => {
    if (!selectedSourceDatasetObj) return true; // Show all if no source selected
    return dataset.typeId === selectedSourceDatasetObj.typeId &&
           dataset.id !== Number(selectedSourceDataset); // Exclude source dataset
  });

  // Effect to reset target selection if source type changes
  useEffect(() => {
    if (selectedSourceDatasetObj && selectedTargetDatasetObj) {
      if (selectedSourceDatasetObj.typeId !== selectedTargetDatasetObj.typeId ||
          selectedSourceDataset === selectedTargetDataset) { // Reset if same dataset selected
        setSelectedTargetDataset(null);
      }
    }
  }, [selectedSourceDatasetObj?.typeId, selectedSourceDataset]);

  // Apply filters to mappings
  const filteredMappings = mappings.filter(mapping => {
    const sourceMatch = mapping.sourceValue.toLowerCase().includes(sourceFilter.toLowerCase());
    const targetMatch = mapping.targetValue.toLowerCase().includes(targetFilter.toLowerCase());

    const confidencePercent = Number((mapping.confidence * 100).toFixed(0));
    const confidenceNumValue = Number(confidenceValue);

    const confidenceMatch = confidenceValue === "" || (
      confidenceOperator === "gt" ? confidencePercent > confidenceNumValue :
      confidenceOperator === "lt" ? confidencePercent < confidenceNumValue :
      confidencePercent === confidenceNumValue
    );

    return sourceMatch && targetMatch && confidenceMatch;
  });


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
                      // Reset target if types don't match
                      const newSourceType = datasets.find(d => d.id === Number(value))?.typeId;
                      if (selectedTargetDatasetObj && newSourceType !== selectedTargetDatasetObj.typeId) {
                        setSelectedTargetDataset(null);
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
                    onValueChange={setSelectedSourceAttribute}
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
                    onValueChange={setSelectedTargetDataset}
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

                {/* Target Attribute Display */}
                <div className="space-y-2">
                  <Label>Target Attribute</Label>
                  <div className="p-2 border rounded-md bg-muted">
                    {selectedSourceAttribute || "Select a source attribute first"}
                  </div>
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
                        <TableHead>
                          <div className="space-y-2">
                            <span>Source Value</span>
                            <Input
                              placeholder="Filter source..."
                              value={sourceFilter}
                              onChange={(e) => setSourceFilter(e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="space-y-2">
                            <span>Target Value</span>
                            <Input
                              placeholder="Filter target..."
                              value={targetFilter}
                              onChange={(e) => setTargetFilter(e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="space-y-2">
                            <span>Confidence</span>
                            <div className="flex gap-2">
                              <Select
                                value={confidenceOperator}
                                onValueChange={(value: "gt" | "lt" | "eq") => setConfidenceOperator(value)}
                              >
                                <SelectTrigger className="w-[100px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="gt">&gt;</SelectItem>
                                  <SelectItem value="lt">&lt;</SelectItem>
                                  <SelectItem value="eq">=</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Value %"
                                value={confidenceValue}
                                onChange={(e) => {
                                  const value = Math.max(0, Math.min(100, Number(e.target.value)));
                                  setConfidenceValue(value.toString());
                                }}
                                className="w-[100px]"
                              />
                            </div>
                          </div>
                        </TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMappings.map((mapping, index) => (
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
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}