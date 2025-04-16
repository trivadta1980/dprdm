import React, { useState, useEffect } from 'react'
import { MissingMappingsTable } from '@/components/missing-mappings/missing-mappings-table'
import { MissingMappingsStats } from '@/components/missing-mappings/missing-mappings-stats'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertTriangle,
  ArrowUpDown, 
  BarChart3, 
  ChevronLeft, 
  Filter, 
  List,
  RefreshCw
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { useQuery } from '@tanstack/react-query'
import { useMissingMappings } from '@/hooks/use-missing-mappings'
import { MainLayout } from '@/components/layout/main-layout'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'

// Define the type for crosswalk options
interface CrosswalkOption {
  id: number;
  name: string;
  description: string | null;
}

export default function MissingMappingsPage() {
  const [selectedCrosswalkId, setSelectedCrosswalkId] = useState<number | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'latest' | 'count'>('latest');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Fetch all crosswalks for the filter dropdown with error tracking
  const { 
    data: crosswalks = [], 
    error: crosswalksError,
    refetch: refetchCrosswalks 
  } = useQuery({
    queryKey: ['crosswalks'],
    queryFn: async () => {
      try {
        console.log('Fetching crosswalks for missing mappings page');
        const response = await fetch('/api/crosswalks', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          const status = response.status;
          console.error(`Failed to fetch crosswalks with status: ${status}`);
          
          // Try to get more details about the error
          let errorDetails = '';
          try {
            const errorText = await response.text();
            errorDetails = errorText || '';
          } catch (textError) {
            console.error('Could not read error response text:', textError);
          }
          
          throw new Error(`Failed to fetch crosswalks: ${status} ${errorDetails}`);
        }
        
        const data = await response.json();
        console.log('Crosswalks response:', data);
        return data as CrosswalkOption[];
      } catch (error) {
        console.error('Error fetching crosswalks:', error);
        throw error;
      }
    }
  });
  
  // Get all missing mappings with enhanced error handling
  const { 
    missingMappings, 
    isLoading, 
    error, 
    refetch: refetchMissingMappings,
    statistics,
    isLoadingStatistics,
    statisticsError
  } = useMissingMappings(selectedCrosswalkId);
  
  // Track application state and display user feedback
  useEffect(() => {
    // Check for errors from any of our data sources
    if (error || statisticsError || crosswalksError) {
      console.error('Missing Mappings Page - Errors detected:', {
        missingMappingsError: error,
        statisticsError: statisticsError,
        crosswalksError: crosswalksError
      });
      
      // Determine the root cause - prioritizing auth errors
      const errorMessage = error?.message || statisticsError?.message || crosswalksError?.message || 'Unknown error';
      const isAuthError = errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('Unauthorized');
      
      if (isAuthError) {
        setConnectionError('Authentication error. Please try logging in again.');
      } else {
        setConnectionError(`Connection error: ${errorMessage}`);
      }
    } else {
      setConnectionError(null);
    }
  }, [error, statisticsError, crosswalksError]);
  
  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchMissingMappings();
      await refetchCrosswalks();
      
      toast({
        title: 'Data refreshed',
        description: 'The missing mappings data has been refreshed.',
      });
      setConnectionError(null);
    } catch (err) {
      console.error('Error during manual refresh:', err);
      toast({
        title: 'Refresh failed',
        description: 'Could not refresh data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="container max-w-7xl mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <a href="/crosswalks">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </a>
            </Button>
            <h1 className="text-2xl font-semibold">Missing Mappings</h1>
          </div>
          
          {/* Add refresh button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        
        {/* Display error alert when connection issues occur */}
        {connectionError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {connectionError}
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh} 
                  disabled={isRefreshing}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <MissingMappingsStats />
            
            <div className="bg-card rounded-lg border shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Filter missing mappings
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="crosswalk">Crosswalk</Label>
                  <Select 
                    value={selectedCrosswalkId?.toString() || "all"} 
                    onValueChange={(value) => setSelectedCrosswalkId(value !== "all" ? Number(value) : undefined)}
                    disabled={isLoading || isRefreshing}
                  >
                    <SelectTrigger id="crosswalk">
                      <SelectValue placeholder="All Crosswalks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Crosswalks</SelectItem>
                      {crosswalks && crosswalks.map((crosswalk: CrosswalkOption) => (
                        <SelectItem key={crosswalk.id} value={crosswalk.id.toString()}>
                          {crosswalk.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search by value..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isLoading || isRefreshing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between"
                        disabled={isLoading || isRefreshing}
                      >
                        {sortOrder === 'latest' ? 'Latest Request' : 'Request Count'}
                        <ArrowUpDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSortOrder('latest')}>
                        Latest Request
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOrder('count')}>
                        Request Count
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-3">
            <Tabs defaultValue="list" className="w-full">
              <div className="flex mb-4 justify-between">
                <TabsList>
                  <TabsTrigger value="list" className="flex items-center">
                    <List className="h-4 w-4 mr-2" />
                    List View
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Statistics
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="list" className="mt-0">
                <MissingMappingsTable 
                  crosswalkId={selectedCrosswalkId} 
                  showCrosswalk={!selectedCrosswalkId}
                />
              </TabsContent>
              
              <TabsContent value="stats" className="mt-0">
                <div className="grid gap-6">
                  <MissingMappingsStats />
                  <MissingMappingsTable 
                    crosswalkId={selectedCrosswalkId}
                    showCrosswalk={!selectedCrosswalkId}
                    limit={5}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}