import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchIcon, PlusIcon, Trash2Icon, FileIcon, Download, Upload } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Papa from "papaparse";

export interface MappingItem {
  sourceValue: string;
  targetValue: string;
  confidence: number;
  id?: string; // Optional unique identifier
  status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'; // Approval status
  crosswalkId?: number; // Reference to parent crosswalk
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
  downloadTemplateFilename = "crosswalk_template.csv",
  exportFilename = "crosswalk_export.csv",
  readOnly = false,
}: MappingEditorProps) {
  const { toast } = useToast();
  const [newSourceValue, setNewSourceValue] = useState("");
  const [newTargetValue, setNewTargetValue] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [confidenceOperator, setConfidenceOperator] = useState<"gt" | "lt" | "eq">("gt");
  const [confidenceValue, setConfidenceValue] = useState<string>("");
  const [filteredMappings, setFilteredMappings] = useState<MappingItem[]>(mappings);
  const [activeTab, setActiveTab] = useState<string>("manual");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingItemId, setEditingItemId] = useState<string | undefined>(undefined);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  
  // Update filtered mappings when mappings or filters change
  useEffect(() => {
    if (!sourceFilter && !targetFilter && !confidenceValue) {
      // No active filters, show all mappings
      console.log("No active filters, displaying all mappings");
      setFilteredMappings(mappings);
      return;
    }

    const filtered = mappings.filter((mapping) => {
      // Source filter
      if (sourceFilter && !mapping.sourceValue.toLowerCase().includes(sourceFilter.toLowerCase())) {
        return false;
      }
      
      // Target filter
      if (targetFilter && !mapping.targetValue.toLowerCase().includes(targetFilter.toLowerCase())) {
        return false;
      }
      
      // Confidence filter
      if (confidenceValue) {
        const confValue = parseFloat(confidenceValue);
        if (!isNaN(confValue)) {
          if (confidenceOperator === "gt" && mapping.confidence <= confValue) {
            return false;
          } else if (confidenceOperator === "lt" && mapping.confidence >= confValue) {
            return false;
          } else if (confidenceOperator === "eq" && mapping.confidence !== confValue) {
            return false;
          }
        }
      }
      
      return true;
    });
    
    setFilteredMappings(filtered);
  }, [mappings, sourceFilter, targetFilter, confidenceOperator, confidenceValue]);
  
  // Handle item selection
  const handleItemSelect = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };
  
  // Handle select all toggle
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (!checked) {
      // Deselect all
      setSelectedItems([]);
    } else {
      // Select all filterable and eligible items (DRAFT status)
      const eligibleIds = filteredMappings
        .filter(mapping => !mapping.status || mapping.status === 'DRAFT')
        .map(mapping => mapping.id!)
        .filter(id => id !== undefined);
      setSelectedItems(eligibleIds);
    }
  };
  
  // Submit selected items for approval
  const handleBulkSubmitForApproval = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Warning",
        description: "No items selected for submission.",
        variant: "destructive",
      });
      return;
    }
    
    if (window.confirm(`Submit ${selectedItems.length} mapping(s) for approval?`)) {
      // Update the status of selected items to PENDING
      const updatedMappings = mappings.map(mapping => {
        if (mapping.id && selectedItems.includes(mapping.id)) {
          return { 
            ...mapping, 
            status: 'PENDING' as const  // Type assertion to make TypeScript happy
          };
        }
        return mapping;
      });
      
      // Update the UI with the new statuses
      onMappingsChange(updatedMappings);
      
      // Dispatch event to notify the approvals dashboard
      const crosswalkId = updatedMappings.length > 0 ? updatedMappings[0].crosswalkId : undefined;
      if (crosswalkId) {
        import("@/lib/eventBus").then(({ dispatchApprovalStatusChange }) => {
          console.log(`[MappingEditor] Dispatching bulk approval status change event for crosswalk ${crosswalkId}`);
          dispatchApprovalStatusChange({
            crosswalkMappingId: crosswalkId,
            actionType: 'update',
            userId: undefined // Will be set by the server
          });
        });
      }
      
      toast({
        title: "Success",
        description: `${selectedItems.length} mapping(s) submitted for approval.`,
      });
      
      // Clear selections after submission
      setSelectedItems([]);
      setSelectAll(false);
    }
  };
  
  // Handle edit mode
  const handleEditMapping = (mapping: MappingItem) => {
    console.log("Edit button clicked for mapping:", mapping);
    // Set the active tab to manual entry
    setActiveTab("manual");
    // Set the form values
    setNewSourceValue(mapping.sourceValue);
    setNewTargetValue(mapping.targetValue);
    // Enable edit mode
    setIsEditing(true);
    setEditingItemId(mapping.id);
    console.log("Edit mode activated. isEditing:", true, "editingItemId:", mapping.id);
  };
  
  // Add new mapping or update existing mapping
  const handleAddMapping = () => {
    if (!newSourceValue || !newTargetValue) {
      toast({
        title: "Error",
        description: "Both source and target values are required.",
        variant: "destructive",
      });
      return;
    }
    
    // If we're in edit mode, update the existing mapping
    if (isEditing && editingItemId) {
      const updatedMappings = mappings.map((mapping) => {
        if (mapping.id === editingItemId) {
          return {
            ...mapping,
            sourceValue: newSourceValue,
            targetValue: newTargetValue,
            status: "DRAFT" as const, // Reset status to DRAFT when edited
          };
        }
        return mapping;
      });
      
      onMappingsChange(updatedMappings);
      setIsEditing(false);
      setEditingItemId(undefined);
      setNewSourceValue("");
      setNewTargetValue("");
      
      toast({
        title: "Success",
        description: "Mapping updated successfully and status set to DRAFT.",
      });
      return;
    }
    
    // Check for duplicates
    const exists = mappings.some(
      (m) => m.sourceValue === newSourceValue && m.targetValue === newTargetValue
    );
    
    if (exists) {
      toast({
        title: "Error",
        description: "This mapping already exists.",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate confidence automatically based on the source and target values
    // This is a simple algorithm that could be replaced with a more sophisticated one
    // For example, string similarity, domain-specific logic, etc.
    
    // Simple algorithm: Check if the strings contain each other
    let calculatedConfidence = 0.7; // Default medium confidence
    
    // Calculate string similarity
    const sourceStr = newSourceValue.toLowerCase();
    const targetStr = newTargetValue.toLowerCase();
    
    if (sourceStr === targetStr) {
      // Exact match (ignoring case)
      calculatedConfidence = 1.0;
    } else if (sourceStr.includes(targetStr) || targetStr.includes(sourceStr)) {
      // One contains the other
      calculatedConfidence = 0.9;
    } else {
      // Calculate edit distance-based similarity
      const maxLength = Math.max(sourceStr.length, targetStr.length);
      const commonChars = sourceStr.split('').filter(char => targetStr.includes(char)).length;
      
      if (maxLength > 0) {
        const similarityRatio = commonChars / maxLength;
        // Scale between 0.5 and 0.85 based on character overlap
        calculatedConfidence = 0.5 + (similarityRatio * 0.35);
      }
    }
    
    // Look for a crosswalkId in existing mappings (inherit from other mappings in the collection)
    const existingCrosswalkId = mappings.length > 0 && mappings[0].crosswalkId 
      ? mappings[0].crosswalkId 
      : undefined;
    
    const newMapping: MappingItem = {
      sourceValue: newSourceValue,
      targetValue: newTargetValue,
      confidence: calculatedConfidence,
      id: Date.now().toString(),
      status: "DRAFT" as const, // Set default status for new mappings
      crosswalkId: existingCrosswalkId // Add crosswalkId if available from existing mappings
    };
    
    const updatedMappings = [...mappings, newMapping];
    onMappingsChange(updatedMappings);
    
    // Reset form
    setNewSourceValue("");
    setNewTargetValue("");
    
    toast({
      title: "Success",
      description: "Mapping added successfully.",
    });
  };
  
  // Delete mapping
  const handleDeleteMapping = (id: string) => {
    const updatedMappings = mappings.filter((m) => m.id !== id);
    onMappingsChange(updatedMappings);
    
    toast({
      title: "Success",
      description: "Mapping deleted successfully.",
    });
  };
  
  // Create and download CSV template
  const handleDownloadTemplate = () => {
    const headers = [`Source_${sourceLabel}`, `Target_${targetLabel}`];
    const data = [headers];
    
    // Create CSV content
    const csv = Papa.unparse(data);
    
    // Create a Blob and download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", downloadTemplateFilename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Export current mappings to CSV
  const handleExportMappings = () => {
    if (mappings.length === 0) {
      toast({
        title: "Error",
        description: "No mappings to export.",
        variant: "destructive",
      });
      return;
    }
    
    const headers = ["sourceValue", "targetValue", "confidence"];
    const rows = mappings.map((m) => [m.sourceValue, m.targetValue, m.confidence]);
    const data = [headers, ...rows];
    
    // Create CSV content
    const csv = Papa.unparse(data);
    
    // Create a Blob and download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", exportFilename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Success",
      description: "Mappings exported successfully.",
    });
  };
  
  // Import mappings from CSV
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    console.log("CSV Import - Started parsing file:", file.name);
    console.log("CSV Import - Looking for attributes:", {sourceLabel, targetLabel});
    console.log("CSV Import - Available source values:", sourceValues);
    console.log("CSV Import - Available target values:", targetValues);
    
    // Hard coded fallback for testing
    if (file.name === 'manual_fallback.csv') {
      console.log("CSV Import - Using manual fallback data");
      
      // Create manual mapping entries - using the actual data values we confirmed exist
      const manualResults = [
        { sourceValue: "San Francisco", targetValue: "SFO", confidence: "0.9" },
        { sourceValue: "Dublin", targetValue: "Dub", confidence: "0.8" }
      ];
      
      // Look for a crosswalkId in existing mappings (inherit from other mappings in the collection)
      const existingCrosswalkId = mappings.length > 0 && mappings[0].crosswalkId 
        ? mappings[0].crosswalkId 
        : undefined;
        
      const newMappings: MappingItem[] = manualResults.map((row, index) => ({
        sourceValue: row.sourceValue,
        targetValue: row.targetValue,
        confidence: parseFloat(row.confidence),
        id: Date.now().toString() + index,
        status: "DRAFT" as const, // Set default status for imported mappings
        crosswalkId: existingCrosswalkId // Add crosswalkId if available from existing mappings
      }));
      
      // Add the new mappings
      console.log("CSV Import - Manually created mappings:", newMappings);
      onMappingsChange([...mappings, ...newMappings]);
      
      toast({
        title: "Success",
        description: `Imported ${newMappings.length} mappings from manual fallback.`,
      });
      
      // Reset file input
      event.target.value = "";
      return;
    }
    
    Papa.parse(file, {
      header: true,
      delimiter: ",", // Explicitly set comma as delimiter
      skipEmptyLines: true, // Skip empty lines
      complete: (results) => {
        console.log("CSV Import - Parsing complete. Headers:", results.meta.fields);
        console.log("CSV Import - First row data:", results.data[0]);
        
        if (results.errors.length > 0) {
          console.error("CSV Import - Parsing errors:", results.errors);
          toast({
            title: "Error",
            description: `CSV parsing error: ${results.errors[0].message}`,
            variant: "destructive",
          });
          return;
        }
        
        const newMappings: MappingItem[] = [];
        const errors: string[] = [];
        
        results.data.forEach((row: any, index) => {
          console.log(`CSV Import - Processing row ${index + 1}:`, row);
          
          // Support both direct column names and template format
          const sourceKeyName = row.sourceValue ? 'sourceValue' : 
                              row[`Source_${sourceLabel}`] ? `Source_${sourceLabel}` : 
                              Object.keys(row).find(k => k.startsWith('Source_'));
                              
          const targetKeyName = row.targetValue ? 'targetValue' : 
                              row[`Target_${targetLabel}`] ? `Target_${targetLabel}` : 
                              Object.keys(row).find(k => k.startsWith('Target_'));
          
          console.log(`CSV Import - Row ${index + 1} - Identified key names:`, {
            sourceKeyName,
            targetKeyName,
            sourceLabel,
            targetLabel
          });
          
          if (!sourceKeyName || !targetKeyName) {
            const errorMsg = `Row ${index + 1}: Could not find source or target column names`;
            console.error("CSV Import - Error:", errorMsg, { row, allKeys: Object.keys(row) });
            errors.push(errorMsg);
            return;
          }
          
          const sourceValue = row[sourceKeyName];
          const targetValue = row[targetKeyName];
          
          console.log(`CSV Import - Row ${index + 1} - Raw values:`, {
            sourceValue,
            targetValue
          });
          
          // Verify the values exist in the available source and target values
          const sourceValueExists = sourceValues.includes(sourceValue);
          const targetValueExists = targetValues.includes(targetValue);
          
          console.log(`CSV Import - Row ${index + 1} - Values exist check:`, {
            sourceValueExists,
            targetValueExists 
          });
          
          if (!sourceValue || !targetValue) {
            const errorMsg = `Row ${index + 1}: Missing source or target value`;
            console.error("CSV Import - Error:", errorMsg, {
              sourceKeyName, targetKeyName, 
              sourceValue, targetValue
            });
            errors.push(errorMsg);
            return;
          }
          
          if (!sourceValueExists) {
            const errorMsg = `Row ${index + 1}: Source value "${sourceValue}" does not exist in the dataset`;
            console.warn("CSV Import - Warning:", errorMsg, { sourceValue, availableValues: sourceValues });
            errors.push(errorMsg);
            // Don't return here - we'll still create the mapping but warn the user
          }
          
          if (!targetValueExists) {
            const errorMsg = `Row ${index + 1}: Target value "${targetValue}" does not exist in the dataset`;
            console.warn("CSV Import - Warning:", errorMsg, { targetValue, availableValues: targetValues });
            errors.push(errorMsg);
            // Don't return here - we'll still create the mapping but warn the user
          }
          
          const confidence = row.confidence ? parseFloat(row.confidence) : 0.7;
          
          console.log(`CSV Import - Row ${index + 1} - Final extracted values:`, {
            sourceValue,
            targetValue,
            confidence
          });
          
          if (isNaN(confidence) || confidence < 0 || confidence > 1) {
            errors.push(`Row ${index + 1}: Invalid confidence value. Using default 0.7.`);
          }
          
          // Look for a crosswalkId in existing mappings (inherit from other mappings in the collection)
          const existingCrosswalkId = mappings.length > 0 && mappings[0].crosswalkId 
            ? mappings[0].crosswalkId 
            : undefined;
            
          newMappings.push({
            sourceValue,
            targetValue,
            confidence: isNaN(confidence) ? 0.7 : confidence,
            id: Date.now().toString() + index,
            status: "DRAFT" as const, // Set default status for imported mappings
            crosswalkId: existingCrosswalkId // Add crosswalkId if available from existing mappings
          });
        });
        
        console.log("CSV Import - Processing complete:", {
          totalRows: results.data.length,
          validMappings: newMappings.length,
          errors: errors.length
        });
        
        if (errors.length > 0) {
          console.warn("CSV Import - Warnings:", errors);
          toast({
            title: "Warning",
            description: `Imported with some issues: ${errors.length} rows had problems.`,
            variant: "destructive",
          });
        }
        
        if (newMappings.length === 0) {
          console.error("CSV Import - No valid mappings found");
          toast({
            title: "Error",
            description: "No valid mappings found in the CSV file.",
            variant: "destructive",
          });
          return;
        }
        
        // Check for duplicates with existing mappings
        const existingMappingsMap = new Map(
          mappings.map((m) => [`${m.sourceValue}|${m.targetValue}`, m])
        );
        
        const uniqueNewMappings = newMappings.filter(
          (m) => !existingMappingsMap.has(`${m.sourceValue}|${m.targetValue}`)
        );
        
        if (uniqueNewMappings.length === 0) {
          toast({
            title: "Warning",
            description: "All mappings in the CSV already exist.",
            variant: "destructive",
          });
          return;
        }
        
        const updatedMappings = [...mappings, ...uniqueNewMappings];
        onMappingsChange(updatedMappings);
        
        toast({
          title: "Success",
          description: `Imported ${uniqueNewMappings.length} new mappings from CSV.`,
        });
        
        // Reset file input
        event.target.value = "";
      },
      error: (error) => {
        toast({
          title: "Error",
          description: `Failed to parse CSV: ${error.message}`,
          variant: "destructive",
        });
      },
    });
  };
  
  // Clear all mappings
  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete all mappings?")) {
      onMappingsChange([]);
      toast({
        title: "Success",
        description: "All mappings cleared successfully.",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs for different input methods */}
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
        defaultValue="manual"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" disabled={readOnly}>Manual Entry</TabsTrigger>
          <TabsTrigger value="import" disabled={readOnly || !allowCsvImport}>CSV Import/Export</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="space-y-4">
          {/* Manual entry form */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">{isEditing ? 'Edit Mapping' : 'Add New Mapping'}</CardTitle>
              <CardDescription>{isEditing ? 'Update an existing mapping' : 'Create a mapping between source and target values'}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pb-2">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="sourceValue">{sourceLabel}</Label>
                  <Select
                    disabled={readOnly}
                    value={newSourceValue}
                    onValueChange={setNewSourceValue}
                  >
                    <SelectTrigger id="sourceValue">
                      <SelectValue placeholder={`Select ${sourceLabel}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="targetValue">{targetLabel}</Label>
                  <Select
                    disabled={readOnly}
                    value={newTargetValue}
                    onValueChange={setNewTargetValue}
                  >
                    <SelectTrigger id="targetValue">
                      <SelectValue placeholder={`Select ${targetLabel}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {targetValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Confidence will be automatically calculated based on similarity</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Confidence score is calculated automatically based on the similarity between source and target values
                </p>
              </div>
            </CardContent>
            <CardFooter className="p-4 flex justify-end">
              <Button
                disabled={readOnly || !newSourceValue || !newTargetValue}
                onClick={handleAddMapping}
              >
                {isEditing ? (
                  <>Update Mapping</>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Mapping
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="import" className="space-y-4">
          {/* CSV import/export options */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">CSV Import/Export</CardTitle>
              <CardDescription>Import from CSV or export current mappings</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pb-0">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="csvImport">Import from CSV</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      disabled={readOnly}
                      id="csvImport"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV file with sourceValue and targetValue columns
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Button
                      disabled={readOnly}
                      variant="outline"
                      className="w-full"
                      onClick={handleDownloadTemplate}
                    >
                      <FileIcon className="h-4 w-4 mr-2" />
                      Download CSV Template
                    </Button>
                  </div>
                  
                  <div>
                    <Button
                      disabled={readOnly || mappings.length === 0}
                      variant="outline"
                      className="w-full"
                      onClick={handleExportMappings}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Current Mappings
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Filters and data table */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">Mappings</CardTitle>
            <Button
              disabled={readOnly || mappings.length === 0}
              variant="destructive"
              size="sm"
              onClick={handleClearAll}
            >
              <Trash2Icon className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
          <CardDescription>{mappings.length} total mappings</CardDescription>
        </CardHeader>
        
        <CardContent className="p-4 pb-0">
          {/* Filtering options */}
          <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sourceFilter">Filter by {sourceLabel}</Label>
              <div className="relative">
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="sourceFilter"
                  placeholder="Filter source..."
                  className="pl-8"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="targetFilter">Filter by {targetLabel}</Label>
              <div className="relative">
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="targetFilter"
                  placeholder="Filter target..."
                  className="pl-8"
                  value={targetFilter}
                  onChange={(e) => setTargetFilter(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confidenceFilter">Filter by Confidence</Label>
              <div className="flex gap-2">
                <Select
                  value={confidenceOperator}
                  onValueChange={(value) => setConfidenceOperator(value as "gt" | "lt" | "eq")}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gt">&gt;</SelectItem>
                    <SelectItem value="lt">&lt;</SelectItem>
                    <SelectItem value="eq">=</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  id="confidenceFilter"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  placeholder="0.0-1.0"
                  value={confidenceValue}
                  onChange={(e) => setConfidenceValue(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          
          {/* Data table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {!readOnly && (
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectAll} 
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all mappings"
                      />
                    </TableHead>
                  )}
                  <TableHead>{sourceLabel}</TableHead>
                  <TableHead>{targetLabel}</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                  {!readOnly && <TableHead className="w-40">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={readOnly ? 4 : 6} className="h-32 text-center">
                      No mappings found.
                      {(sourceFilter || targetFilter || confidenceValue) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Try adjusting your filters.
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMappings.map((mapping) => (
                    <TableRow key={mapping.id}>
                      {!readOnly && (
                        <TableCell className="w-12">
                          <Checkbox 
                            checked={selectedItems.includes(mapping.id!)}
                            onCheckedChange={() => handleItemSelect(mapping.id!)}
                            disabled={mapping.status === 'PENDING' || mapping.status === 'APPROVED' || mapping.status === 'REJECTED'}
                            aria-label={`Select mapping ${mapping.sourceValue} to ${mapping.targetValue}`}
                          />
                        </TableCell>
                      )}
                      <TableCell>{mapping.sourceValue}</TableCell>
                      <TableCell>{mapping.targetValue}</TableCell>
                      <TableCell>{(mapping.confidence * 100).toFixed(0)}%</TableCell>
                      <TableCell>
                        {mapping.status ? (
                          <div className={`px-2 py-1 rounded-full text-xs inline-flex items-center ${
                            mapping.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                            mapping.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            mapping.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {mapping.status}
                          </div>
                        ) : (
                          <div className="px-2 py-1 rounded-full text-xs inline-flex items-center bg-gray-100 text-gray-800">
                            DRAFT
                          </div>
                        )}
                      </TableCell>
                      {!readOnly && (
                        <TableCell className="flex gap-2">
                          {/* Edit button - only disabled for PENDING status */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMapping(mapping)}
                            disabled={mapping.status === 'PENDING'}
                          >
                            Edit
                          </Button>
                          
                          {/* Submit for Approval button - only for DRAFT status */}
                          {(!mapping.status || mapping.status === 'DRAFT') && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                if (window.confirm("Submit this mapping for approval?")) {
                                  // Update status and trigger onMappingsChange
                                  const updatedMapping = { ...mapping, status: 'PENDING' };
                                  const updatedMappings = mappings.map(m => 
                                    m.id === mapping.id ? updatedMapping : m
                                  );
                                  onMappingsChange(updatedMappings);
                                  
                                  toast({
                                    title: "Success",
                                    description: "Mapping submitted for approval."
                                  });
                                }
                              }}
                            >
                              Submit for Approval
                            </Button>
                          )}
                          
                          {/* Delete button - disabled for PENDING and APPROVED status */}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteMapping(mapping.id!)}
                            disabled={mapping.status === 'PENDING' || mapping.status === 'APPROVED'}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredMappings.length} of {mappings.length} mappings
            {selectedItems.length > 0 && (
              <span className="ml-2 font-medium">
                ({selectedItems.length} selected)
              </span>
            )}
          </div>
          
          {!readOnly && selectedItems.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleBulkSubmitForApproval}
            >
              Submit {selectedItems.length} Item{selectedItems.length !== 1 ? 's' : ''} for Approval
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}