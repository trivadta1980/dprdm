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
  FileText,
  Filter,
  Info,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UserRound,
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
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/audit-logs/stats"],
    refetchOnWindowFocus: false,
  });

  // Format the timestamp to a readable format
  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), "MMM dd, yyyy HH:mm:ss");
  };

  // Get badge variant based on action type
  const getActionBadgeVariant = (action: string) => {
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
  const getEntityBadgeVariant = (entity: string) => {
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
      default:
        return "default";
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Audit Trail</h1>
            <p className="text-muted-foreground">
              Track and monitor all system activities and changes
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              className="flex items-center"
            >
              <DownloadCloud className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {!isLoadingStats && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatisticCard
              title="Total Actions"
              value={stats.totalActions}
              change={5.2}
              icon={<BarChart4 className="h-8 w-8 text-primary" />}
            />
            <StatisticCard
              title="User Activities"
              value={stats.userActions}
              change={2.1}
              icon={<UserRound className="h-8 w-8 text-sky-500" />}
            />
            <StatisticCard
              title="Data Changes"
              value={stats.dataChanges}
              change={-1.5}
              icon={<FileText className="h-8 w-8 text-amber-500" />}
            />
            <StatisticCard
              title="System Events"
              value={stats.systemEvents}
              change={7.8}
              icon={<Info className="h-8 w-8 text-emerald-500" />}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Audit Logs</CardTitle>
                  <CardDescription>
                    Comprehensive system activity records with {auditLogs?.metadata?.total || 0} entries
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    {showFilters ? "Hide Filters" : "Show Filters"}
                  </Button>
                </div>
              </div>

              {/* Tabs for entity type filtering */}
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mt-4">
                <TabsList className="w-full">
                  <TabsTrigger value="all">All Activities</TabsTrigger>
                  <TabsTrigger value="USER">Users</TabsTrigger>
                  <TabsTrigger value="REFERENCE_DATA">Reference Data</TabsTrigger>
                  <TabsTrigger value="RELATIONSHIP">Relationships</TabsTrigger>
                  <TabsTrigger value="CROSSWALK">Crosswalks</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Filter Section */}
              {showFilters && (
                <div className="space-y-3 mt-4 bg-muted/20 p-4 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="action-filter" className="text-sm font-medium">
                        Action Type
                      </label>
                      <Select
                        value={filters.action}
                        onValueChange={(value) => handleFilterChange("action", value)}
                      >
                        <SelectTrigger id="action-filter">
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

                    <div className="space-y-2">
                      <label htmlFor="user-filter" className="text-sm font-medium">
                        User
                      </label>
                      <Select
                        value={filters.user}
                        onValueChange={(value) => handleFilterChange("user", value)}
                      >
                        <SelectTrigger id="user-filter">
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

                    <div className="space-y-2">
                      <label htmlFor="date-filter" className="text-sm font-medium">
                        Date Range
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          id="start-date"
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => handleFilterChange("startDate", e.target.value)}
                          placeholder="Start date"
                          className="w-full"
                        />
                        <Input
                          id="end-date"
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => handleFilterChange("endDate", e.target.value)}
                          placeholder="End date"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4 items-end">
                    <div className="flex-1">
                      <label htmlFor="search-filter" className="text-sm font-medium">
                        Search
                      </label>
                      <div className="relative mt-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="search-filter"
                          type="text"
                          placeholder="Search logs..."
                          value={filters.searchQuery}
                          onChange={(e) => handleFilterChange("searchQuery", e.target.value)}
                          className="pl-8"
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

            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-lg">Loading audit logs...</span>
                </div>
              ) : isError ? (
                <div className="flex justify-center items-center py-12 text-destructive">
                  <p>Error loading audit logs. Please try again.</p>
                </div>
              ) : auditLogs?.data.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-lg font-medium">No audit logs found</p>
                  <p className="text-sm">Try adjusting your filters or check back later</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead className="max-w-[300px]">Details</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs?.data.map((log: AuditLog) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                              {formatTimestamp(log.timestamp)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <UserRound className="mr-2 h-4 w-4 text-muted-foreground" />
                              {log.username}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActionBadgeVariant(log.actionType)}>
                              {log.actionType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getEntityBadgeVariant(log.entityType)}>
                              {log.entityType}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {log.entityName}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[300px]">
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
              )}
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t p-4">
              <div className="text-sm text-muted-foreground">
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
              <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">Rows per page</p>
                  <Select
                    value={filters.pageSize.toString()}
                    onValueChange={(value) => handleFilterChange("pageSize", parseInt(value))}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
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
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={prevPage}
                    disabled={filters.page === 1}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex w-[100px] items-center justify-center text-sm font-medium">
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
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>Audit Log Details</CardTitle>
                  <Button variant="ghost" size="sm" onClick={closeDetails}>
                    <span className="sr-only">Close</span>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Event Information</h3>
                        <dl className="space-y-2">
                          <div className="flex justify-between py-1 border-b border-border/50">
                            <dt className="font-medium text-muted-foreground">ID:</dt>
                            <dd>{selectedLog.id}</dd>
                          </div>
                          <div className="flex justify-between py-1 border-b border-border/50">
                            <dt className="font-medium text-muted-foreground">Timestamp:</dt>
                            <dd>{formatTimestamp(selectedLog.timestamp)}</dd>
                          </div>
                          <div className="flex justify-between py-1 border-b border-border/50">
                            <dt className="font-medium text-muted-foreground">Action:</dt>
                            <dd>
                              <Badge variant={getActionBadgeVariant(selectedLog.actionType)}>
                                {selectedLog.actionType}
                              </Badge>
                            </dd>
                          </div>
                          <div className="flex justify-between py-1 border-b border-border/50">
                            <dt className="font-medium text-muted-foreground">Entity Type:</dt>
                            <dd>
                              <Badge variant={getEntityBadgeVariant(selectedLog.entityType)}>
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
                            <dd>{selectedLog.entityName}</dd>
                          </div>
                        </dl>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-4">User Information</h3>
                        <dl className="space-y-2">
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
                              <dd className="truncate max-w-[200px]">
                                {selectedLog.sessionData.id || "N/A"}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Event Details</h3>
                      <p className="text-sm mb-4">{selectedLog.details}</p>
                    </div>

                    {selectedLog.changesMade && selectedLog.changesMade.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Changes Made</h3>
                          <div className="rounded-md border">
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
                        </div>
                      </>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
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