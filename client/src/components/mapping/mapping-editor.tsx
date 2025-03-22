import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent,
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Edit, Trash2, Download, Upload, XCircle, Check, Filter } from "lucide-react";
import Papa from "papaparse";

export interface MappingItem {
  sourceValue: string;
  targetValue: string;
  confidence: number;
  id?: string; // Optional unique identifier
}

export interface MappingEditorProps {
  mappings: MappingItem[];
  onMappingsChange: (mappings: MappingItem[]) => void;
  sourceValues: string[];
  targetValues: string[];
  sourceLabel?: string;
  targetLabel?: string;
  allowCsvImport?: boolean;
  allowCsvExport?: boolean;
  downloadTemplateFilename?: string;
  exportFilename?: string;
  readOnly?: boolean;
}

/**
 * A reusable mapping editor component that can be embedded in any dialog
 * to manage mappings between source and target values.
 */
export function MappingEditor({
  mappings,
  onMappingsChange,
  sourceValues,
  targetValues,
  sourceLabel = "Source Value",
  targetLabel = "Target Value",
  allowCsvImport = true,
  allowCsvExport = true,
  downloadTemplateFilename = "mapping_template.csv",
  exportFilename = "mappings_export.csv",
  readOnly = false,
}: MappingEditorProps) {
  const { toast } = useToast();
  const fileInputRef = React.createRef<HTMLInputElement>();
  
  // Internal state
  const [filteredMappings, setFilteredMappings] = useState<MappingItem[]>(mappings);
  const [sourceFilter, setSourceFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState("");
  const [confidenceOperator, setConfidenceOperator] = useState<"gt" | "lt" | "eq">("gt");
  
  // State for editing
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newSourceValue, setNewSourceValue] = useState("");
  const [newTargetValue, setNewTargetValue] = useState("");
  const [newConfidence, setNewConfidence] = useState(100);
  
  // State for deletion
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // When external mappings change, update the filtered mappings
  useEffect(() => {
    setFilteredMappings(mappings);
  }, [mappings]);
  
  // Filter mappings when filters change
  useEffect(() => {
    // Check if all filters are empty/default
    const areAllFiltersEmpty = 
      sourceFilter === '' && 
      targetFilter === '' && 
      confidenceFilter === '';
    
    if (areAllFiltersEmpty) {
      // If all filters are empty, show all mappings without filtering
      setFilteredMappings([...mappings]);
      return;
    }
    
    // Apply filters
    const filtered = mappings.filter(mapping => {
      // Guard against missing properties
      const sourceValue = mapping.sourceValue || '';
      const targetValue = mapping.targetValue || '';
      const confidence = mapping.confidence ?? 0;

      const sourceMatch = sourceFilter === '' || 
        sourceValue.toLowerCase().includes(sourceFilter.toLowerCase());

      const targetMatch = targetFilter === '' || 
        targetValue.toLowerCase().includes(targetFilter.toLowerCase());

      const confidencePercent = Number((confidence * 100).toFixed(0));
      const confidenceNumValue = confidenceFilter ? Number(confidenceFilter) : 0;

      const confidenceMatch = confidenceFilter === "" || (
        confidenceOperator === "gt" ? confidencePercent > confidenceNumValue :
        confidenceOperator === "lt" ? confidencePercent < confidenceNumValue :
        confidencePercent === confidenceNumValue
      );

      return sourceMatch && targetMatch && confidenceMatch;
    });

    setFilteredMappings(filtered);
  }, [mappings, sourceFilter, targetFilter, confidenceOperator, confidenceFilter]);
  
  // Add a new mapping
  const addMapping = () => {
    if (!newSourceValue || !newTargetValue) {
      toast({
        title: "Missing Values",
        description: "Both source and target values are required.",
        variant: "destructive",
      });
      return;
    }
    
    // Check for duplicates
    const isDuplicate = mappings.some(
      m => m.sourceValue === newSourceValue && m.targetValue === newTargetValue
    );
    
    if (isDuplicate) {
      toast({
        title: "Duplicate Mapping",
        description: "This source and target value combination already exists.",
        variant: "destructive",
      });
      return;
    }
    
    const newMapping: MappingItem = {
      sourceValue: newSourceValue,
      targetValue: newTargetValue,
      confidence: newConfidence / 100, // Convert from percentage to decimal
      id: Date.now().toString(), // Simple unique ID
    };
    
    const updatedMappings = [...mappings, newMapping];
    onMappingsChange(updatedMappings);
    
    // Reset form
    setNewSourceValue("");
    setNewTargetValue("");
    setNewConfidence(100);
    
    toast({
      title: "Mapping Added",
      description: "New mapping has been added successfully.",
    });
  };
  
  // Edit an existing mapping
  const startEditing = (index: number) => {
    const mapping = mappings[index];
    setEditingIndex(index);
    setNewSourceValue(mapping.sourceValue);
    setNewTargetValue(mapping.targetValue);
    setNewConfidence(mapping.confidence * 100); // Convert from decimal to percentage
  };
  
  const saveEdit = () => {
    if (editingIndex === null) return;
    
    if (!newSourceValue || !newTargetValue) {
      toast({
        title: "Missing Values",
        description: "Both source and target values are required.",
        variant: "destructive",
      });
      return;
    }
    
    // Check for duplicates (excluding the current mapping being edited)
    const isDuplicate = mappings.some(
      (m, idx) => idx !== editingIndex && 
      m.sourceValue === newSourceValue && 
      m.targetValue === newTargetValue
    );
    
    if (isDuplicate) {
      toast({
        title: "Duplicate Mapping",
        description: "This source and target value combination already exists.",
        variant: "destructive",
      });
      return;
    }
    
    const updatedMappings = [...mappings];
    updatedMappings[editingIndex] = {
      ...updatedMappings[editingIndex],
      sourceValue: newSourceValue,
      targetValue: newTargetValue,
      confidence: newConfidence / 100, // Convert from percentage to decimal
    };
    
    onMappingsChange(updatedMappings);
    
    // Reset form
    setEditingIndex(null);
    setNewSourceValue("");
    setNewTargetValue("");
    setNewConfidence(100);
    
    toast({
      title: "Mapping Updated",
      description: "Mapping has been updated successfully.",
    });
  };
  
  const cancelEdit = () => {
    setEditingIndex(null);
    setNewSourceValue("");
    setNewTargetValue("");
    setNewConfidence(100);
  };
  
  // Delete a mapping
  const confirmDelete = () => {
    if (deleteIndex === null) return;
    
    const updatedMappings = mappings.filter((_, idx) => idx !== deleteIndex);
    onMappingsChange(updatedMappings);
    
    // Reset state
    setDeleteIndex(null);
    setIsDeleteDialogOpen(false);
    
    toast({
      title: "Mapping Deleted",
      description: "Mapping has been deleted successfully.",
    });
  };
  
  // Handle CSV import
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const records = results.data;
          // Transform records into mappings
          const newMappings: MappingItem[] = records.map((record: any) => {
            let sourceValue = record.sourceValue;
            let targetValue = record.targetValue;
            
            // Handle template format (Source_X, Target_X)
            if (!sourceValue && !targetValue) {
              const sourceKey = Object.keys(record).find(key => key.startsWith("Source_"));
              const targetKey = Object.keys(record).find(key => key.startsWith("Target_"));
              
              if (sourceKey) sourceValue = record[sourceKey];
              if (targetKey) targetValue = record[targetKey];
            }

            return {
              sourceValue: sourceValue || "",
              targetValue: targetValue || "",
              confidence: 1.0, // Default confidence
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Unique ID
            };
          });

          // Update mappings
          const mergedMappings = [...mappings];
          
          // Add only non-duplicate mappings
          newMappings.forEach(newMapping => {
            const isDuplicate = mergedMappings.some(
              m => m.sourceValue === newMapping.sourceValue && 
                   m.targetValue === newMapping.targetValue
            );
            
            if (!isDuplicate) {
              mergedMappings.push(newMapping);
            }
          });
          
          onMappingsChange(mergedMappings);
          
          toast({
            title: "Success",
            description: `Imported ${newMappings.length} mappings from CSV.`,
          });
          
          // Clear the input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error) {
          console.error("Error processing CSV:", error);
          toast({
            title: "Error",
            description: "Failed to process CSV file. Please check the format.",
            variant: "destructive",
          });
        }
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        toast({
          title: "Error",
          description: "Failed to parse CSV file. Please check the format.",
          variant: "destructive",
        });
      }
    });
  };
  
  // Generate template CSV for download
  const handleDownloadTemplate = () => {
    // Create a template with empty data but correct headers
    const template = [{
      sourceValue: "",
      targetValue: "",
      confidence: "100%"
    }];
    
    // Generate CSV with PapaParse
    const csv = Papa.unparse(template);
    
    // Create and trigger download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadTemplateFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Export current mappings to CSV
  const handleExportCSV = () => {
    if (mappings.length === 0) {
      toast({
        title: "No Data",
        description: "There are no mappings to export",
        variant: "destructive",
      });
      return;
    }

    // Convert mappings to rows with percentage confidence
    const dataToExport = mappings.map(mapping => ({
      sourceValue: mapping.sourceValue,
      targetValue: mapping.targetValue,
      confidencePercent: `${(mapping.confidence * 100).toFixed(0)}%`
    }));
    
    // Generate CSV with PapaParse
    const csv = Papa.unparse(dataToExport);
    
    // Create and trigger download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Clear all mappings
  const clearAllMappings = () => {
    if (window.confirm("Are you sure you want to clear all mappings? This cannot be undone.")) {
      onMappingsChange([]);
      toast({
        title: "Mappings Cleared",
        description: "All mappings have been cleared.",
      });
    }
  };
  
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Filtering and Actions Header */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Value Mappings ({mappings.length})</h3>
            <div className="flex gap-2">
              {allowCsvImport && !readOnly && (
                <>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    ref={fileInputRef}
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
                </>
              )}
              
              {allowCsvExport && (
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  disabled={mappings.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
                </Button>
              )}
              
              {allowCsvImport && !readOnly && (
                <Button
                  type="button"
                  onClick={handleDownloadTemplate}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              )}
              
              {!readOnly && (
                <Button
                  type="button"
                  onClick={clearAllMappings}
                  variant="outline"
                  className="text-red-500 hover:text-red-700"
                  disabled={mappings.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-2 pb-2 flex-wrap">
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground mr-2">Filters:</span>
            </div>
            <Input
              placeholder={`Filter ${sourceLabel}...`}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-40"
            />
            <Input
              placeholder={`Filter ${targetLabel}...`}
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="w-40"
            />
            <div className="flex gap-2 items-center">
              <Select
                value={confidenceOperator}
                onValueChange={(value: "gt" | "lt" | "eq") => setConfidenceOperator(value)}
              >
                <SelectTrigger className="w-[80px]">
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
                placeholder="Confidence %"
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(e.target.value)}
                className="w-[120px]"
              />
            </div>
            {(sourceFilter || targetFilter || confidenceFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSourceFilter("");
                  setTargetFilter("");
                  setConfidenceFilter("");
                }}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
        
        {/* Mapping Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{sourceLabel}</TableHead>
                <TableHead>{targetLabel}</TableHead>
                <TableHead>Confidence</TableHead>
                {!readOnly && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMappings.length > 0 ? (
                filteredMappings.map((mapping, index) => (
                  <TableRow key={mapping.id || index}>
                    {editingIndex === index ? (
                      // Edit mode
                      <>
                        <TableCell>
                          <Select 
                            value={newSourceValue} 
                            onValueChange={setNewSourceValue}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select source value" />
                            </SelectTrigger>
                            <SelectContent>
                              {sourceValues.map((value) => (
                                <SelectItem key={value} value={value}>
                                  {value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={newTargetValue} 
                            onValueChange={setNewTargetValue}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select target value" />
                            </SelectTrigger>
                            <SelectContent>
                              {targetValues.map((value) => (
                                <SelectItem key={value} value={value}>
                                  {value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={newConfidence}
                            onChange={(e) => setNewConfidence(Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={saveEdit}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={cancelEdit}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      // View mode
                      <>
                        <TableCell>{mapping.sourceValue}</TableCell>
                        <TableCell>{mapping.targetValue}</TableCell>
                        <TableCell>{Math.round(mapping.confidence * 100)}%</TableCell>
                        {!readOnly && (
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => startEditing(index)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setDeleteIndex(index);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={readOnly ? 3 : 4} className="text-center py-4">
                    {sourceFilter || targetFilter || confidenceFilter ? (
                      <div className="text-muted-foreground">
                        No mappings match the current filters
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        No mappings defined yet. Add one below or import from CSV.
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
              
              {/* Add new mapping form (only in non-read-only mode) */}
              {!readOnly && editingIndex === null && (
                <TableRow className="bg-muted/20">
                  <TableCell>
                    <Select 
                      value={newSourceValue} 
                      onValueChange={setNewSourceValue}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${sourceLabel.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceValues.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={newTargetValue} 
                      onValueChange={setNewTargetValue}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${targetLabel.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {targetValues.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={newConfidence}
                      onChange={(e) => setNewConfidence(Number(e.target.value))}
                      className="w-[100px]"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button onClick={addMapping}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Summary */}
        <div className="text-sm text-muted-foreground">
          {filteredMappings.length === mappings.length 
            ? `Showing all ${mappings.length} mappings.` 
            : `Showing ${filteredMappings.length} of ${mappings.length} mappings.`}
        </div>
      </CardContent>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this mapping from the list.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteIndex(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}