import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, History, FileText, CheckSquare, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { EventBus, dispatchApprovalStatusChange, dispatchDataUpdate, EventTypes } from "@/lib/eventBus";

interface PendingApproval {
  dataSetId: number;
  dataSetName: string;
  instanceId: string;
  instanceName: string;
  instanceType?: string;
  status: string;
  changes: any[];
  data?: Record<string, any>;
}

interface PendingRelationshipValue {
  id: number;
  relationshipId: number;
  relationshipName: string;
  sourceDatasetId: number;
  sourceDatasetName: string;
  targetDatasetId: number;
  targetDatasetName: string;
  sourceId: string;
  sourceName: string;
  targetId: string;
  targetName: string;
  status: string;
  dateSubmitted: string;
}

export default function ApprovalsDashboard() {
  const { toast } = useToast();
  const [selectedInstance, setSelectedInstance] = useState<PendingApproval | null>(null);
  const [selectedRelationshipValue, setSelectedRelationshipValue] = useState<PendingRelationshipValue | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedInstances, setSelectedInstances] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("dataset-instances");
  const [relationshipPage, setRelationshipPage] = useState(1);
  const [relationshipPageSize, setRelationshipPageSize] = useState(50);
  const [selectedRelationshipValues, setSelectedRelationshipValues] = useState<Set<number>>(new Set());
  
  // We use the useApprovalEvents hook to listen for approval events from other components
  useApprovalEvents({
    componentName: 'ApprovalsDashboard',
    onApprovalChange: (payload) => {
      console.log('[ApprovalsDashboard] Received approval event:', payload);
      // Refresh pending approvals when we receive an event about approval status changes
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      
      // Also refresh relationship values
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/relationship-values/pending"] });
      
      toast({
        title: "Data Updated",
        description: "The approval status data has been refreshed due to changes.",
        variant: "default",
      });
    }
  });

  // Dataset filter states
  const [datasetSearchTerm, setDatasetSearchTerm] = useState("");
  const [selectedDatasetType, setSelectedDatasetType] = useState("all");
  const [selectedDataset, setSelectedDataset] = useState("all");
  const [datasetDateRange, setDatasetDateRange] = useState<DateRange | undefined>();
  const [datasetPage, setDatasetPage] = useState(1);
  const [datasetPageSize, setDatasetPageSize] = useState(50);
  
  // Relationship filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRelationshipType, setSelectedRelationshipType] = useState("all");
  const [selectedSourceDataset, setSelectedSourceDataset] = useState("all");
  const [selectedTargetDataset, setSelectedTargetDataset] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Fetch relationship types for dropdown
  const { data: relationshipTypes = [] } = useQuery({
    queryKey: ["/api/relationships/types", { forDropdown: true }],
    queryFn: async () => {
      const response = await fetch("/api/relationships/types?forDropdown=true");
      if (!response.ok) {
        throw new Error("Failed to fetch relationship types");
      }
      return response.json();
    }
  });

  // Fetch reference datasets for dropdowns
  const { data: datasets = [] } = useQuery({
    queryKey: ["/api/reference-data"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch reference data types for dataset type filter
  const { data: datasetTypes = [] } = useQuery({
    queryKey: ["/api/reference-types"],
    refetchInterval: 30000, // Refetch every 30 seconds
    queryFn: async () => {
      const response = await fetch("/api/reference-types");
      if (!response.ok) {
        throw new Error("Failed to fetch reference data types");
      }
      return response.json();
    }
  });

  // Updated dataset instances query with filters and pagination
  const {
    data: datasetInstancesResponse = { data: [], metadata: { totalCount: 0, currentPage: 1, pageSize: 50, totalPages: 1 } },
    isLoading: isLoadingDatasets,
    error: datasetsError
  } = useQuery({
    queryKey: [
      "/api/approvals/pending",
      datasetPage,
      datasetPageSize,
      datasetSearchTerm,
      selectedDatasetType,
      selectedDataset,
      datasetDateRange
    ],
    refetchInterval: 10000, // Refetch every 10 seconds to keep data fresh
    queryFn: async () => {
      // If the API endpoint doesn't support these filters yet, we'll use client-side filtering
      // But we set up the query structure for future backend implementation
      const response = await fetch("/api/approvals/pending");
      if (!response.ok) {
        throw new Error("Failed to fetch pending dataset instances");
      }
      const data = await response.json();
      
      // Apply client-side filtering until backend filters are implemented
      let filteredData = data;
      
      // Filter by search term if provided
      if (datasetSearchTerm) {
        const term = datasetSearchTerm.toLowerCase();
        filteredData = filteredData.filter((item: PendingApproval) => 
          item.instanceName.toLowerCase().includes(term) || 
          item.instanceId.toLowerCase().includes(term) ||
          item.dataSetName.toLowerCase().includes(term)
        );
      }
      
      // Filter by dataset type if selected
      if (selectedDatasetType !== "all") {
        const typeId = Number(selectedDatasetType);
        filteredData = filteredData.filter((item: PendingApproval) => {
          const dataset = datasets.find((ds: any) => ds.id === item.dataSetId);
          return dataset?.typeId === typeId;
        });
      }
      
      // Filter by specific dataset if selected
      if (selectedDataset !== "all") {
        const datasetId = Number(selectedDataset);
        filteredData = filteredData.filter((item: PendingApproval) => 
          item.dataSetId === datasetId
        );
      }
      
      // Client-side pagination
      const startIndex = (datasetPage - 1) * datasetPageSize;
      const endIndex = startIndex + datasetPageSize;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      return {
        data: paginatedData,
        metadata: {
          totalCount: filteredData.length,
          currentPage: datasetPage,
          pageSize: datasetPageSize,
          totalPages: Math.ceil(filteredData.length / datasetPageSize) || 1
        }
      };
    }
  });


  // Updated relationship values query with search and filters
  const {
    data: relationshipValuesResponse = { data: [], metadata: { totalCount: 0, currentPage: 1, pageSize: 50, totalPages: 1 } },
    isLoading: isLoadingRelationships,
    error: relationshipsError
  } = useQuery({
    queryKey: [
      "/api/approvals/relationship-values/pending",
      relationshipPage,
      relationshipPageSize,
      searchTerm,
      selectedRelationshipType,
      selectedSourceDataset,
      selectedTargetDataset,
      dateRange
    ],
    refetchInterval: 10000, // Refetch every 10 seconds to keep data fresh
    queryFn: async () => {
      const params = new URLSearchParams({
        page: relationshipPage.toString(),
        pageSize: relationshipPageSize.toString(),
        ...(searchTerm && { search_term: searchTerm }),
        ...(selectedRelationshipType !== "all" && { relationship_type_id: selectedRelationshipType }),
        ...(selectedSourceDataset !== "all" && { source_dataset_id: selectedSourceDataset }),
        ...(selectedTargetDataset !== "all" && { target_dataset_id: selectedTargetDataset }),
        ...(dateRange?.from && { from_date: dateRange.from.toISOString() }),
        ...(dateRange?.to && { to_date: dateRange.to.toISOString() })
      });

      const response = await fetch(`/api/approvals/relationship-values/pending?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch relationship values");
      }
      return response.json();
    }
  });

  const relationshipMetadata = relationshipValuesResponse.metadata;

  // Dataset instance approval mutations
  const approveMutation = useMutation({
    mutationFn: async (approval: PendingApproval) => {
      const response = await apiRequest(`/api/reference-data/${approval.dataSetId}/instances/${approval.instanceId}/approve`, {
        method: "POST"
      });
      return response.json();
    },
    onSuccess: (_, approval) => {
      // Invalidate all approval-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/relationship-values/pending"] });
      
      // Also invalidate filter-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/reference-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reference-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/relationships/types", { forDropdown: true }] });
      // Also invalidate the specific dataset query - this ensures the instances page gets refreshed
      console.log(`[ApprovalsDashboard] Invalidating specific dataset query: /api/reference-data/${approval.dataSetId}`);
      queryClient.invalidateQueries({ queryKey: [`/api/reference-data/${approval.dataSetId}`] });
      
      // Dispatch event to notify other components about the approval
      dispatchApprovalStatusChange({
        dataSetId: approval.dataSetId,
        instanceIds: [approval.instanceId],
        actionType: 'approve',
        userId: undefined // Current user will be associated by backend
      });
      
      // Also dispatch data update event 
      dispatchDataUpdate(
        approval.dataSetId,
        [approval.instanceId],
        'approve'
      );
      
      toast({
        title: "Approved",
        description: "The instance has been approved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve the instance",
        variant: "destructive",
      });
    },
  });

  // Add the missing rejectMutation
  const rejectMutation = useMutation({
    mutationFn: async ({ dataSetId, instanceId }: { dataSetId: number; instanceId: string }) => {
      const response = await apiRequest(`/api/reference-data/${dataSetId}/instances/${instanceId}/reject`, {
        method: "POST"
      });
      return response.json();
    },
    onSuccess: (_, { dataSetId, instanceId }) => {
      // Invalidate all approval-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/relationship-values/pending"] });
      
      // Also invalidate the specific dataset query - this ensures the instances page gets refreshed
      console.log(`[ApprovalsDashboard] Rejecting - invalidating specific dataset query: /api/reference-data/${dataSetId}`);
      queryClient.invalidateQueries({ queryKey: [`/api/reference-data/${dataSetId}`] });
      // Also invalidate filter-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/reference-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reference-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/relationships/types", { forDropdown: true }] });
      
      // Dispatch event to notify other components about the rejection
      dispatchApprovalStatusChange({
        dataSetId,
        instanceIds: [instanceId],
        actionType: 'reject',
        userId: undefined
      });
      
      // Also dispatch data update event
      dispatchDataUpdate(
        dataSetId,
        [instanceId],
        'reject'
      );
      
      toast({
        title: "Rejected",
        description: "The instance has been rejected successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject the instance",
        variant: "destructive",
      });
    },
  });

  // Relationship value approval mutations
  const approveRelationshipMutation = useMutation({
    mutationFn: async (value: PendingRelationshipValue) => {
      const response = await apiRequest(`/api/relationships/${value.relationshipId}/values/${value.id}/approve`, {
        method: "POST"
      });
      return response.json();
    },
    onSuccess: (_, value) => {
      // Invalidate all approval-related queries and relationship values
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/relationship-values/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      
      // Also invalidate filter-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/relationships/types", { forDropdown: true }] });
      queryClient.invalidateQueries({ queryKey: ["/api/reference-data"] });
      // Since relationships connect datasets, we should invalidate both source and target datasets
      console.log(`[ApprovalsDashboard] Relationship approval - invalidating related dataset queries`);
      if (value.sourceDatasetId) {
        console.log(`[ApprovalsDashboard] Invalidating source dataset query: /api/reference-data/${value.sourceDatasetId}`);
        queryClient.invalidateQueries({ queryKey: [`/api/reference-data/${value.sourceDatasetId}`] });
      }
      if (value.targetDatasetId) {
        console.log(`[ApprovalsDashboard] Invalidating target dataset query: /api/reference-data/${value.targetDatasetId}`);
        queryClient.invalidateQueries({ queryKey: [`/api/reference-data/${value.targetDatasetId}`] });
      }
      
      // This will invalidate the specific relationship values list that the approved item belonged to
      queryClient.invalidateQueries({ queryKey: ["/api/relationships"] });
      
      // Dispatch event to notify other components about the approval
      dispatchApprovalStatusChange({
        relationshipId: value.relationshipId,
        relationshipValueIds: [value.id],
        actionType: 'approve',
        userId: undefined
      });
      
      toast({
        title: "Approved",
        description: "The relationship value has been approved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve the relationship value",
        variant: "destructive",
      });
    },
  });

      // Since relationships connect datasets, we should invalidate both source and target datasets
      console.log(`[ApprovalsDashboard] Relationship rejection - invalidating related dataset queries`);
      if (value.sourceDatasetId) {
        console.log(`[ApprovalsDashboard] Invalidating source dataset query: /api/reference-data/${value.sourceDatasetId}`);
        queryClient.invalidateQueries({ queryKey: [`/api/reference-data/${value.sourceDatasetId}`] });
      }
      if (value.targetDatasetId) {
        console.log(`[ApprovalsDashboard] Invalidating target dataset query: /api/reference-data/${value.targetDatasetId}`);
        queryClient.invalidateQueries({ queryKey: [`/api/reference-data/${value.targetDatasetId}`] });
      }
  // Rejection mutation for relationship values
  const rejectRelationshipMutation = useMutation({
    mutationFn: async (value: PendingRelationshipValue) => {
      const response = await apiRequest(`/api/relationships/${value.relationshipId}/values/${value.id}/reject`, {
        method: "POST"
      });
      return response.json();
    },
    onSuccess: (_, value) => {
      // Invalidate all approval-related queries and relationship values
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/relationship-values/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      
      // Also invalidate filter-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/relationships/types", { forDropdown: true }] });
      queryClient.invalidateQueries({ queryKey: ["/api/reference-data"] });
      
      // This will invalidate the specific relationship values list that the rejected item belonged to
      queryClient.invalidateQueries({ queryKey: ["/api/relationships"] });
      
      // Dispatch event to notify other components about the rejection
      dispatchApprovalStatusChange({
        relationshipId: value.relationshipId,
        relationshipValueIds: [value.id],
        actionType: 'reject',
        userId: undefined
      });
      
      toast({
        title: "Rejected",
        description: "The relationship value has been rejected successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject the relationship value",
        variant: "destructive",
      });
    },
  });

  // Bulk approval mutations
  const bulkApproveDatasetsMutation = useMutation({
    mutationFn: async (approvals: PendingApproval[]) => {
      const results = [];
      for (const approval of approvals) {
        const response = await apiRequest(`/api/reference-data/${approval.dataSetId}/instances/${approval.instanceId}/approve`, {
          method: "POST"
        });
        results.push(await response.json());
      }
      return results;
    },
    onSuccess: (_, approvals) => {
      // Invalidate all approval-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/relationship-values/pending"] });
      
      // Also invalidate filter-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/reference-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reference-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/relationships/types", { forDropdown: true }] });
      // Also invalidate specific dataset queries for all affected datasets
      console.log(`[ApprovalsDashboard] Bulk approval - invalidating specific dataset queries for affected datasets`);
      Object.keys(approvalsByDataset).forEach(dataSetId => {
        console.log(`[ApprovalsDashboard] Invalidating dataset query: /api/reference-data/${dataSetId}`);
        queryClient.invalidateQueries({ queryKey: [`/api/reference-data/${dataSetId}`] });
      });
      
      // Group approvals by dataset for more efficient event dispatching
      const approvalsByDataset: Record<number, string[]> = {};
      
      // Collect all instance IDs by dataset
      approvals.forEach(approval => {
        if (!approvalsByDataset[approval.dataSetId]) {
          approvalsByDataset[approval.dataSetId] = [];
        }
        approvalsByDataset[approval.dataSetId].push(approval.instanceId);
      });
      
      // Dispatch events for each dataset
      Object.entries(approvalsByDataset).forEach(([dataSetId, instanceIds]) => {
        dispatchApprovalStatusChange({
          dataSetId: Number(dataSetId),
          instanceIds,
          actionType: 'approve',
          userId: undefined
        });
        
        // Also dispatch data update event
        dispatchDataUpdate(
          Number(dataSetId),
          instanceIds,
          'approve'
        );
      });
      
      toast({
        title: "Bulk Approval Success",
        description: "Selected instances have been approved successfully.",
      });
      setSelectedInstances(new Set());
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve selected instances",
        variant: "destructive",
      });
    },
  });

  // Add bulk approve mutation for relationship values
  const bulkApproveRelationshipsMutation = useMutation({
    mutationFn: async (values: PendingRelationshipValue[]) => {
      const results = [];
      for (const value of values) {
        const response = await apiRequest(`/api/relationships/${value.relationshipId}/values/${value.id}/approve`, {
          method: "POST"
        });
        results.push(await response.json());
      }
      return results;
    },
    onSuccess: (_, values) => {
      // Invalidate all approval-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/relationship-values/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      
      // Also invalidate filter-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/relationships/types", { forDropdown: true }] });
      queryClient.invalidateQueries({ queryKey: ["/api/reference-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reference-types"] });
      
      // This will invalidate the specific relationship values lists
      queryClient.invalidateQueries({ queryKey: ["/api/relationships"] });
      
      // Group relationship values by relationship ID for more efficient event dispatching
      const valuesByRelationship: Record<number, number[]> = {};
      
      // Collect all value IDs by relationship
      values.forEach(value => {
        if (!valuesByRelationship[value.relationshipId]) {
          valuesByRelationship[value.relationshipId] = [];
        }
        valuesByRelationship[value.relationshipId].push(value.id);
      });
      
      // Dispatch events for each relationship
      Object.entries(valuesByRelationship).forEach(([relationshipId, valueIds]) => {
        dispatchApprovalStatusChange({
          relationshipId: Number(relationshipId),
          relationshipValueIds: valueIds,
          actionType: 'approve',
          userId: undefined
        });
      });
      
      toast({
        title: "Bulk Approval Success",
        description: "Selected relationship values have been approved successfully.",
      });
      setSelectedRelationshipValues(new Set());
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve selected relationship values",
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = datasetInstancesResponse.data.map(item => `${item.dataSetId}-${item.instanceId}`);
      setSelectedInstances(new Set(allIds));
    } else {
      setSelectedInstances(new Set());
    }
  };

  const handleSelectInstance = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedInstances);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedInstances(newSelected);
  };

  const handleBulkApprove = () => {
    if (selectedInstances.size === 0) {
      toast({
        title: "No Selections",
        description: "Please select instances to approve",
        variant: "destructive",
      });
      return;
    }

    const selectedApprovals = datasetInstancesResponse.data.filter(
      item => selectedInstances.has(`${item.dataSetId}-${item.instanceId}`)
    );

    bulkApproveDatasetsMutation.mutate(selectedApprovals);
  };

  const handleSelectAllRelationships = (checked: boolean) => {
    if (checked) {
      const allIds = relationshipValuesResponse.data.map(item => item.id);
      setSelectedRelationshipValues(new Set(allIds));
    } else {
      setSelectedRelationshipValues(new Set());
    }
  };

  const handleSelectRelationshipValue = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedRelationshipValues);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRelationshipValues(newSelected);
  };

  const handleBulkApproveRelationships = () => {
    if (selectedRelationshipValues.size === 0) {
      toast({
        title: "No Selections",
        description: "Please select relationship values to approve",
        variant: "destructive",
      });
      return;
    }

    const selectedValues = relationshipValuesResponse.data.filter(
      item => selectedRelationshipValues.has(item.id)
    );

    bulkApproveRelationshipsMutation.mutate(selectedValues);
  };

  if (isLoadingDatasets || isLoadingRelationships) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (datasetsError || relationshipsError) {
    return (
      <MainLayout>
        <div className="text-center py-8 text-destructive">
          Error loading approvals: {(datasetsError || relationshipsError) instanceof Error ?
            (datasetsError || relationshipsError).message : 'Unknown error'}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="dataset-instances">
                  Dataset Instances ({datasetInstancesResponse.metadata.totalCount})
                </TabsTrigger>
                <TabsTrigger value="relationship-values">
                  Relationship Values ({relationshipValuesResponse.metadata.totalCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dataset-instances">
                {/* Filter bar for dataset instances */}
                <div className="mb-4 border rounded-lg p-4 bg-background">
                  <div className="text-sm font-medium mb-2">Filter Dataset Instances</div>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search by name or ID..."
                        value={datasetSearchTerm}
                        onChange={(e) => setDatasetSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Select
                        value={selectedDatasetType}
                        onValueChange={setSelectedDatasetType}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Dataset Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {datasetTypes.map((type: any) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Select
                        value={selectedDataset}
                        onValueChange={setSelectedDataset}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Dataset" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Datasets</SelectItem>
                          {datasets.map((dataset: any) => (
                            <SelectItem key={dataset.id} value={dataset.id.toString()}>
                              {dataset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <DatePickerWithRange 
                        value={datasetDateRange}
                        onChange={setDatasetDateRange}
                      />
                    </div>
                  </div>
                </div>
                
                {datasetInstancesResponse.data.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending dataset instance approvals
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Showing {datasetInstancesResponse.data.length} of {datasetInstancesResponse.metadata.totalCount} pending approvals
                      </div>
                      <Button
                        onClick={handleBulkApprove}
                        disabled={selectedInstances.size === 0 || bulkApproveDatasetsMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {bulkApproveDatasetsMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckSquare className="h-4 w-4 mr-2" />
                        )}
                        Approve Selected ({selectedInstances.size})
                      </Button>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={selectedInstances.size === datasetInstancesResponse.data.length}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead>Dataset</TableHead>
                          <TableHead>Instance Name</TableHead>
                          <TableHead>Instance ID</TableHead>
                          <TableHead>Instance Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Changes</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {datasetInstancesResponse.data.map((item) => (
                          <TableRow key={`${item.dataSetId}-${item.instanceId}`}>
                            <TableCell>
                              <Checkbox
                                checked={selectedInstances.has(`${item.dataSetId}-${item.instanceId}`)}
                                onCheckedChange={(checked) =>
                                  handleSelectInstance(`${item.dataSetId}-${item.instanceId}`, checked)
                                }
                              />
                            </TableCell>
                            <TableCell>{item.dataSetName}</TableCell>
                            <TableCell>{item.instanceName}</TableCell>
                            <TableCell>
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <Button variant="link" className="p-0">
                                    <FileText className="h-4 w-4 mr-2" />
                                    {item.instanceId}
                                  </Button>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-96">
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="text-sm font-semibold mb-1">Instance Details</h4>
                                      <p className="text-xs text-muted-foreground">
                                        Dataset: {item.dataSetName}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Name: {item.instanceName}
                                      </p>
                                    </div>
                                    <div className="border rounded-lg p-3 bg-muted/50">
                                      <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(item.data || {})
                                          .filter(([key]) => !['_history', 'status', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(key))
                                          .map(([key, value]) => (
                                            <div key={key} className="contents">
                                              <span className="text-sm font-medium">{key}:</span>
                                              <span className="text-sm truncate">{String(value)}</span>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            </TableCell>
                            <TableCell>
                              {/* Find a type-specific field based on common field patterns */}
                              {item.data && (() => {
                                const keys = Object.keys(item.data);
                                // First check for common type field names directly
                                const commonTypeFields = [
                                  'Site_Type', 'Type', 'EntityType', 'RecordType', 
                                  'Category', 'Classification', 'ObjectType'
                                ];
                                
                                // First prioritize exact matches for common type fields
                                let typeField = keys.find(key => commonTypeFields.includes(key));
                                
                                // If no exact match, try a more flexible approach
                                if (!typeField) {
                                  typeField = keys.find(key => 
                                    key.toLowerCase().includes('type') || 
                                    key.toLowerCase().includes('category') ||
                                    key.toLowerCase().endsWith('_t')
                                  );
                                }
                                
                                return typeField ? String(item.data[typeField]) : '-';
                              })()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">Pending Approval</Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedInstance(item);
                                  setHistoryDialogOpen(true);
                                }}
                              >
                                <History className="h-4 w-4 mr-2" />
                                View History
                              </Button>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => approveMutation.mutate(item)}
                                disabled={approveMutation.isPending}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => rejectMutation.mutate({ dataSetId: item.dataSetId, instanceId: item.instanceId })}
                                disabled={rejectMutation.isPending}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="relationship-values">
                {isLoadingRelationships ? (
                  <div className="space-y-3">
                    <div className="h-8 bg-muted animate-pulse rounded" />
                    <div className="h-20 bg-muted animate-pulse rounded" />
                    <div className="h-20 bg-muted animate-pulse rounded" />
                    <div className="h-20 bg-muted animate-pulse rounded" />
                  </div>
                ) : relationshipValuesResponse.data.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending relationship value approvals
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Search and Filter Section */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by relationship name or instance ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={selectedRelationshipType}
                          onValueChange={setSelectedRelationshipType}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Relationship Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {relationshipTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={selectedSourceDataset}
                          onValueChange={setSelectedSourceDataset}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Source Dataset" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Sources</SelectItem>
                            {datasets.map((dataset) => (
                              <SelectItem key={dataset.id} value={dataset.id.toString()}>
                                {dataset.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={selectedTargetDataset}
                          onValueChange={setSelectedTargetDataset}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Target Dataset" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Targets</SelectItem>
                            {datasets.map((dataset) => (
                              <SelectItem key={dataset.id} value={dataset.id.toString()}>
                                {dataset.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <DatePickerWithRange
                          value={dateRange}
                          onChange={setDateRange}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleBulkApproveRelationships}
                        disabled={selectedRelationshipValues.size === 0 || bulkApproveRelationshipsMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {bulkApproveRelationshipsMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckSquare className="h-4 w-4 mr-2" />
                        )}
                        Approve Selected ({selectedRelationshipValues.size})
                      </Button>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={selectedRelationshipValues.size === relationshipValuesResponse.data.length}
                              onCheckedChange={handleSelectAllRelationships}
                            />
                          </TableHead>
                          <TableHead>Relationship</TableHead>
                          <TableHead>Source Instance</TableHead>
                          <TableHead>Target Instance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Changes</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relationshipValuesResponse.data.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedRelationshipValues.has(item.id)}
                                onCheckedChange={(checked) =>
                                  handleSelectRelationshipValue(item.id, checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell>{item.relationshipName}</TableCell>
                            <TableCell>
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <Button variant="link" className="p-0">
                                    <FileText className="h-4 w-4 mr-2" />
                                    {item.sourceInstanceId}
                                  </Button>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-96">
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="text-sm font-semibold mb-1">Source Instance Details</h4>
                                      <p className="text-xs text-muted-foreground">
                                        Dataset: {item.sourceDataSet.name}
                                      </p>
                                    </div>
                                    <div className="border rounded-lg p-3 bg-muted/50">
                                      <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(item.sourceDataSet.data[item.sourceInstanceId] || {})
                                          .filter(([key]) => !['_history', 'status', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(key))
                                          .map(([key, value]) => (
                                            <div key={key} className="contents">
                                              <span className="text-sm font-medium">{key}:</span>
                                              <span className="text-sm truncate">{String(value)}</span>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            </TableCell>
                            <TableCell>
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <Button variant="link" className="p-0">
                                    <FileText className="h-4 w-4 mr-2" />
                                    {item.targetInstanceId}
                                  </Button>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-96">
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="text-sm font-semibold mb-1">Target Instance Details</h4>
                                      <p className="text-xs text-muted-foreground">
                                        Dataset: {item.targetDataSet.name}
                                      </p>
                                    </div>
                                    <div className="border rounded-lg p-3 bg-muted/50">
                                      <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(item.targetDataSet.data[item.targetInstanceId] || {})
                                          .filter(([key]) => !['_history', 'status', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(key))
                                          .map(([key, value]) => (
                                            <div key={key} className="contents">
                                              <span className="text-sm font-medium">{key}:</span>
                                              <span className="text-sm truncate">{String(value)}</span>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">Pending Approval</Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRelationshipValue(item);
                                  setHistoryDialogOpen(true);
                                }}
                              >
                                <History className="h-4 w-4 mr-2" />
                                View History
                              </Button>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => approveRelationshipMutation.mutate(item)}
                                disabled={approveRelationshipMutation.isPending}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => rejectRelationshipMutation.mutate(item)}
                                disabled={rejectRelationshipMutation.isPending}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {(relationshipPage - 1) * relationshipPageSize + 1} to{" "}
                        {Math.min(relationshipPage * relationshipPageSize, relationshipMetadata.totalCount)} of{" "}
                        {relationshipMetadata.totalCount} pending approvals
                      </div>
                      <div className="flex items-center gap-4">
                        <select
                          className="text-sm border rounded-md p-1"
                          value={relationshipPageSize}
                          onChange={(e) => {
                            setRelationshipPageSize(Number(e.target.value));
                            setRelationshipPage(1);
                          }}
                        >
                          <option value="25">25 per page</option>
                          <option value="50">50 per page</option>
                          <option value="100">100 per page</option>
                        </select>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRelationshipPage(p => Math.max(1, p - 1))}
                            disabled={relationshipPage === 1}
                          >
                            Previous
                          </Button>
                          <div className="text-sm text-muted-foreground">
                            Page {relationshipPage} of {relationshipMetadata.totalPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRelationshipPage(p => Math.min(relationshipMetadata.totalPages, p + 1))}
                            disabled={relationshipPage === relationshipMetadata.totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change History</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {(selectedInstance?.history || selectedRelationshipValue?.history || []).map((entry, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                  <div className="space-y-2">
                    {entry.changes.map((change, changeIndex) => (
                      <div key={changeIndex} className="text-sm">
                        <span className="font-medium">{change.field}:</span>{" "}
                        <span className="text-destructive">{change.oldValue}</span>{" "}
                        <span className="text-muted-foreground">→</span>{" "}
                        <span className="text-primary">{change.newValue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}