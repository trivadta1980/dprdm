import React, { useState } from 'react'
import { MissingMappingsTable } from '@/components/missing-mappings/missing-mappings-table'
import { MissingMappingsStats } from '@/components/missing-mappings/missing-mappings-stats'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowUpDown, 
  BarChart3, 
  ChevronLeft, 
  Filter, 
  List, 
  RefreshCw, 
  SlidersHorizontal 
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useMissingMappings } from '@/hooks/use-missing-mappings'
import { CrosswalkMapping } from '@/types/crosswalk-types'
import { MainLayout } from '@/components/layout/main-layout'

export default function MissingMappingsPage() {
  const [selectedCrosswalkId, setSelectedCrosswalkId] = useState<number | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'latest' | 'count'>('latest');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { refetch } = useMissingMappings(selectedCrosswalkId);
  
  // Fetch all crosswalks for the filter dropdown
  const { data: crosswalks = [] } = useQuery({
    queryKey: ['/api/crosswalks'],
    queryFn: async () => {
      return apiRequest<CrosswalkMapping[]>({ url: '/api/crosswalks' });
    }
  });
  
  const handleRefresh = () => {
    refetch();
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
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
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
                  >
                    <SelectTrigger id="crosswalk">
                      <SelectValue placeholder="All Crosswalks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Crosswalks</SelectItem>
                      {Array.isArray(crosswalks) && crosswalks.length > 0 ? crosswalks.map((crosswalk) => (
                        <SelectItem key={crosswalk.id} value={crosswalk.id.toString()}>
                          {crosswalk.name}
                        </SelectItem>
                      )) : null}
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
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
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
              <div className="flex justify-between items-center mb-4">
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
                
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Advanced Options
                </Button>
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