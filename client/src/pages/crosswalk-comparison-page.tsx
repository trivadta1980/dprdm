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
        <div className="flex items-center gap-4">
          <Link href="/reference-data">
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Reference Data
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold tracking-tight">
            Crosswalk Comparison View
          </h1>
        </div>
        
        {isLoadingDataset ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ) : !targetDataset ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-500">
                Dataset Not Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>The requested dataset could not be found. Please check the dataset ID and try again.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Target Dataset: {targetDataset.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {targetDataset.description || "No description available"}
              </p>
              <p className="mt-2">
                <Badge variant="outline">ID: {targetDataset.id}</Badge>
                <Badge variant="outline" className="ml-2">Type ID: {targetDataset.typeId}</Badge>
              </p>
            </CardContent>
          </Card>
        )}
        
        <Separator />
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search by Target Value</Label>
            <div className="relative">
              <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confidence-filter">Confidence Filter</Label>
            <Select 
              value={confidenceFilter} 
              onValueChange={(value) => {
                setConfidenceFilter(value || "all");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger id="confidence-filter">
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
            <Label htmlFor="status-filter">Approval Status</Label>
            <Select 
              value={approvalStatusFilter} 
              onValueChange={(value) => {
                setApprovalStatusFilter(value || "all");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger id="status-filter">
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
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-conflicts" 
              checked={showOnlyConflicts}
              onCheckedChange={(checked) => {
                setShowOnlyConflicts(checked === true);
                setCurrentPage(1);
              }} 
            />
            <Label htmlFor="show-conflicts">Show only records with inconsistencies</Label>
          </div>
          
          <div className="flex gap-2">
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 rows</SelectItem>
                <SelectItem value="20">20 rows</SelectItem>
                <SelectItem value="50">50 rows</SelectItem>
                <SelectItem value="100">100 rows</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={handleDownloadCsv}>
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
        
        {/* Comparison Table */}
        {isLoadingCrosswalks ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : crosswalks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p>No crosswalks found for this target dataset.</p>
              <p className="text-muted-foreground mt-2">
                Create crosswalks that map to this dataset to enable comparison.
              </p>
              <Button className="mt-4" onClick={() => window.location.href = "/crosswalks"}>
                Manage Crosswalks
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Target Value</TableHead>
                  {crosswalks.map(crosswalk => (
                    <TableHead key={crosswalk.id}>
                      {crosswalk.sourceSystemName}
                      <div className="text-xs text-muted-foreground">
                        {crosswalk.mappingData.sourceAttribute}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead>Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={crosswalks.length + 2} className="text-center">
                      No data matches the current filters
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
                      <TableRow key={`${item.targetValue}-${index}`}>
                        <TableCell className="font-medium">
                          {item.targetValue}
                        </TableCell>
                        
                        {crosswalks.map(crosswalk => {
                          const sourceData = item.sources[crosswalk.sourceSystemId];
                          return (
                            <TableCell key={crosswalk.id}>
                              {sourceData ? (
                                <div>
                                  <div>
                                    {sourceData.sourceValue}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={
                                      sourceData.confidence >= 90 ? "default" :
                                      sourceData.confidence >= 70 ? "outline" : 
                                      "destructive"
                                    } className="text-xs">
                                      {sourceData.confidence}%
                                    </Badge>
                                    
                                    {sourceData.approvalStatus && (
                                      <Badge variant={
                                        sourceData.approvalStatus === "APPROVED" ? "default" :
                                        sourceData.approvalStatus === "PENDING" ? "outline" :
                                        sourceData.approvalStatus === "REJECTED" ? "destructive" :
                                        "secondary"
                                      } className="text-xs">
                                        {sourceData.approvalStatus.toLowerCase()}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-red-50">
                                  No mapping
                                </Badge>
                              )}
                            </TableCell>
                          );
                        })}
                        
                        <TableCell>
                          {missingSourceSystems.length > 0 && (
                            <div className="text-amber-600 text-sm mb-1">
                              Missing from: {missingSourceSystems.join(", ")}
                            </div>
                          )}
                          
                          {hasConfidenceConflict && (
                            <div className="text-red-600 text-sm">
                              Inconsistent confidence levels
                            </div>
                          )}
                          
                          {!missingSourceSystems.length && !hasConfidenceConflict && (
                            <div className="text-green-600 text-sm">No issues detected</div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)}-
                  {Math.min(filteredData.length, currentPage * itemsPerPage)} of {filteredData.length} items
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
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