import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  BarChart4,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  DownloadCloud,
  Eye,
  FileText,
  Filter,
  Info,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

// Types for the audit logs
interface AuditLog {
  id: number;
  timestamp: string;
  userId: number;
  username: string;
  userIp: string;
  actionType: string;
  entityType: string;
  entityId: string;
  entityName: string;
  details: string;
  changesMade: ChangeDetail[];
  sessionData?: Record<string, any>;
}

interface ChangeDetail {
  field: string;
  oldValue: string;
  newValue: string;
}

interface StatCard {
  title: string;
  value: number;
  change: number;
  icon: React.ReactNode;
}

// Filter options for the audit logs
interface FilterOptions {
  action: string;
  entity: string;
  user: string;
  startDate: string;
  endDate: string;
  searchQuery: string;
  page: number;
  pageSize: number;
}

export default function AuditLogsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [filters, setFilters] = useState<FilterOptions>({
    action: "",
    entity: "",
    user: "",
    startDate: "",
    endDate: "",
    searchQuery: "",
    page: 1,
    pageSize: 10,
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Fetch audit logs with pagination and filtering
  const {
    data: auditLogs,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["/api/audit-logs", filters],
    refetchOnWindowFocus: false,
  });

  // Fetch audit log statistics
  const { data: stats, isLoading: isLoadingStats, isError: isErrorStats } = useQuery({
    queryKey: ["/api/audit-logs/stats"],
    refetchOnWindowFocus: false,
    retry: 1,
    // Initialize with default values to prevent errors
    initialData: {
      totalActions: 0,
      userActions: 0,
      dataChanges: 0,
      systemEvents: 0,
      recentActions: []
    }
  });

  // Format the timestamp to a readable format
  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), "MMM dd, yyyy HH:mm:ss");
  };

  // Get badge variant based on action type
  const getActionBadgeVariant = (action: string | null | undefined) => {
    if (!action) return "default";
    
    switch (action.toUpperCase()) {
      case "CREATE":
        return "success";
      case "UPDATE":
        return "warning";
      case "DELETE":
        return "destructive";
      case "READ":
        return "outline";
      case "LOGIN":
        return "secondary";
      case "LOGOUT":
        return "secondary";
      case "APPROVE":
        return "success";
      case "REJECT":
        return "destructive";
      case "FEATURE_USAGE":
        return "secondary";
      case "INFO":
        return "outline";
      case "ERROR":
        return "destructive";
      case "WARNING":
        return "warning";
      default:
        return "default";
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterOptions, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      // Reset page when filters change
      ...(key !== "page" ? { page: 1 } : {}),
    }));
  };

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update filters based on tab
    if (value === "all") {
      handleFilterChange("entity", "");
    } else {
      handleFilterChange("entity", value);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      action: "",
      entity: "",
      user: "",
      startDate: "",
      endDate: "",
      searchQuery: "",
      page: 1,
      pageSize: 10,
    });
    setActiveTab("all");
  };

  // Export logs to CSV
  const exportLogs = () => {
    toast({
      title: "Export Initiated",
      description: "Your audit logs export is being prepared.",
    });
    // TODO: Implement actual export functionality
  };

  // View details of a specific log
  const viewLogDetails = (log: AuditLog) => {
    setSelectedLog(log);
  };

  // Close the details view
  const closeDetails = () => {
    setSelectedLog(null);
  };

  // Navigate to previous page
  const prevPage = () => {
    if (filters.page > 1) {
      handleFilterChange("page", filters.page - 1);
    }
  };

  // Navigate to next page
  const nextPage = () => {
    // Check if there are more pages
    if (auditLogs?.metadata?.hasNextPage) {
      handleFilterChange("page", filters.page + 1);
    }
  };

  // Get entity badge variant based on entity type
  const getEntityBadgeVariant = (entity: string | null | undefined) => {
    // Handle undefined or null entity type
    if (!entity) {
      return "default";
    }
    
    switch (entity.toUpperCase()) {
      case "USER":
        return "default";
      case "ROLE":
        return "secondary";
      case "REFERENCE_DATA":
        return "success";
      case "REFERENCE_TYPE":
        return "warning";
      case "RELATIONSHIP":
        return "destructive";
      case "CROSSWALK":
        return "outline";
      case "SYSTEM":
        return "outline";
      case "API_KEY":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <MainLayout>
      <div className="w-full h-full flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-5 gap-3 sm:gap-0 px-4 sm:px-6 py-2 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Audit Trail</h1>
            <p className="text-sm text-muted-foreground mt-1">Track all changes and activities in the system</p>
          </div>
          <div className="flex self-end sm:self-auto space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              className="flex items-center"
            >
              <DownloadCloud className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              <Filter className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{showFilters ? "Hide Filters" : "Show Filters"}</span>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {!isLoadingStats && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 px-2 sm:px-4 md:px-6">
            <StatisticCard
              title="Total Actions"
              value={stats.totalActions}
              change={5.2}
              icon={<BarChart4 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />}
            />
            <StatisticCard
              title="User Activities"
              value={stats.userActions}
              change={2.1}
              icon={<UserRound className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-sky-500" />}
            />
            <StatisticCard
              title="Data Changes"
              value={stats.dataChanges}
              change={-1.5}
              icon={<FileText className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-amber-500" />}
            />
            <StatisticCard
              title="System Events"
              value={stats.systemEvents}
              change={7.8}
              icon={<Info className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-emerald-500" />}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="w-full flex-1 px-4 mx-auto">
          <Card className="w-full h-full min-h-[600px] overflow-hidden border rounded-md shadow-sm">
            <CardHeader className="pb-3 pt-4">

              {/* Tabs for entity type filtering */}
              <div className="overflow-x-auto w-full">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="w-full max-w-none">
                    <TabsTrigger value="all">All Activities</TabsTrigger>
                    <TabsTrigger value="USER">Users</TabsTrigger>
                    <TabsTrigger value="REFERENCE_DATA">
                      <span className="hidden sm:inline">Reference Data</span>
                      <span className="inline sm:hidden">Ref Data</span>
                    </TabsTrigger>
                    <TabsTrigger value="RELATIONSHIP">
                      <span className="hidden sm:inline">Relationships</span>
                      <span className="inline sm:hidden">Relations</span>
                    </TabsTrigger>
                    <TabsTrigger value="CROSSWALK">Crosswalks</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Filter Section */}
              {showFilters && (
                <div className="space-y-3 mt-4 bg-muted/20 p-3 sm:p-4 rounded-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="action-filter" className="text-xs sm:text-sm font-medium">
                        Action Type
                      </label>
                      <Select
                        value={filters.action}
                        onValueChange={(value) => handleFilterChange("action", value)}
                      >
                        <SelectTrigger id="action-filter" className="h-8 sm:h-10">
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Actions</SelectItem>
                          <SelectItem value="CREATE">Create</SelectItem>
                          <SelectItem value="UPDATE">Update</SelectItem>
                          <SelectItem value="DELETE">Delete</SelectItem>
                          <SelectItem value="LOGIN">Login</SelectItem>
                          <SelectItem value="LOGOUT">Logout</SelectItem>
                          <SelectItem value="APPROVE">Approve</SelectItem>
                          <SelectItem value="REJECT">Reject</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="user-filter" className="text-xs sm:text-sm font-medium">
                        User
                      </label>
                      <Select
                        value={filters.user}
                        onValueChange={(value) => handleFilterChange("user", value)}
                      >
                        <SelectTrigger id="user-filter" className="h-8 sm:h-10">
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Users</SelectItem>
                          <SelectItem value="1">Administrator</SelectItem>
                          <SelectItem value="2">John Doe</SelectItem>
                          <SelectItem value="3">Jane Smith</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="date-filter" className="text-xs sm:text-sm font-medium">
                        Date Range
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          id="start-date"
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => handleFilterChange("startDate", e.target.value)}
                          placeholder="Start date"
                          className="w-full h-8 sm:h-10 text-xs sm:text-sm"
                        />
                        <Input
                          id="end-date"
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => handleFilterChange("endDate", e.target.value)}
                          placeholder="End date"
                          className="w-full h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0 sm:items-end">
                    <div className="sm:flex-1">
                      <label htmlFor="search-filter" className="text-xs sm:text-sm font-medium">
                        Search
                      </label>
                      <div className="relative mt-1">
                        <Search className="absolute left-2 top-2 sm:top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="search-filter"
                          type="text"
                          placeholder="Search logs..."
                          value={filters.searchQuery}
                          onChange={(e) => handleFilterChange("searchQuery", e.target.value)}
                          className="pl-8 h-8 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={resetFilters}
                      className="flex items-center"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0 w-full">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 w-full">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                  <span className="ml-2 text-base sm:text-lg mt-2">Loading audit logs...</span>
                </div>
              ) : isError ? (
                <div className="flex justify-center items-center py-8 sm:py-12 text-destructive text-sm sm:text-base w-full">
                  <p>Error loading audit logs. Please try again.</p>
                </div>
              ) : auditLogs?.data.length === 0 ? (
                <div className="py-8 sm:py-12 text-center text-muted-foreground w-full">
                  <FileText className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-muted-foreground/50" />
                  <p className="text-base sm:text-lg font-medium">No audit logs found</p>
                  <p className="text-xs sm:text-sm">Try adjusting your filters or check back later</p>
                </div>
              ) : (
                <div className="w-full min-w-full overflow-hidden">
                  {/* Desktop view - full table */}
                  <div className="hidden md:block w-full">
                    <Table className="w-full table-fixed">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[18%]">Timestamp</TableHead>
                          <TableHead className="w-[15%]">User</TableHead>
                          <TableHead className="w-[12%]">Action</TableHead>
                          <TableHead className="w-[15%]">Entity</TableHead>
                          <TableHead className="w-[32%]">Details</TableHead>
                          <TableHead className="w-[8%] text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs?.data.map((log: AuditLog) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                              <div className="flex items-center">
                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm">{formatTimestamp(log.timestamp)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <UserRound className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="truncate text-sm">{log.username}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getActionBadgeVariant(log.actionType)} className="text-xs">
                                {log.actionType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getEntityBadgeVariant(log.entityType)} className="text-xs">
                                {log.entityType}
                              </Badge>
                              <div className="text-xs text-muted-foreground mt-1 truncate">
                                {log.entityName}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="truncate text-sm">{log.details}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewLogDetails(log)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Mobile view - card-based layout */}
                  <div className="block md:hidden w-full">
                    <div className="divide-y w-full">
                      {auditLogs?.data.map((log: AuditLog) => (
                        <div key={log.id} className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span className="text-xs font-medium">{formatTimestamp(log.timestamp)}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={() => viewLogDetails(log)}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              <span className="text-xs">View</span>
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <p className="text-xs text-muted-foreground">User:</p>
                              <div className="flex items-center mt-1">
                                <UserRound className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-sm truncate">{log.username}</p>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-xs text-muted-foreground">Action:</p>
                              <div className="mt-1">
                                <Badge 
                                  variant={getActionBadgeVariant(log.actionType)}
                                  className="text-xs h-5"
                                >
                                  {log.actionType}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-2">
                            <p className="text-xs text-muted-foreground">Entity:</p>
                            <div className="flex flex-col mt-1">
                              <Badge 
                                variant={getEntityBadgeVariant(log.entityType)}
                                className="text-xs h-5 w-fit"
                              >
                                {log.entityType}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {log.entityName}
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs text-muted-foreground">Details:</p>
                            <p className="text-xs mt-1 line-clamp-2">{log.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t p-2 sm:p-3 gap-3 sm:gap-0">
              <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                Showing{" "}
                <span className="font-medium">
                  {auditLogs?.data.length ? (filters.page - 1) * filters.pageSize + 1 : 0}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {auditLogs?.data.length
                    ? Math.min(filters.page * filters.pageSize, auditLogs?.metadata?.total || 0)
                    : 0}
                </span>{" "}
                of{" "}
                <span className="font-medium">{auditLogs?.metadata?.total || 0}</span>{" "}
                entries
              </div>
              
              {/* Pagination controls */}
              <div className="flex flex-col xs:flex-row w-full sm:w-auto items-stretch xs:items-center space-y-3 xs:space-y-0 xs:space-x-4 order-1 sm:order-2">
                {/* Mobile view pagination */}
                <div className="flex-1 flex items-center justify-between xs:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    onClick={prevPage}
                    disabled={filters.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                  </Button>
                  
                  <span className="text-xs">
                    Page {filters.page} of {auditLogs?.metadata?.totalPages || 1}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    onClick={nextPage}
                    disabled={!auditLogs?.metadata?.hasNextPage}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                
                {/* Desktop view pagination */}
                <div className="hidden xs:flex items-center space-x-2">
                  <p className="text-xs sm:text-sm font-medium whitespace-nowrap">Rows per page</p>
                  <Select
                    value={filters.pageSize.toString()}
                    onValueChange={(value) => handleFilterChange("pageSize", parseInt(value))}
                  >
                    <SelectTrigger className="h-8 w-[60px] sm:w-[70px] text-xs sm:text-sm">
                      <SelectValue placeholder={filters.pageSize.toString()} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 20, 30, 40, 50].map((pageSize) => (
                        <SelectItem key={pageSize} value={pageSize.toString()}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="hidden xs:flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={prevPage}
                    disabled={filters.page === 1}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex w-[70px] sm:w-[100px] items-center justify-center text-xs sm:text-sm font-medium">
                    Page {filters.page} of {auditLogs?.metadata?.totalPages || 1}
                  </div>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={nextPage}
                    disabled={!auditLogs?.metadata?.hasNextPage}
                  >
                    <span className="sr-only">Go to next page</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Audit Log Details Dialog */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <CardHeader className="border-b p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-xl">Audit Log Details</CardTitle>
                  <Button variant="ghost" size="sm" onClick={closeDetails} className="h-8 px-2">
                    <X className="h-4 w-4 sm:mr-2" />
                    <span className="sr-only sm:not-sr-only">Close</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Event Information</h3>
                        <dl className="space-y-1 sm:space-y-2 text-sm">
                          <div className="flex justify-between py-1 border-b border-border/50">
                            <dt className="font-medium text-muted-foreground">ID:</dt>
                            <dd>{selectedLog.id}</dd>
                          </div>
                          <div className="flex justify-between py-1 border-b border-border/50">
                            <dt className="font-medium text-muted-foreground">Timestamp:</dt>
                            <dd className="text-right">{formatTimestamp(selectedLog.timestamp)}</dd>
                          </div>
                          <div className="flex justify-between py-1 border-b border-border/50">
                            <dt className="font-medium text-muted-foreground">Action:</dt>
                            <dd>
                              <Badge variant={getActionBadgeVariant(selectedLog.actionType)} className="text-xs h-5">
                                {selectedLog.actionType}
                              </Badge>
                            </dd>
                          </div>
                          <div className="flex justify-between py-1 border-b border-border/50">
                            <dt className="font-medium text-muted-foreground">Entity Type:</dt>
                            <dd>
                              <Badge variant={getEntityBadgeVariant(selectedLog.entityType)} className="text-xs h-5">
                                {selectedLog.entityType}
                              </Badge>
                            </dd>
                          </div>
                          <div className="flex justify-between py-1 border-b border-border/50">
                            <dt className="font-medium text-muted-foreground">Entity ID:</dt>
                            <dd>{selectedLog.entityId}</dd>
                          </div>
                          <div className="flex justify-between py-1 border-b border-border/50">
                            <dt className="font-medium text-muted-foreground">Entity Name:</dt>
                            <dd className="text-right text-xs sm:text-sm max-w-[180px] sm:max-w-none truncate">
                              {selectedLog.entityName}
                            </dd>
                          </div>
                        </dl>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4 mt-4 md:mt-0">User Information</h3>
                        <dl className="space-y-1 sm:space-y-2 text-sm">
                          <div className="flex justify-between py-1 border-b border-border/50">
                            <dt className="font-medium text-muted-foreground">User ID:</dt>
                            <dd>{selectedLog.userId}</dd>
                          </div>
                          <div className="flex justify-between py-1 border-b border-border/50">
                            <dt className="font-medium text-muted-foreground">Username:</dt>
                            <dd>{selectedLog.username}</dd>
                          </div>
                          <div className="flex justify-between py-1 border-b border-border/50">
                            <dt className="font-medium text-muted-foreground">IP Address:</dt>
                            <dd>{selectedLog.userIp}</dd>
                          </div>
                          {selectedLog.sessionData && (
                            <div className="flex justify-between py-1 border-b border-border/50">
                              <dt className="font-medium text-muted-foreground">Session ID:</dt>
                              <dd className="truncate text-right max-w-[120px] sm:max-w-[200px]">
                                {selectedLog.sessionData.id || "N/A"}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Event Details</h3>
                      <p className="text-xs sm:text-sm">{selectedLog.details}</p>
                    </div>

                    {selectedLog.changesMade && selectedLog.changesMade.length > 0 && (
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Changes Made</h3>
                          
                        {/* Desktop view for changes */}
                        <div className="hidden sm:block rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[200px]">Field</TableHead>
                                <TableHead>Previous Value</TableHead>
                                <TableHead>New Value</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedLog.changesMade.map((change, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-medium">
                                    {change.field}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {change.oldValue || "(empty)"}
                                  </TableCell>
                                  <TableCell>
                                    {change.newValue || "(empty)"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                          
                        {/* Mobile view for changes */}
                        <div className="block sm:hidden rounded-md border overflow-hidden">
                          <div className="divide-y">
                            {selectedLog.changesMade.map((change, idx) => (
                              <div key={idx} className="p-3 space-y-2">
                                <div className="font-medium text-sm">{change.field}</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Previous:</p>
                                    <div className="mt-1 bg-muted/50 p-1.5 rounded">
                                      {change.oldValue || "(empty)"}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">New:</p>
                                    <div className="mt-1 bg-muted/30 p-1.5 rounded font-medium">
                                      {change.newValue || "(empty)"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              
              <CardFooter className="border-t flex justify-end p-3 sm:p-4">
                <Button onClick={closeDetails} variant="outline" size="sm" className="w-full sm:w-auto">
                  Close
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

// Statistic Card Component
function StatisticCard({ title, value, change, icon }: StatCard) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h4 className="text-2xl font-bold">{value.toLocaleString()}</h4>
            <p className={`text-xs mt-1 flex items-center ${change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {change >= 0 ? "+" : ""}{change}%
              <span className="text-muted-foreground ml-1">vs last period</span>
            </p>
          </div>
          <div className="p-2 rounded-full bg-primary/10">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}