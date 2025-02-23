import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Edit2, Check, X, Save, ArrowLeft, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useParams, Link } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { parse } from 'csv-parse/browser/esm/sync';

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

interface CSVMapping {
  sourceValue: string;
  targetValue: string;
}

export default function CrosswalkPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const isEditMode = !!id;

  const [mappingName, setMappingName] = useState("");
  const [mappingDescription, setMappingDescription] = useState("");
  const [selectedSourceDataset, setSelectedSourceDataset] = useState<string | null>(null);
  const [selectedSourceAttribute, setSelectedSourceAttribute] = useState<string | null>(null);
  const [selectedTargetDataset, setSelectedTargetDataset] = useState<string | null>(null);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [confidenceOperator, setConfidenceOperator] = useState<"gt" | "lt" | "eq">("gt");
  const [confidenceValue, setConfidenceValue] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: datasets = [], isLoading: datasetsLoading } = useQuery<DataSet[]>({
    queryKey: ['/api/reference-data']
  });

  const selectedSourceDatasetObj = datasets.find(d => d.id === Number(selectedSourceDataset));
  const selectedTargetDatasetObj = datasets.find(d => d.id === Number(selectedTargetDataset));

  const { data: sourceSchemas = [], isLoading: sourceSchemaLoading } = useQuery<SchemaField[]>({
    queryKey: [`/api/reference-types/${selectedSourceDatasetObj?.typeId}/schemas`],
    enabled: !!selectedSourceDatasetObj?.typeId
  });

  const { data: sourceDatasetData, isLoading: sourceDatasetLoading } = useQuery({
    queryKey: [`/api/reference-data/${selectedSourceDataset}`],
    enabled: !!selectedSourceDataset
  });

  const { data: targetDatasetData, isLoading: targetDatasetLoading } = useQuery({
    queryKey: [`/api/reference-data/${selectedTargetDataset}`],
    enabled: !!selectedTargetDataset
  });

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

  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    return 0;
  };

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

  useEffect(() => {
    if (selectedSourceAttribute && selectedTargetDataset) {
      generateMappings();
    }
  }, [selectedSourceAttribute, selectedTargetDataset, sourceAttributeValues, targetAttributeValues]);

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

  const availableTargetDatasets = datasets.filter(dataset => {
    if (!selectedSourceDatasetObj) return true;
    return dataset.typeId === selectedSourceDatasetObj.typeId &&
           dataset.id !== Number(selectedSourceDataset);
  });

  useEffect(() => {
    if (selectedSourceDatasetObj && selectedTargetDatasetObj) {
      if (selectedSourceDatasetObj.typeId !== selectedTargetDatasetObj.typeId ||
          selectedSourceDataset === selectedTargetDataset) {
        setSelectedTargetDataset(null);
      }
    }
  }, [selectedSourceDatasetObj?.typeId, selectedSourceDataset]);

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

  const generatePayload = () => {
    if (!selectedSourceDataset || !selectedTargetDataset || !selectedSourceAttribute || !mappingName) {
      return null;
    }

    return {
      name: mappingName,
      description: mappingDescription,
      sourceSystemId: Number(selectedSourceDataset),
      targetSystemId: Number(selectedTargetDataset),
      mappingData: {
        sourceAttribute: selectedSourceAttribute,
        targetAttribute: selectedSourceAttribute,
        mappings: mappings.map(m => ({
          sourceValue: m.sourceValue,
          targetValue: m.targetValue,
          confidence: m.confidence
        }))
      }
    };
  };

  const { data: existingCrosswalk, isLoading: crosswalkLoading } = useQuery({
    queryKey: [`/api/crosswalks/${id}`],
    enabled: isEditMode,
  });

  useEffect(() => {
    if (existingCrosswalk && isEditMode) {
      setMappingName(existingCrosswalk.name);
      setMappingDescription(existingCrosswalk.description);
      setSelectedSourceDataset(String(existingCrosswalk.sourceSystemId));
      setSelectedTargetDataset(String(existingCrosswalk.targetSystemId));
      setSelectedSourceAttribute(existingCrosswalk.mappingData.sourceAttribute);
      setMappings(existingCrosswalk.mappingData.mappings);
    }
  }, [existingCrosswalk, isEditMode]);


  const saveMappingsMutation = useMutation({
    mutationFn: async () => {
      const payload = generatePayload();
      if (!payload) {
        throw new Error("Please select source and target datasets and attributes and provide a name");
      }

      const response = await fetch('/api/crosswalks', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save mapping');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Mapping saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/crosswalks'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUploadError(null);

    if (!file) return;

    if (file.type !== "text/csv") {
      setUploadError("Please upload a CSV file");
      return;
    }

    try {
      const text = await file.text();
      const records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      if (!Array.isArray(records) || records.length === 0) {
        setUploadError("The CSV file is empty or invalid");
        return;
      }

      // Validate CSV structure
      const firstRecord = records[0];
      if (!('sourceValue' in firstRecord && 'targetValue' in firstRecord)) {
        setUploadError("CSV must have 'sourceValue' and 'targetValue' columns");
        return;
      }

      // Convert CSV records to mappings
      const newMappings: Mapping[] = records.map((record: CSVMapping) => ({
        sourceValue: record.sourceValue,
        targetValue: record.targetValue,
        confidence: calculateSimilarity(record.sourceValue, record.targetValue)
      }));

      setMappings(newMappings);
      toast({
        title: "Success",
        description: `Imported ${newMappings.length} mappings from CSV`,
      });
    } catch (error) {
      setUploadError("Failed to parse CSV file: " + (error as Error).message);
    }

    // Reset the file input
    event.target.value = '';
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/crosswalks">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">
              {isEditMode ? "Edit Crosswalk" : "Create Crosswalk"}
            </h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Map Source to Target Attributes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 mb-8">
              <div className="space-y-2">
                <Label htmlFor="mapping-name">Mapping Name</Label>
                <Input
                  id="mapping-name"
                  value={mappingName}
                  onChange={(e) => setMappingName(e.target.value)}
                  placeholder="Enter a name for this mapping"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mapping-description">Description</Label>
                <Input
                  id="mapping-description"
                  value={mappingDescription}
                  onChange={(e) => setMappingDescription(e.target.value)}
                  placeholder="Describe the purpose of this mapping"
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Source</h2>
                <div className="space-y-2">
                  <Label>Source Dataset</Label>
                  <Select
                    value={selectedSourceDataset || undefined}
                    onValueChange={(value) => {
                      setSelectedSourceDataset(value);
                      setSelectedSourceAttribute(null);
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

              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Target</h2>
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

                <div className="space-y-2">
                  <Label>Target Attribute</Label>
                  <div className="p-2 border rounded-md bg-muted">
                    {selectedSourceAttribute || "Select a source attribute first"}
                  </div>
                </div>
              </div>
            </div>

            {mappings.length > 0 && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">Value Mappings</h2>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={handleCSVUpload}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label htmlFor="csv-upload">
                        <Button variant="outline" asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            Import from CSV
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                  <Button
                    onClick={() => saveMappingsMutation.mutate()}
                    disabled={
                      saveMappingsMutation.isPending ||
                      !mappingName ||
                      !selectedSourceDataset ||
                      !selectedTargetDataset ||
                      !selectedSourceAttribute ||
                      mappings.length === 0
                    }
                  >
                    {saveMappingsMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Mappings
                      </span>
                    )}
                  </Button>
                </div>
                {uploadError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{uploadError}</AlertDescription>
                  </Alert>
                )}
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

        {mappings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Information - Save Mappings Payload</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                <pre className="text-sm">
                  {JSON.stringify(generatePayload(), null, 2)}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}