import React, { useState } from 'react'
import { useMissingMappings, type MissingMapping } from '@/hooks/use-missing-mappings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDistance } from 'date-fns'
import { 
  MoreHorizontal, 
  AlertTriangle, 
  Trash, 
  Filter, 
  Plus,
  Sparkles, 
  Layers 
} from 'lucide-react'
import { AddToCrosswalkDialog } from './add-to-crosswalk-dialog'
import { BatchAddDialog } from './batch-add-dialog'
import { SmartSuggestionsDialog } from './smart-suggestions-dialog'

interface MissingMappingsTableProps {
  crosswalkId?: number
  showCrosswalk?: boolean
  limit?: number
  showEmpty?: boolean
}

export const MissingMappingsTable = ({
  crosswalkId,
  showCrosswalk = true,
  limit,
  showEmpty = true,
}: MissingMappingsTableProps) => {
  const { 
    missingMappings, 
    isLoading, 
    error, 
    refetch,
    deleteMissingMapping 
  } = useMissingMappings(crosswalkId)
  
  const [selectedMapping, setSelectedMapping] = useState<MissingMapping | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showSmartSuggestionsDialog, setShowSmartSuggestionsDialog] = useState(false)
  const [showBatchAddDialog, setShowBatchAddDialog] = useState(false)
  
  // State for selecting multiple items
  const [selectedMappings, setSelectedMappings] = useState<MissingMapping[]>([])
  const [selectMode, setSelectMode] = useState(false)
  
  // If there are no mappings and we don't want to show empty state
  const mappingsArray = Array.isArray(missingMappings) ? missingMappings : []
  const dataToShow = limit ? mappingsArray.slice(0, limit) : mappingsArray
  
  // Toggle selection of a mapping
  const toggleMappingSelection = (mapping: MissingMapping) => {
    setSelectedMappings(prev => {
      const isSelected = prev.some(m => m.id === mapping.id)
      if (isSelected) {
        return prev.filter(m => m.id !== mapping.id)
      } else {
        return [...prev, mapping]
      }
    })
  }
  
  // Check if a mapping is selected
  const isMappingSelected = (id: number) => {
    return selectedMappings.some(m => m.id === id)
  }
  
  // Toggle select mode
  const toggleSelectMode = () => {
    if (selectMode) {
      // If turning off select mode, clear selections
      setSelectedMappings([])
    }
    setSelectMode(!selectMode)
  }
  
  // Handle batch action
  const handleBatchAdd = () => {
    if (selectedMappings.length > 0) {
      setShowBatchAddDialog(true)
    }
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-8 w-48" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-72" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="mr-2" /> Error Loading Missing Mappings
          </CardTitle>
          <CardDescription>
            There was an error loading the missing mappings data. Please try again later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  if (mappingsArray.length === 0 && !showEmpty) {
    return null
  }
  
  const handleDelete = () => {
    if (selectedMapping) {
      deleteMissingMapping(selectedMapping.id)
      setShowDeleteDialog(false)
      setSelectedMapping(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Missing Mappings</CardTitle>
            <CardDescription>
              Values that were requested but not found in crosswalk mappings
            </CardDescription>
          </div>
          {mappingsArray.length > 0 && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectMode}
              >
                {selectMode ? 'Cancel Selection' : 'Select Multiple'}
              </Button>
              
              {selectMode && selectedMappings.length > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleBatchAdd}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Add {selectedMappings.length} to Crosswalk
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {mappingsArray.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-3">
                <Filter className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No Missing Mappings</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                All requested values have been found in the crosswalk mappings. No missing mappings have been logged.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[450px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectMode && <TableHead className="w-[40px]"></TableHead>}
                    <TableHead>Source Value</TableHead>
                    {showCrosswalk && <TableHead>Crosswalk</TableHead>}
                    <TableHead>Requested</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Last Request</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataToShow.map((mapping) => (
                    <TableRow key={mapping.id}>
                      {selectMode && (
                        <TableCell className="pr-0 w-[40px]">
                          <Checkbox
                            checked={isMappingSelected(mapping.id)}
                            onCheckedChange={() => toggleMappingSelection(mapping)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{mapping.sourceValue}</TableCell>
                      {showCrosswalk && <TableCell>{mapping.crosswalkName}</TableCell>}
                      <TableCell>
                        {mapping.userName || 'Anonymous'}
                        {mapping.requestContext && (
                          <span className="block text-xs text-muted-foreground">
                            {mapping.requestContext}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {mapping.requestCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDistance(new Date(mapping.lastRequestedAt), new Date(), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedMapping(mapping)
                              setShowSmartSuggestionsDialog(true)
                            }}
                            title="AI Suggestions"
                          >
                            <Sparkles className="h-4 w-4 text-yellow-500" />
                            <span className="sr-only">AI Suggestions</span>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedMapping(mapping)
                              setShowAddDialog(true)
                            }}
                            title="Add to Crosswalk"
                          >
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">Add to Crosswalk</span>
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedMapping(mapping)
                                  setShowAddDialog(true)
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add to Crosswalk
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedMapping(mapping)
                                  setShowSmartSuggestionsDialog(true)
                                }}
                              >
                                <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                                Smart Suggestions
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedMapping(mapping)
                                  setShowDeleteDialog(true)
                                }}
                                className="text-destructive"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Missing Mapping</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this missing mapping for value "{selectedMapping?.sourceValue}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add to Crosswalk Dialog */}
      <AddToCrosswalkDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        mapping={selectedMapping}
        onSuccess={() => refetch()}
      />
      
      {/* Smart Suggestions Dialog */}
      <SmartSuggestionsDialog
        isOpen={showSmartSuggestionsDialog}
        onClose={() => setShowSmartSuggestionsDialog(false)}
        mapping={selectedMapping}
        onSuccess={() => refetch()}
      />
      
      {/* Batch Add Dialog */}
      <BatchAddDialog
        isOpen={showBatchAddDialog}
        onClose={() => {
          setShowBatchAddDialog(false)
          setSelectedMappings([])
          setSelectMode(false)
        }}
        mappings={selectedMappings}
        onSuccess={() => refetch()}
      />
    </>
  )
}