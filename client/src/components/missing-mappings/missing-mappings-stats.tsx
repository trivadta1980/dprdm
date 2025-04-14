import React from 'react'
import { useMissingMappings } from '@/hooks/use-missing-mappings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Ban } from 'lucide-react'

export function MissingMappingsStats() {
  const { 
    statistics,
    isLoadingStatistics,
    statisticsError
  } = useMissingMappings()
  
  if (isLoadingStatistics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-8 w-56" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-72" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (statisticsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="mr-2" /> Error Loading Statistics
          </CardTitle>
          <CardDescription>
            There was an error loading the missing mappings statistics.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  
  if (!statistics || statistics.totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Missing Mappings Statistics</CardTitle>
          <CardDescription>
            Overview of missing crosswalk mappings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-muted p-3">
              <Ban className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No Missing Mappings</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              There are currently no missing mappings in the system.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Sort by count descending
  const sortedCounts = [...statistics.crosswalkCounts].sort((a, b) => b.count - a.count)
  const maxCount = Math.max(...sortedCounts.map(c => c.count))
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Missing Mappings Statistics</CardTitle>
        <CardDescription>
          Overview of missing crosswalk mappings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Total Missing Mappings</span>
            <span className="text-sm font-medium">{statistics.totalCount}</span>
          </div>
          
          <div className="space-y-4 mt-4">
            <h4 className="text-sm font-medium">Distribution by Crosswalk</h4>
            
            {sortedCounts.map((item) => (
              <div key={item.crosswalkId} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">{item.crosswalkName}</span>
                  <span className="text-sm text-muted-foreground">{item.count}</span>
                </div>
                <Progress value={(item.count / maxCount) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}