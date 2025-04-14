import { useState, useRef, useCallback, useEffect } from "react";
import Papa from "papaparse";
import { CheckCircle, AlertCircle, FileUp, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { useMissingMappings } from "@/hooks/use-missing-mappings";

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
    mappings: Mapping[];
  };
}

interface Mapping {
  sourceValue: string;
  targetValue: string;
  confidence: number;
}

interface TransformedRecord {
  original: Record<string, string>;
  transformed: Record<string, string>;
  transformations: Record<string, {
    originalValue: string;
    newValue: string;
    confidence: number;
    mapped: boolean;
  }>;
}

export function CrosswalkTransformer() {
  // State for CSV data
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [transformedData, setTransformedData] = useState<TransformedRecord[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);
  
  // State for crosswalk data
  const [crosswalks, setCrosswalks] = useState<CrosswalkMapping[]>([]);
  const [selectedCrosswalkId, setSelectedCrosswalkId] = useState<string>("");
  const [selectedCrosswalk, setSelectedCrosswalk] = useState<CrosswalkMapping | null>(null);
  const [isLoadingCrosswalks, setIsLoadingCrosswalks] = useState(false);
  const [isApplyingTransformation, setIsApplyingTransformation] = useState(false);
  const [transformationProgress, setTransformationProgress] = useState<number>(0);
  
  // State for mapping columns
  const [columnMapping, setColumnMapping] = useState<string>("");
  
  // Get React Query client
  const queryClient = useQueryClient();
  
  // Missing mappings functionality
  const { logMissingMapping } = useMissingMappings();
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load crosswalks on component mount
  const fetchCrosswalks = useCallback(async () => {
    setIsLoadingCrosswalks(true);
    try {
      const response = await apiRequest("/api/crosswalks");
      if (!response.ok) {
        throw new Error("Failed to fetch crosswalks");
      }
      const data = await response.json();
      setCrosswalks(data);
    } catch (error) {
      console.error("Error fetching crosswalks:", error);
      toast({
        title: "Error fetching crosswalks",
        description: error instanceof Error ? error.message : "Failed to load crosswalk mappings",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCrosswalks(false);
    }
  }, []);
  
  // Load selected crosswalk details
  const fetchCrosswalkDetails = useCallback(async (id: string) => {
    try {
      const response = await apiRequest(`/api/crosswalks/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch crosswalk details");
      }
      const data = await response.json();
      setSelectedCrosswalk(data);
    } catch (error) {
      console.error("Error fetching crosswalk details:", error);
      toast({
        title: "Error fetching crosswalk details",
        description: error instanceof Error ? error.message : "Failed to load crosswalk details",
        variant: "destructive",
      });
    }
  }, []);
  
  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsLoadingCsv(true);
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const parsedData = results.data as Record<string, string>[];
        if (parsedData.length > 0) {
          setCsvData(parsedData);
          setHeaders(Object.keys(parsedData[0]));
          
          toast({
            title: "CSV Loaded Successfully",
            description: `Loaded ${parsedData.length} records with ${Object.keys(parsedData[0]).length} fields`,
            variant: "default",
          });
        } else {
          toast({
            title: "Empty CSV File",
            description: "The uploaded CSV file doesn't contain any data",
            variant: "destructive",
          });
        }
        setIsLoadingCsv(false);
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        toast({
          title: "CSV Parsing Error",
          description: error.message,
          variant: "destructive",
        });
        setIsLoadingCsv(false);
      }
    });
  };
  
  // Handle crosswalk selection
  const handleCrosswalkChange = (id: string) => {
    setSelectedCrosswalkId(id);
    fetchCrosswalkDetails(id);
    
    // Reset column mapping when crosswalk changes
    setColumnMapping("");
    setTransformedData([]);
  };
  
  // Apply transformation
  const applyTransformation = async () => {
    if (!selectedCrosswalk || !columnMapping || csvData.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select a crosswalk, map a column, and upload CSV data",
        variant: "destructive",
      });
      return;
    }
    
    // Show loading state
    setIsApplyingTransformation(true);
    setTransformationProgress(0);
    
    // Get the crosswalk ID
    const crosswalkId = parseInt(selectedCrosswalkId, 10);
    
    // Show a toast notification at the start of transformation
    toast({
      title: "Starting transformation...",
      description: "Processing records",
      variant: "default",
    });
    
    // Transform each record by looking up values via the API
    const transformedRecords: TransformedRecord[] = [];
    
    try {
      // Process records in small batches to avoid overwhelming the server
      // and to provide progress updates
      const totalRecords = csvData.length;
      const batchSize = 10; // Process 10 records at a time
      
      // Create an array of unique source values to deduplicate API calls
      const uniqueSourceValues = new Map<string, boolean>();
      const sourceValueToRecords = new Map<string, number[]>();
      
      // Build lookup for unique values and their record indices
      csvData.forEach((record, index) => {
        const sourceValue = record[columnMapping];
        if (sourceValue && sourceValue.trim() !== '') {
          uniqueSourceValues.set(sourceValue, true);
          
          // Keep track of which records use this source value
          if (!sourceValueToRecords.has(sourceValue)) {
            sourceValueToRecords.set(sourceValue, []);
          }
          sourceValueToRecords.get(sourceValue)?.push(index);
        }
      });
      
      // Initialize transformed records with empty placeholders
      csvData.forEach(record => {
        const sourceValue = record[columnMapping];
        const transformedRecord: TransformedRecord = {
          original: { ...record },
          transformed: { ...record },
          transformations: {
            [columnMapping]: {
              originalValue: sourceValue || '',
              newValue: sourceValue || '',
              confidence: 0,
              mapped: false
            }
          }
        };
        transformedRecords.push(transformedRecord);
      });
      
      // Get unique source values as array
      const uniqueValues = Array.from(uniqueSourceValues.keys());
      const totalUniqueValues = uniqueValues.length;
      
      // Process in batches
      for (let i = 0; i < totalUniqueValues; i += batchSize) {
        const batch = uniqueValues.slice(i, i + batchSize);
        
        // Process each value in the batch in parallel
        const batchPromises = batch.map(async (sourceValue) => {
          try {
            // Use API to look up value (this will automatically log missing mappings)
            const response = await apiRequest(`/api/crosswalks/${crosswalkId}/lookup/${encodeURIComponent(sourceValue)}?context=${encodeURIComponent(`Transformation demo - CSV upload for ${selectedCrosswalk.name}`)}`);
            const lookupResult = await response.json();
            
            // Get all records that use this source value
            const recordIndices = sourceValueToRecords.get(sourceValue) || [];
            
            // Update all records with this source value
            recordIndices.forEach(index => {
              if (lookupResult.found) {
                // If the mapping is found, apply the transformation
                transformedRecords[index].transformed[columnMapping] = lookupResult.targetValue;
                transformedRecords[index].transformations[columnMapping] = {
                  originalValue: sourceValue,
                  newValue: lookupResult.targetValue,
                  confidence: lookupResult.confidence,
                  mapped: true
                };
              } else {
                // If the mapping is not found, keep the original value
                transformedRecords[index].transformations[columnMapping] = {
                  originalValue: sourceValue,
                  newValue: sourceValue,
                  confidence: 0,
                  mapped: false
                };
              }
            });
          } catch (error) {
            console.error(`Error looking up value ${sourceValue}:`, error);
            
            // Update all records with this source value with error state
            const recordIndices = sourceValueToRecords.get(sourceValue) || [];
            recordIndices.forEach(index => {
              transformedRecords[index].transformations[columnMapping] = {
                originalValue: sourceValue,
                newValue: sourceValue,
                confidence: 0,
                mapped: false
              };
            });
          }
        });
        
        // Wait for all lookups in this batch to complete
        await Promise.all(batchPromises);
        
        // Update progress
        const progress = Math.min(Math.round(((i + batch.length) / totalUniqueValues) * 100), 100);
        setTransformationProgress(progress);
        
        // Show progress toast
        toast({
          title: "Transforming records...",
          description: `Progress: ${progress}%`,
          variant: "default",
        });
      }
      
      // Set the transformed data
      setTransformedData(transformedRecords);
      
      // Refresh statistics
      queryClient.invalidateQueries({ queryKey: ['missing-mappings-statistics'] });
      
      // Final success toast
      toast({
        title: "Transformation Complete",
        description: `Processed ${transformedRecords.length} records using ${selectedCrosswalk.name}`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error during transformation:", error);
      toast({
        title: "Error During Transformation",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsApplyingTransformation(false);
      setTransformationProgress(100);
    }
  };
  
  // Download transformed data as CSV
  const downloadTransformedCsv = () => {
    if (transformedData.length === 0) return;
    
    const csv = Papa.unparse(transformedData.map(record => record.transformed));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'transformed_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Load crosswalks on mount
  useEffect(() => {
    fetchCrosswalks();
  }, [fetchCrosswalks]);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Crosswalk Transformation Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* CSV Upload Section */}
            <div className="space-y-4">
              <Label>Source Data (CSV)</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoadingCsv}
                  className="flex items-center gap-2"
                >
                  <FileUp size={16} />
                  {isLoadingCsv ? "Loading..." : "Upload CSV"}
                </Button>
                {csvData.length > 0 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle size={16} />
                    <span>{csvData.length} records loaded</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Crosswalk Selection */}
            <div className="space-y-4">
              <Label>Select Crosswalk Mapping</Label>
              <Select
                value={selectedCrosswalkId}
                onValueChange={handleCrosswalkChange}
                disabled={isLoadingCrosswalks || crosswalks.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a crosswalk" />
                </SelectTrigger>
                <SelectContent>
                  {crosswalks.map((crosswalk) => (
                    <SelectItem key={crosswalk.id} value={crosswalk.id.toString()}>
                      {crosswalk.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedCrosswalk && (
                <div className="text-sm text-muted-foreground">
                  <div>Mapping: {selectedCrosswalk.mappingData.sourceAttribute} → {selectedCrosswalk.mappingData.targetAttribute}</div>
                  <div>Source: {selectedCrosswalk.sourceSystemName}</div>
                  <div>Target: {selectedCrosswalk.targetSystemName}</div>
                  <div>Mappings: {selectedCrosswalk.mappingData.mappings.length} entries</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Column Mapping Section - Only show if CSV is loaded and crosswalk is selected */}
          {csvData.length > 0 && selectedCrosswalk && (
            <div className="space-y-4 pt-4">
              <Separator />
              <Label>Map CSV Column to Crosswalk Source</Label>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Select a column from your CSV to map to the crosswalk source attribute: 
                    <span className="font-medium"> {selectedCrosswalk.mappingData.sourceAttribute}</span>
                  </p>
                  <Select
                    value={columnMapping}
                    onValueChange={setColumnMapping}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end flex-col gap-2">
                  <Button 
                    onClick={() => applyTransformation()}
                    disabled={!columnMapping || csvData.length === 0 || !selectedCrosswalk || isApplyingTransformation}
                    className="flex items-center gap-2"
                  >
                    {isApplyingTransformation ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    {isApplyingTransformation ? `Processing (${transformationProgress}%)` : "Apply Transformation"}
                  </Button>
                  
                  {isApplyingTransformation && (
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${transformationProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Results Section - Only show if transformation has been applied */}
          {transformedData.length > 0 && (
            <div className="space-y-4 pt-4">
              <Separator />
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Transformation Results</h3>
                <Button 
                  onClick={downloadTransformedCsv}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download size={16} />
                  Download CSV
                </Button>
              </div>
              
              <Tabs defaultValue="side-by-side">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="side-by-side">Side by Side View</TabsTrigger>
                  <TabsTrigger value="record-view">Record View</TabsTrigger>
                </TabsList>
                
                {/* Side by Side View */}
                <TabsContent value="side-by-side" className="space-y-4">
                  <div className="overflow-auto max-h-96 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Original Value</TableHead>
                          <TableHead>Transformed Value</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transformedData.map((record, index) => {
                          const transformation = record.transformations[columnMapping];
                          const isMapped = transformation?.mapped;
                          const confidence = transformation?.confidence || 0;
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{record.original[columnMapping]}</TableCell>
                              <TableCell className={isMapped ? "font-medium text-green-600" : ""}>
                                {record.transformed[columnMapping]}
                              </TableCell>
                              <TableCell className="text-right">
                                {isMapped ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                                    Mapped ({Math.round(confidence * 100)}%)
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">
                                    Unmapped
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                {/* Record View */}
                <TabsContent value="record-view" className="space-y-4">
                  <div className="overflow-auto max-h-96 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          {headers.map(header => (
                            <TableHead 
                              key={header}
                              className={header === columnMapping ? "bg-blue-50" : ""}
                            >
                              {header}
                              {header === columnMapping && (
                                <span className="ml-1 text-xs text-blue-600">(Transformed)</span>
                              )}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transformedData.map((record, index) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            {headers.map(header => {
                              const isTransformedColumn = header === columnMapping;
                              const transformation = record.transformations[header];
                              const isMapped = isTransformedColumn && transformation?.mapped;
                              
                              return (
                                <TableCell 
                                  key={header}
                                  className={isMapped ? "font-medium text-green-600" : ""}
                                >
                                  {record.transformed[header]}
                                  {isMapped && (
                                    <div className="text-xs text-muted-foreground">
                                      Was: {record.original[header]}
                                    </div>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="space-y-2 pt-2">
                <h4 className="text-sm font-semibold">Statistics</h4>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-md border p-3">
                    <div className="text-sm text-muted-foreground">Records</div>
                    <div className="text-2xl font-bold">{transformedData.length}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-sm text-muted-foreground">Mapped Values</div>
                    <div className="text-2xl font-bold">
                      {transformedData.filter(r => r.transformations[columnMapping]?.mapped).length}
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-sm text-muted-foreground">Unmapped</div>
                    <div className="text-2xl font-bold">
                      {transformedData.filter(r => !r.transformations[columnMapping]?.mapped).length}
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-sm text-muted-foreground">Avg. Confidence</div>
                    <div className="text-2xl font-bold">
                      {transformedData.length > 0
                        ? Math.round(
                            transformedData.reduce(
                              (acc, r) => acc + (r.transformations[columnMapping]?.confidence || 0),
                              0
                            ) / transformedData.length * 100
                          )
                        : 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}