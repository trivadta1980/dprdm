import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeftIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from "lucide-react";
import { Link } from "wouter";

// Types
interface CrosswalkMapping {
  id: number;
  name: string;
  description: string;
  sourceSystemId: number;
  targetSystemId: number;
  sourceSystemName: string;
  targetSystemName: string;
  mappingData: {
    sourceAttribute: string;
    targetAttribute: string;
    mappings: Array<{
      sourceValue: string;
      targetValue: string;
      confidence: number;
      approvalStatus?: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

interface DataSet {
  id: number;
  name: string;
  description: string;
  typeId: number;
}

// Main component
export default function CrosswalkComparisonPage() {
  const { targetDatasetId } = useParams();
  const { toast } = useToast();
  
  // State for filters and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState<string>("all");
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showOnlyConflicts, setShowOnlyConflicts] = useState(false);
  
  // Convert targetDatasetId to number
  const targetId = parseInt(targetDatasetId || "0");
  
  // Fetch target dataset information
  const { 
    data: targetDataset, 
    isLoading: isLoadingDataset,
    error: datasetError 
  } = useQuery({
    queryKey: [`/api/reference-data/${targetId}`],
    queryFn: async () => {
      const response = await fetch(`/api/reference-data/${targetId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch target dataset");
      }
      return response.json() as Promise<DataSet>;
    },
    enabled: !!targetId && targetId > 0,
  });
  
  // Fetch crosswalks that have this dataset as target
  const { 
    data: crosswalks = [], 
    isLoading: isLoadingCrosswalks,
    error: crosswalksError 
  } = useQuery({
    queryKey: [`/api/crosswalks/by-target/${targetId}`],
    queryFn: async () => {
      const response = await fetch(`/api/crosswalks/by-target/${targetId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch crosswalks");
      }
      return response.json() as Promise<CrosswalkMapping[]>;
    },
    enabled: !!targetId && targetId > 0,
  });
  
  // Process data for comparison view
  const comparisonData = useMemo(() => {
    if (!crosswalks.length) return [];
    
    // Create a map of target values to their source mappings
    const targetValueMap: Record<string, {
      targetValue: string;
      sources: Record<number, {
        sourceValue: string;
        confidence: number;
        sourceSystem: string;
        approvalStatus?: string;
        crosswalkId: number;
      }>;
    }> = {};
    
    // Loop through all crosswalks and organize by target value
    crosswalks.forEach(crosswalk => {
      crosswalk.mappingData.mappings.forEach(mapping => {
        if (!targetValueMap[mapping.targetValue]) {
          targetValueMap[mapping.targetValue] = {
            targetValue: mapping.targetValue,
            sources: {}
          };
        }
        
        targetValueMap[mapping.targetValue].sources[crosswalk.sourceSystemId] = {
          sourceValue: mapping.sourceValue,
          confidence: mapping.confidence,
          sourceSystem: crosswalk.sourceSystemName,
          approvalStatus: mapping.approvalStatus,
          crosswalkId: crosswalk.id
        };
      });
    });
    
    // Convert map to array
    return Object.values(targetValueMap);
  }, [crosswalks]);
  
  // Apply filters
  const filteredData = useMemo(() => {
    if (!comparisonData.length) return [];
    
    return comparisonData.filter(item => {
      // Apply search filter
      if (searchQuery && !item.targetValue.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Apply confidence filter
      if (confidenceFilter && confidenceFilter !== "all") {
        const minConfidence = parseInt(confidenceFilter);
        const hasLowConfidence = Object.values(item.sources).some(
          source => source.confidence < minConfidence
        );
        
        if (!hasLowConfidence) return false;
      }
      
      // Apply approval status filter
      if (approvalStatusFilter && approvalStatusFilter !== "all") {
        const hasMatchingStatus = Object.values(item.sources).some(
          source => source.approvalStatus === approvalStatusFilter
        );
        
        if (!hasMatchingStatus) return false;
      }
      
      // Apply conflicts filter
      if (showOnlyConflicts) {
        // Check if there are inconsistencies in confidence levels
        const confidenceValues = Object.values(item.sources).map(s => s.confidence);
        const hasConfidenceConflict = Math.max(...confidenceValues) - Math.min(...confidenceValues) > 20;
        
        // Check if some sources are missing
        const allSourceSystemIds = crosswalks.map(c => c.sourceSystemId);
        const mappedSourceSystemIds = Object.keys(item.sources).map(Number);
        const hasMissingSource = allSourceSystemIds.some(id => !mappedSourceSystemIds.includes(id));
        
        if (!hasConfidenceConflict && !hasMissingSource) return false;
      }
      
      return true;
    });
  }, [comparisonData, searchQuery, confidenceFilter, approvalStatusFilter, showOnlyConflicts, crosswalks]);
  
  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  // Error handling
  useEffect(() => {
    if (datasetError) {
      toast({
        title: "Error",
        description: `Failed to load dataset: ${datasetError instanceof Error ? datasetError.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
    
    if (crosswalksError) {
      toast({
        title: "Error",
        description: `Failed to load crosswalks: ${crosswalksError instanceof Error ? crosswalksError.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  }, [datasetError, crosswalksError, toast]);
  
  // Generate CSV for download
  const generateCsv = () => {
    if (!filteredData.length || !crosswalks.length) return "";
    
    // Create headers
    const sourceSystemNames = crosswalks.map(c => c.sourceSystemName);
    const headers = ["Target Value", ...sourceSystemNames, "Confidence Scores", "Issues"];
    
    // Create rows
    const rows = filteredData.map(item => {
      const sourceValues = crosswalks.map(crosswalk => {
        const sourceData = item.sources[crosswalk.sourceSystemId];
        return sourceData ? sourceData.sourceValue : "";
      });
      
      const confidenceScores = crosswalks.map(crosswalk => {
        const sourceData = item.sources[crosswalk.sourceSystemId];
        return sourceData ? sourceData.confidence.toString() : "";
      });
      
      // Identify issues
      const allSourceSystemIds = crosswalks.map(c => c.sourceSystemId);
      const mappedSourceSystemIds = Object.keys(item.sources).map(Number);
      const missingSourceSystems = allSourceSystemIds
        .filter(id => !mappedSourceSystemIds.includes(id))
        .map(id => crosswalks.find(c => c.sourceSystemId === id)?.sourceSystemName || "");
      
      const confidenceValues = Object.values(item.sources).map(s => s.confidence);
      const hasConfidenceConflict = confidenceValues.length > 1 && 
        Math.max(...confidenceValues) - Math.min(...confidenceValues) > 20;
      
      const issues = [];
      if (missingSourceSystems.length) {
        issues.push(`Missing mappings from: ${missingSourceSystems.join(", ")}`);
      }
      if (hasConfidenceConflict) {
        issues.push("Significant confidence level discrepancy");
      }
      
      return [
        item.targetValue,
        ...sourceValues,
        confidenceScores.join("|"),
        issues.join("; ")
      ];
    });
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  };
  
  const handleDownloadCsv = () => {
    const csvContent = generateCsv();
    if (!csvContent) {
      toast({
        title: "Error",
        description: "No data available to download",
        variant: "destructive",
      });
      return;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `crosswalk-comparison-${targetDataset?.name || 'data'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/reference-data">
            <Button variant="outline" size="sm" className="shadow-sm border-primary/20 rounded-full px-4">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Reference Data
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
            Crosswalk Comparison View
          </h1>
        </div>
        
        {isLoadingDataset ? (
          <Card className="shadow-md border-primary/10">
            <CardHeader>
              <Skeleton className="h-8 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ) : !targetDataset ? (
          <Card className="shadow-md border-red-200">
            <CardHeader className="bg-red-50/50">
              <CardTitle className="text-red-500">
                Dataset Not Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>The requested dataset could not be found. Please check the dataset ID and try again.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-md border-primary/10 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="text-primary">Target Dataset: {targetDataset.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {targetDataset.description || "No description available"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full shadow-sm bg-primary/5 px-3 py-1">ID: {targetDataset.id}</Badge>
                <Badge variant="outline" className="rounded-full shadow-sm bg-primary/5 px-3 py-1">Type ID: {targetDataset.typeId}</Badge>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Separator className="my-6" />
        
        {/* Filters */}
        <div className="bg-card rounded-lg border shadow-sm p-5 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-primary">Filters & Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium">Search by Target Value</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search..."
                  className="pl-9 rounded-md shadow-sm border-input/50 h-10"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confidence-filter" className="text-sm font-medium">Confidence Filter</Label>
              <Select 
                value={confidenceFilter} 
                onValueChange={(value) => {
                  setConfidenceFilter(value || "all");
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger id="confidence-filter" className="rounded-md shadow-sm border-input/50 h-10">
                  <SelectValue placeholder="Filter by confidence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Confidence Levels</SelectItem>
                  <SelectItem value="90">Less than 90%</SelectItem>
                  <SelectItem value="80">Less than 80%</SelectItem>
                  <SelectItem value="70">Less than 70%</SelectItem>
                  <SelectItem value="50">Less than 50%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-sm font-medium">Approval Status</Label>
              <Select 
                value={approvalStatusFilter} 
                onValueChange={(value) => {
                  setApprovalStatusFilter(value || "all");
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger id="status-filter" className="rounded-md shadow-sm border-input/50 h-10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING">Pending Approval</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center space-x-2 bg-muted/10 py-1 px-3 rounded-full">
              <Checkbox 
                id="show-conflicts" 
                checked={showOnlyConflicts}
                onCheckedChange={(checked) => {
                  setShowOnlyConflicts(checked === true);
                  setCurrentPage(1);
                }}
                className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <Label htmlFor="show-conflicts" className="text-sm font-medium">Show only records with inconsistencies</Label>
            </div>
            
            <div className="flex gap-3">
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[120px] rounded-md shadow-sm border-input/50 h-9">
                  <SelectValue placeholder="Items per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="20">20 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={handleDownloadCsv} className="h-9 rounded-md shadow-sm border-primary/20 bg-primary/5">
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
        
        {/* Comparison Table */}
        {isLoadingCrosswalks ? (
          <div className="space-y-6">
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-muted/30 to-muted/10 p-4 flex gap-6">
                <Skeleton className="h-14 w-[200px] rounded-md" />
                <Skeleton className="h-14 w-[200px] rounded-md" />
                <Skeleton className="h-14 w-[200px] rounded-md" />
              </div>
              <div className="p-4 space-y-4">
                <div className="flex gap-6">
                  <Skeleton className="h-10 w-[200px] rounded-md" />
                  <Skeleton className="h-10 w-[200px] rounded-md" />
                  <Skeleton className="h-10 w-[200px] rounded-md" />
                </div>
                <div className="flex gap-6">
                  <Skeleton className="h-10 w-[200px] rounded-md" />
                  <Skeleton className="h-10 w-[200px] rounded-md" />
                  <Skeleton className="h-10 w-[200px] rounded-md" />
                </div>
                <div className="flex gap-6">
                  <Skeleton className="h-10 w-[200px] rounded-md" />
                  <Skeleton className="h-10 w-[200px] rounded-md" />
                  <Skeleton className="h-10 w-[200px] rounded-md" />
                </div>
              </div>
            </div>
          </div>
        ) : crosswalks.length === 0 ? (
          <Card className="shadow-md border-primary/10 overflow-hidden">
            <CardContent className="pt-8 pb-8 text-center bg-gradient-to-b from-muted/10 to-transparent">
              <div className="max-w-md mx-auto space-y-4">
                <div className="bg-muted/20 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
                  <ChevronRightIcon className="h-8 w-8 text-primary/60" />
                </div>
                <h3 className="text-xl font-medium text-primary">No crosswalks found for this target dataset</h3>
                <p className="text-muted-foreground">
                  Create crosswalks that map to this dataset to enable comparison and data mapping.
                </p>
                <Button className="mt-4 rounded-full shadow-sm px-6" onClick={() => window.location.href = "/crosswalks"}>
                  Manage Crosswalks
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="relative overflow-hidden rounded-lg border shadow-sm">
              <Table className="bg-card">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-muted/30 to-muted/10">
                    <TableHead className="w-[200px] bg-gradient-to-r from-primary/5 to-primary/10 border-r border-primary/10 p-4">
                      <div className="font-bold text-primary text-lg">{targetDataset?.name}</div>
                      <div className="text-sm font-semibold mt-2 bg-primary/20 rounded-md px-3 py-1 inline-block shadow-sm">
                        {crosswalks[0]?.mappingData.targetAttribute}
                      </div>
                    </TableHead>
                    {crosswalks.map(crosswalk => (
                      <TableHead key={crosswalk.id} className="bg-gradient-to-b from-muted/5 to-transparent p-4">
                        <div className="font-bold text-primary">{crosswalk.name}</div>
                        <div className="text-sm font-medium text-muted-foreground mt-1">{crosswalk.sourceSystemName}</div>
                        <div className="text-sm font-semibold mt-2 bg-secondary/10 rounded-md px-3 py-1 inline-block shadow-sm">
                          {crosswalk.mappingData.sourceAttribute}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="bg-muted/20 p-4">
                      <div className="font-bold text-primary">Issues</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={crosswalks.length + 2} className="text-center p-8">
                        <div className="p-4 bg-muted/10 rounded-md">No data matches the current filters</div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((item, index) => {
                      // Identify issues
                      const allSourceSystemIds = crosswalks.map(c => c.sourceSystemId);
                      const mappedSourceSystemIds = Object.keys(item.sources).map(Number);
                      const missingSourceSystems = allSourceSystemIds
                        .filter(id => !mappedSourceSystemIds.includes(id))
                        .map(id => crosswalks.find(c => c.sourceSystemId === id)?.sourceSystemName || "");
                      
                      const confidenceValues = Object.values(item.sources).map(s => s.confidence);
                      const hasConfidenceConflict = confidenceValues.length > 1 && 
                        Math.max(...confidenceValues) - Math.min(...confidenceValues) > 20;
                      
                      return (
                        <TableRow key={`${item.targetValue}-${index}`} className={index % 2 === 0 ? "bg-card" : "bg-muted/5"}>
                          <TableCell className="border-r border-primary/5 p-4">
                            <div className="font-medium text-foreground bg-primary/10 px-3 py-2 rounded-md shadow-sm">
                              {item.targetValue}
                            </div>
                          </TableCell>
                          
                          {crosswalks.map(crosswalk => {
                            const sourceData = item.sources[crosswalk.sourceSystemId];
                            return (
                              <TableCell key={crosswalk.id} className="p-4">
                                {sourceData ? (
                                  <div className="space-y-3">
                                    <div className="bg-secondary/10 px-3 py-2 rounded-md font-medium shadow-sm">
                                      {sourceData.sourceValue}
                                    </div>
                                    <div className="flex items-center flex-wrap gap-2">
                                      <Badge variant={
                                        sourceData.confidence >= 90 ? "default" :
                                        sourceData.confidence >= 70 ? "outline" : 
                                        "destructive"
                                      } className="text-xs rounded-md px-2 py-1">
                                        {sourceData.confidence}%
                                      </Badge>
                                      
                                      {sourceData.approvalStatus && (
                                        <Badge variant={
                                          sourceData.approvalStatus === "APPROVED" ? "default" :
                                          sourceData.approvalStatus === "PENDING" ? "outline" :
                                          sourceData.approvalStatus === "REJECTED" ? "destructive" :
                                          "secondary"
                                        } className="text-xs rounded-md px-2 py-1">
                                          {sourceData.approvalStatus.toLowerCase()}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-red-50/30 rounded-md p-3 text-center shadow-sm border border-red-100">
                                    <Badge variant="outline" className="text-xs">
                                      No mapping
                                    </Badge>
                                  </div>
                                )}
                              </TableCell>
                            );
                          })}
                          
                          <TableCell className="p-4">
                            {missingSourceSystems.length > 0 && (
                              <div className="text-amber-600 text-sm mb-2 bg-amber-50/30 p-2 rounded-md">
                                <span className="font-medium">Missing from:</span> {missingSourceSystems.join(", ")}
                              </div>
                            )}
                            
                            {hasConfidenceConflict && (
                              <div className="text-red-600 text-sm bg-red-50/30 p-2 rounded-md">
                                <span className="font-medium">Inconsistent confidence levels</span>
                              </div>
                            )}
                            
                            {!missingSourceSystems.length && !hasConfidenceConflict && (
                              <div className="text-green-600 text-sm bg-green-50/30 p-2 rounded-md">
                                <span className="font-medium">No issues detected</span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 p-4 bg-card rounded-lg border shadow-sm">
                <div className="text-sm font-medium px-3 py-1 bg-muted/20 rounded-full">
                  Showing {Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)}-
                  {Math.min(filteredData.length, currentPage * itemsPerPage)} of {filteredData.length} items
                </div>
                
                <div className="flex items-center bg-muted/10 rounded-full p-1 shadow-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="rounded-full"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm font-medium px-3">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-full"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}