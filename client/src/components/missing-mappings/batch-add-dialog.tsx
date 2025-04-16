import React, { useState, useEffect, useRef } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { MissingMapping } from '@/hooks/use-missing-mappings'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  ArrowUpDown
} from 'lucide-react'

interface BatchAddDialogProps {
  isOpen: boolean
  onClose: () => void
  mappings: MissingMapping[]
  onSuccess?: () => void
}

interface BatchItem {
  id: number
  crosswalkId: number
  crosswalkName: string
  sourceValue: string
  targetValue: string
  status: 'pending' | 'success' | 'error'
  error?: string
}

export function BatchAddDialog({
  isOpen,
  onClose,
  mappings,
  onSuccess
}: BatchAddDialogProps) {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  // Initialize with empty object and track with ref for debugging
  const [targetValuesMap, setTargetValuesMap] = useState<Record<number, string[]>>({})
  const targetValuesMapRef = useRef<Record<number, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [groupByCrosswalk, setGroupByCrosswalk] = useState<boolean>(true)
  const { toast } = useToast()
  
  // Use a fixed confidence value of 75% (0.75)
  const DEFAULT_CONFIDENCE = 0.75

  useEffect(() => {
    if (isOpen) {
      console.log('BatchAddDialog - Dialog opened with mappings:', mappings);
      
      // Initialize batch items from the provided mappings
      const initialBatchItems = mappings.map(mapping => ({
        id: mapping.id,
        crosswalkId: mapping.crosswalkId,
        crosswalkName: mapping.crosswalkName || 'Unknown',
        sourceValue: mapping.sourceValue,
        targetValue: '',
        status: 'pending' as const
      }))
      
      console.log('BatchAddDialog - Initialized batch items:', initialBatchItems);
      setBatchItems(initialBatchItems)
      setIsSubmitting(false)
      setError(null)
      setProgress(0)
      
      // Load target values for each crosswalk
      const loadTargetValuesForCrosswalks = async () => {
        const crosswalkIds = [...new Set(mappings.map(m => m.crosswalkId))]
        console.log('BatchAddDialog - Unique crosswalk IDs:', crosswalkIds);
        
        for (const crosswalkId of crosswalkIds) {
          try {
            // Get the crosswalk first to identify the target system
            const crosswalk: any = await apiRequest(`/api/crosswalks/${crosswalkId}`, {
              method: 'GET'
            })
            
            // Get target system ID using various naming patterns
            const possibleTargetSystemFields = [
              'targetSystemId', 
              'target_system_id', 
              'targetSystem', 
              'target_system', 
              'target',
              'targetId'
            ];
            
            let targetId = null;
            
            // Try all possible field names
            for (const field of possibleTargetSystemFields) {
              if (crosswalk && crosswalk[field] !== undefined && crosswalk[field] !== null) {
                targetId = crosswalk[field];
                console.log(`Found target system ID in field ${field}:`, targetId);
                break;
              }
            }
            
            // Also check if the target system ID is contained in mappingData
            if (targetId === null && crosswalk?.mappingData) {
              for (const field of possibleTargetSystemFields) {
                if (crosswalk.mappingData[field] !== undefined && crosswalk.mappingData[field] !== null) {
                  targetId = crosswalk.mappingData[field];
                  console.log(`Found target system ID in mappingData.${field}:`, targetId);
                  break;
                }
              }
            }
            
            if (targetId && !isNaN(Number(targetId))) {
              const numericTargetId = Number(targetId)
              console.log(`Successfully identified target system ID ${numericTargetId} for crosswalk ${crosswalkId}`)
              
              try {
                // First try the values endpoint
                console.log(`Fetching values from /api/reference-data/${numericTargetId}/values`)
                const values = await apiRequest(`/api/reference-data/${numericTargetId}/values`, {
                  method: 'GET'
                })
                console.log(`Received values from endpoint:`, values)
                
                if (Array.isArray(values) && values.length > 0) {
                  console.log(`Target values for crosswalk ${crosswalkId}:`, values);
                  
                  // Create a new state object with these values
                  const newTargetValuesMap = {
                    ...targetValuesMap,
                    [crosswalkId]: values
                  };
                  
                  console.log(`Updated target values map:`, newTargetValuesMap);
                  
                  // Update both state and ref
                  setTargetValuesMap(newTargetValuesMap);
                  targetValuesMapRef.current = newTargetValuesMap;
                  
                  console.log(`Loaded ${values.length} target values for crosswalk ${crosswalkId}`);
                  console.log(`Updated targetValuesMapRef:`, targetValuesMapRef.current);
                  
                  // Also check if the state was set correctly after a short delay
                  setTimeout(() => {
                    console.log(`Current targetValuesMap after update (setTimeout):`, targetValuesMap);
                    console.log(`Current targetValuesMapRef after update (setTimeout):`, targetValuesMapRef.current);
                  }, 500);
                } else {
                  // If values endpoint doesn't work, try to extract from the dataset directly
                  const dataset = await apiRequest(`/api/reference-data/${numericTargetId}`, {
                    method: 'GET'
                  })
                  
                  // Try to extract values from dataset
                  const extractedValues = new Set<string>()
                  
                  // Try both data formats (dataContent and data)
                  if (dataset.dataContent) {
                    Object.values(dataset.dataContent).forEach((instance: any) => {
                      const mainFields = Object.entries(instance)
                        .filter(([key]) => !['status', '_history', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(key))
                      
                      if (mainFields.length > 0) {
                        const [_, value] = mainFields[0]
                        if (value && typeof value === 'string') {
                          extractedValues.add(value)
                        }
                      }
                    })
                  } else if (dataset.data) {
                    Object.values(dataset.data).forEach((instance: any) => {
                      const mainFields = Object.entries(instance)
                        .filter(([key]) => !['status', '_history', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(key))
                      
                      if (mainFields.length > 0) {
                        const [_, value] = mainFields[0]
                        if (value && typeof value === 'string') {
                          extractedValues.add(value)
                        }
                      }
                    })
                  }
                  
                  if (extractedValues.size > 0) {
                    const valueArray = Array.from(extractedValues)
                    // Update both state and ref
                    const newTargetValuesMap = {
                      ...targetValuesMapRef.current,
                      [crosswalkId]: valueArray
                    }
                    setTargetValuesMap(newTargetValuesMap)
                    targetValuesMapRef.current = newTargetValuesMap
                    console.log(`Extracted ${valueArray.length} values from dataset for crosswalk ${crosswalkId}`)
                    console.log(`Updated targetValuesMapRef with extracted values:`, targetValuesMapRef.current)
                  } else {
                    console.warn(`No values found for crosswalk ${crosswalkId} in target system ${numericTargetId}`)
                  }
                }
              } catch (err) {
                console.error(`Error loading target values for crosswalk ${crosswalkId}:`, err)
              }
            } else {
              console.warn(`Invalid target system ID for crosswalk ${crosswalkId}:`, targetId)
            }
          } catch (err) {
            console.error(`Error loading crosswalk ${crosswalkId}:`, err)
          }
        }
      }
      
      loadTargetValuesForCrosswalks()
    }
  }, [isOpen, mappings])

  const handleTargetValueChange = (id: number, value: string) => {
    setBatchItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, targetValue: value } : item
      )
    )
  }

  const handleSubmit = async () => {
    // Validate that all items have target values
    const invalidItems = batchItems.filter(item => !item.targetValue.trim())
    if (invalidItems.length > 0) {
      setError('All target values must be filled in before submitting')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setProgress(0)

    try {
      // Group the items by crosswalkId for efficient processing
      const itemsByCrosswalk = batchItems.reduce<Record<number, BatchItem[]>>(
        (acc, item) => {
          acc[item.crosswalkId] = acc[item.crosswalkId] || []
          acc[item.crosswalkId].push(item)
          return acc
        }, 
        {}
      )

      const crosswalkIds = Object.keys(itemsByCrosswalk).map(Number)
      const totalCrosswalks = crosswalkIds.length

      // Process each crosswalk
      let processedCount = 0
      let successCount = 0
      let errorCount = 0

      for (const crosswalkId of crosswalkIds) {
        const items = itemsByCrosswalk[crosswalkId]
        
        try {
          // Fetch current crosswalk mapping
          const currentMapping: any = await apiRequest(`/api/crosswalks/${crosswalkId}`, {
            method: 'GET'
          })

          // Create new mappings to add
          const newMappings = items.map(item => ({
            sourceValue: item.sourceValue,
            targetValue: item.targetValue.trim(),
            confidence: DEFAULT_CONFIDENCE, // Using fixed 75% confidence
            status: 'PENDING' // New mappings are pending by default
          }))

          // Also fetch the source and target datasets to get the proper attributes
          // Make sure we have valid IDs before fetching
          let sourceDataset = null;
          let targetDataset = null;
          
          if (currentMapping.sourceSystemId && !isNaN(Number(currentMapping.sourceSystemId))) {
            sourceDataset = await apiRequest(`/api/reference-data/${currentMapping.sourceSystemId}`, {
              method: 'GET'
            });
          } else {
            console.warn(`Crosswalk ${crosswalkId} - Invalid or missing sourceSystemId:`, currentMapping.sourceSystemId);
          }
          
          if (currentMapping.targetSystemId && !isNaN(Number(currentMapping.targetSystemId))) {
            targetDataset = await apiRequest(`/api/reference-data/${currentMapping.targetSystemId}`, {
              method: 'GET'
            });
          } else {
            console.warn(`Crosswalk ${crosswalkId} - Invalid or missing targetSystemId:`, currentMapping.targetSystemId);
          }
          
          // Get the first schema from each dataset to determine attribute names
          // Look for fields that aren't special fields like status, _history, etc.
          let sourceAttribute = '';
          let targetAttribute = '';
          
          if (sourceDataset && sourceDataset.data) {
            const firstInstance = Object.values(sourceDataset.data)[0] as any;
            if (firstInstance) {
              // Find keys that are likely to be the main attribute (not metadata fields)
              const possibleKeys = Object.keys(firstInstance).filter(
                k => !['status', '_history', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(k)
              );
              if (possibleKeys.length > 0) {
                sourceAttribute = possibleKeys[0]; // Take the first attribute
              }
            }
          }
          
          if (targetDataset && targetDataset.data) {
            const firstInstance = Object.values(targetDataset.data)[0] as any;
            if (firstInstance) {
              // Find keys that are likely to be the main attribute (not metadata fields)
              const possibleKeys = Object.keys(firstInstance).filter(
                k => !['status', '_history', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(k)
              );
              if (possibleKeys.length > 0) {
                targetAttribute = possibleKeys[0]; // Take the first attribute
              }
            }
          }
          
          console.log(`Crosswalk ${crosswalkId} - Dataset attributes detection:`, {
            sourceSystemId: currentMapping.sourceSystemId,
            targetSystemId: currentMapping.targetSystemId,
            sourceAttribute,
            targetAttribute
          });
          
          // Debug the entire crosswalk object
          console.log(`Full crosswalk object for ${crosswalkId}:`, JSON.stringify(currentMapping, null, 2));

          // Prepare updated mapping data, ensuring we properly handle missing structure
          const existingMappingData = currentMapping.mappingData || { 
            mappings: [],
            sourceAttribute: '',
            targetAttribute: ''
          };
          
          // If we found better attribute values from the datasets, use those
          if (sourceAttribute && !existingMappingData.sourceAttribute) {
            existingMappingData.sourceAttribute = sourceAttribute;
          } else if (!existingMappingData.sourceAttribute) {
            existingMappingData.sourceAttribute = currentMapping.sourceAttribute || '';
          }
          
          if (targetAttribute && !existingMappingData.targetAttribute) {
            existingMappingData.targetAttribute = targetAttribute;
          } else if (!existingMappingData.targetAttribute) {
            existingMappingData.targetAttribute = currentMapping.targetAttribute || '';
          }
          
          // Add extra debug logs to help identify the issue
          console.log(`Crosswalk ${crosswalkId} - Data:`, {
            id: currentMapping.id,
            name: currentMapping.name,
            sourceAttribute: currentMapping.sourceAttribute,
            targetAttribute: currentMapping.targetAttribute,
            mappingDataSourceAttr: existingMappingData.sourceAttribute,
            mappingDataTargetAttr: existingMappingData.targetAttribute
          });
          
          // Console log to debug
          console.log(`Crosswalk ${crosswalkId} - Current mappingData:`, JSON.stringify(currentMapping.mappingData, null, 2));
          console.log(`Crosswalk ${crosswalkId} - Existing mappings:`, existingMappingData.mappings?.length || 0);
          
          // Make sure we have a valid array to work with
          const existingMappings = Array.isArray(existingMappingData.mappings) 
            ? existingMappingData.mappings 
            : [];
          
          // Prepare updated mapping data
          const updatedMappingData = {
            ...existingMappingData,
            mappings: [
              ...existingMappings,
              ...newMappings
            ]
          }
          
          // Debug the result
          console.log(`Crosswalk ${crosswalkId} - Updated mappings count:`, updatedMappingData.mappings.length);

          // Update the crosswalk - using data instead of body parameter
          // Tell the server to merge our mappings with existing ones
          await apiRequest(`/api/crosswalks/${crosswalkId}`, {
            method: 'PATCH',
            data: {
              // Include mappingData with proper values
              mappingData: updatedMappingData,
              // Also store attributes at root level to ensure they're available everywhere
              sourceAttribute: existingMappingData.sourceAttribute || '',
              targetAttribute: existingMappingData.targetAttribute || '',
              mergeStrategy: 'merge' // This tells the server to merge, not replace
            }
          })

          // Mark items as successful
          setBatchItems(prevItems => 
            prevItems.map(item => 
              item.crosswalkId === crosswalkId 
                ? { ...item, status: 'success' } 
                : item
            )
          )

          successCount += items.length
        } catch (err: any) {
          console.error(`Error updating crosswalk ${crosswalkId}:`, err)
          
          // Mark items as failed
          setBatchItems(prevItems => 
            prevItems.map(item => 
              item.crosswalkId === crosswalkId 
                ? { ...item, status: 'error', error: err.message || 'Failed to update crosswalk' } 
                : item
            )
          )

          errorCount += items.length
        }

        processedCount++
        setProgress(Math.round((processedCount / totalCrosswalks) * 100))
      }

      // Delete all successfully added missing mappings
      const successfulIds = batchItems
        .filter(item => item.status === 'success')
        .map(item => item.id)

      if (successfulIds.length > 0) {
        // Delete each missing mapping individually
        for (const id of successfulIds) {
          try {
            await apiRequest(`/api/missing-mappings/${id}`, {
              method: 'DELETE'
            })
          } catch (err) {
            console.error(`Error deleting missing mapping ${id}:`, err)
          }
        }
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['crosswalks'] })
      queryClient.invalidateQueries({ queryKey: ['missing-mappings'] })
      queryClient.invalidateQueries({ queryKey: ['missing-mappings-statistics'] })

      // Show toast with results
      toast({
        title: 'Batch update complete',
        description: `Added ${successCount} mappings. ${errorCount > 0 ? `${errorCount} failed.` : ''}`,
        variant: errorCount > 0 ? 'destructive' : 'default'
      })

      // If everything was successful, close the dialog after a short delay
      if (errorCount === 0) {
        setTimeout(() => {
          onClose()
          if (onSuccess) {
            onSuccess()
          }
        }, 1500)
      }
    } catch (err: any) {
      console.error('Error in batch update:', err)
      setError(err.message || 'Failed to process batch update')
    } finally {
      setIsSubmitting(false)
      setProgress(100)
    }
  }

  // Function to sort and potentially group items
  const displayItems = () => {
    if (groupByCrosswalk) {
      return [...batchItems].sort((a, b) => 
        a.crosswalkName.localeCompare(b.crosswalkName) || 
        a.sourceValue.localeCompare(b.sourceValue)
      )
    } else {
      return [...batchItems].sort((a, b) => 
        a.sourceValue.localeCompare(b.sourceValue)
      )
    }
  }

  const areAllValid = batchItems.every(item => item.targetValue.trim() !== '')
  const sortedItems = displayItems()

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => !isSubmitting && !open && onClose()}
      className="max-w-4xl"
    >
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Batch Add to Crosswalks</DialogTitle>
          <DialogDescription>
            Add mappings for {batchItems.length} missing values to their respective crosswalks.
            Enter the target values for each source value.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Fixed confidence info - 75% */}
          <div className="flex items-center space-x-4 pb-4">
            <Label className="min-w-[150px]">Default Confidence</Label>
            <div className="w-full">
              <span className="text-sm text-muted-foreground">Using fixed confidence value of 75% for all mappings</span>
            </div>
          </div>

          {/* Progress indicator when submitting */}
          {isSubmitting && (
            <div className="space-y-2 py-2">
              <div className="flex justify-between">
                <span className="text-sm">Processing crosswalks...</span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Display errors if any */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Table controls */}
          <div className="flex justify-between items-center">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setGroupByCrosswalk(!groupByCrosswalk)}
              disabled={isSubmitting}
              className="flex items-center"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {groupByCrosswalk ? 'Sort by value' : 'Group by crosswalk'}
            </Button>
            <span className="text-sm text-muted-foreground">
              {batchItems.length} items
            </span>
          </div>

          {/* Table of values to map */}
          <ScrollArea className="h-[400px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Crosswalk</TableHead>
                  <TableHead className="w-[200px]">Source Value</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Target Value</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.crosswalkName}</TableCell>
                    <TableCell>{item.sourceValue}</TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.targetValue}
                        onValueChange={(value) => handleTargetValueChange(item.id, value)}
                        disabled={isSubmitting || item.status === 'success'}
                      >
                        <SelectTrigger className={
                          item.status === 'success' 
                            ? 'bg-green-50 border-green-200' 
                            : item.status === 'error' 
                              ? 'bg-red-50 border-red-200' 
                              : ''
                        }>
                          <SelectValue placeholder="Select target value" />
                        </SelectTrigger>
                        <SelectContent>
                          {targetValuesMapRef.current[item.crosswalkId] && targetValuesMapRef.current[item.crosswalkId].length > 0 ? (
                            // Map each value to a SelectItem, ensuring we handle empty strings
                            targetValuesMapRef.current[item.crosswalkId].map((value) => {
                              // Log each value to debug
                              console.log(`Rendering SelectItem for value "${value}" in crosswalk ${item.crosswalkId}`);
                              
                              // Make sure value is never empty
                              const itemValue = value || "placeholder_empty_value";
                              const displayValue = value || "[Empty Value]";
                              
                              return (
                                <SelectItem key={itemValue} value={itemValue}>
                                  {displayValue}
                                </SelectItem>
                              );
                            })
                          ) : (
                            // Show message when no values are available
                            <SelectItem value="no_values_available" disabled>
                              No target values available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {item.status === 'pending' ? (
                        <Badge variant="outline">Pending</Badge>
                      ) : item.status === 'success' ? (
                        <Badge variant="success">Added</Badge>
                      ) : (
                        <Badge variant="destructive">Error</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !areAllValid}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Add ${batchItems.length} Mappings`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}