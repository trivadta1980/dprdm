import React, { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { MissingMapping } from '@/hooks/use-missing-mappings'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface AddToCrosswalkDialogProps {
  isOpen: boolean
  onClose: () => void
  mapping: MissingMapping | null
  onSuccess?: () => void
}

export function AddToCrosswalkDialog({
  isOpen,
  onClose,
  mapping,
  onSuccess
}: AddToCrosswalkDialogProps) {
  const [targetValue, setTargetValue] = useState<string>('')
  const [confidence, setConfidence] = useState<number>(75)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [targetValues, setTargetValues] = useState<string[]>([])
  const [isLoadingValues, setIsLoadingValues] = useState<boolean>(false)
  const [targetSystemId, setTargetSystemId] = useState<number | null>(null)
  const { toast } = useToast()

  // Load the available target values when the dialog opens
  useEffect(() => {
    if (isOpen && mapping) {
      // Reset form state when dialog opens
      setTargetValue('')
      setConfidence(75)
      setIsSubmitting(false)
      setError(null)
      setSuccess(false)
      
      const fetchTargetValues = async () => {
        setIsLoadingValues(true)
        try {
          // First, get the crosswalk to determine the target system ID
          const crosswalk: any = await apiRequest(`/api/crosswalks/${mapping.crosswalkId}`, {
            method: 'GET'
          })
          
          // Log the entire crosswalk for debugging - this helps us see the field names
          console.log('Received crosswalk data:', crosswalk)
          
          // More robust check for targetSystemId - field could be camelCase or snake_case
          // We also need to check other potential field name variations
          const targetId = crosswalk?.targetSystemId || 
                            crosswalk?.target_system_id || 
                            crosswalk?.targetSystem || 
                            crosswalk?.target_system
          
          if (targetId && !isNaN(Number(targetId))) {
            const numericTargetId = Number(targetId)
            setTargetSystemId(numericTargetId)
            
            try {
              // Then fetch the available values from the target system
              const values = await apiRequest(`/api/reference-data/${numericTargetId}/values`, {
                method: 'GET'
              })
              
              if (Array.isArray(values) && values.length > 0) {
                setTargetValues(values)
                console.log(`Loaded ${values.length} target values for selection`)
              } else {
                // If no values, fetch the target dataset directly
                console.log('No values returned from values endpoint, trying to extract from dataset')
                const targetDataset = await apiRequest(`/api/reference-data/${numericTargetId}`, {
                  method: 'GET'
                })
                
                if (targetDataset && targetDataset.data) {
                  // Extract values from dataset instances
                  const extractedValues = new Set<string>()
                  
                  Object.values(targetDataset.data).forEach((instance: any) => {
                    // Find first non-metadata field
                    const mainFields = Object.entries(instance)
                      .filter(([key]) => !['status', '_history', 'createdAt', 'createdBy', 'lastModifiedAt', 'lastModifiedBy'].includes(key))
                    
                    if (mainFields.length > 0) {
                      const [_, value] = mainFields[0]
                      if (value && typeof value === 'string') {
                        extractedValues.add(value)
                      }
                    }
                  })
                  
                  const valueArray = Array.from(extractedValues)
                  if (valueArray.length > 0) {
                    setTargetValues(valueArray)
                    console.log(`Extracted ${valueArray.length} values directly from dataset`)
                  } else {
                    // Show that we couldn't find any values
                    setTargetValues([])
                    setError('No valid values found in target dataset')
                    console.log('No valid values found in target dataset')
                  }
                } else {
                  // Show that we couldn't find the target dataset
                  setTargetValues([])
                  setError('Target dataset not found or is empty')
                  console.log('Target dataset not found or is empty')
                }
              }
            } catch (err) {
              console.error('Error fetching target values:', err)
              setTargetValues([])
              setError('Error loading target values: ' + (err.message || 'Unknown error'))
            }
          } else {
            console.error('Missing or invalid target system ID in crosswalk:', crosswalk)
            setTargetValues([])
            setError('Missing target system in crosswalk. Please configure this crosswalk with a valid target system.')
          }
        } catch (err: any) {
          console.error('Error loading target values:', err)
          setError(err.message || 'Failed to load target values')
        } finally {
          setIsLoadingValues(false)
        }
      }
      
      fetchTargetValues()
    }
  }, [isOpen, mapping])

  if (!mapping) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!targetValue.trim()) {
      setError('Target value is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Fetch the current crosswalk mapping to get its structure
      const currentMapping: any = await apiRequest(`/api/crosswalks/${mapping.crosswalkId}`, {
        method: 'GET'
      })

      // Also fetch the source and target datasets to get the proper attributes
      // Make sure we have valid IDs before fetching
      let sourceDataset = null;
      let targetDataset = null;
      
      // Handle both camelCase and snake_case field names for sourceSystemId
      const sourceId = currentMapping.sourceSystemId || 
                        currentMapping.source_system_id || 
                        currentMapping.sourceSystem || 
                        currentMapping.source_system;
                        
      if (sourceId && !isNaN(Number(sourceId))) {
        sourceDataset = await apiRequest(`/api/reference-data/${sourceId}`, {
          method: 'GET'
        });
      } else {
        console.warn('Invalid or missing source system ID:', sourceId);
      }
      
      // Handle both camelCase and snake_case field names for targetSystemId
      const targetId = currentMapping.targetSystemId || 
                        currentMapping.target_system_id || 
                        currentMapping.targetSystem || 
                        currentMapping.target_system;
                        
      if (targetId && !isNaN(Number(targetId))) {
        targetDataset = await apiRequest(`/api/reference-data/${targetId}`, {
          method: 'GET'
        });
      } else {
        console.warn('Invalid or missing target system ID:', targetId);
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
      
      console.log('Dataset attributes detection:', {
        sourceSystemId: currentMapping.sourceSystemId,
        targetSystemId: currentMapping.targetSystemId,
        sourceAttribute,
        targetAttribute
      });

      // Prepare the updated mapping data, ensuring we handle missing structure
      const existingMappingData = currentMapping.mappingData || { 
        mappings: [],
        sourceAttribute: '',
        targetAttribute: ''
      };
      
      // If we found better attribute values from the datasets, use those
      if (sourceAttribute && !existingMappingData.sourceAttribute) {
        existingMappingData.sourceAttribute = sourceAttribute;
      } else if (!existingMappingData.sourceAttribute) {
        // Try different field name variations
        existingMappingData.sourceAttribute = currentMapping.sourceAttribute || 
                                              currentMapping.source_attribute || 
                                              '';
      }
      
      if (targetAttribute && !existingMappingData.targetAttribute) {
        existingMappingData.targetAttribute = targetAttribute;
      } else if (!existingMappingData.targetAttribute) {
        // Try different field name variations
        existingMappingData.targetAttribute = currentMapping.targetAttribute || 
                                              currentMapping.target_attribute || 
                                              '';
      }
      
      // Add extra debug logs to help identify the issue
      console.log('Crosswalk data:', {
        id: currentMapping.id,
        name: currentMapping.name,
        sourceSystemId: currentMapping.sourceSystemId || currentMapping.source_system_id,
        targetSystemId: currentMapping.targetSystemId || currentMapping.target_system_id,
        // Check all possible field name variations
        sourceAttribute: currentMapping.sourceAttribute || currentMapping.source_attribute,
        targetAttribute: currentMapping.targetAttribute || currentMapping.target_attribute,
        // Check what we're using in the mapping data
        mappingDataSourceAttr: existingMappingData.sourceAttribute,
        mappingDataTargetAttr: existingMappingData.targetAttribute
      });
      
      // Log all field names to help identify naming patterns
      console.log('All crosswalk field names:', Object.keys(currentMapping));
      
      // Console log to debug
      console.log('Current mappingData structure:', JSON.stringify(currentMapping.mappingData, null, 2));
      console.log('Existing mappings:', existingMappingData.mappings?.length || 0);
      
      // Make sure we have a valid array to work with
      const existingMappings = Array.isArray(existingMappingData.mappings) 
        ? existingMappingData.mappings 
        : [];
      
      const updatedMappingData = {
        ...existingMappingData,
        mappings: [
          ...existingMappings,
          {
            sourceValue: mapping.sourceValue,
            targetValue: targetValue.trim(),
            confidence: confidence / 100, // Convert to 0-1 scale
            status: 'PENDING' // New mappings are pending by default
          }
        ]
      }
      
      // Debug the result
      console.log('Updated mappings count:', updatedMappingData.mappings.length);

      // Update the crosswalk with the new mapping
      // Tell the server to merge our mappings with existing ones
      await apiRequest(`/api/crosswalks/${mapping.crosswalkId}`, {
        method: 'PATCH',
        data: {
          // Update mappingData with proper attribute information
          mappingData: updatedMappingData,
          // Also store attributes at the root level to ensure they're available everywhere
          sourceAttribute: existingMappingData.sourceAttribute || '',
          targetAttribute: existingMappingData.targetAttribute || '',
          mergeStrategy: 'merge' // This tells the server to merge, not replace
        }
      })

      // Show success
      setSuccess(true)
      toast({
        title: 'Mapping added',
        description: `Added mapping from "${mapping.sourceValue}" to "${targetValue.trim()}"`,
        variant: 'default'
      })

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['crosswalks'] })
      
      // Optionally delete the missing mapping since it's now mapped
      await apiRequest(`/api/missing-mappings/${mapping.id}`, {
        method: 'DELETE'
      })
      
      // Invalidate missing mappings queries
      queryClient.invalidateQueries({ queryKey: ['missing-mappings'] })
      queryClient.invalidateQueries({ queryKey: ['missing-mappings-statistics'] })

      // Close after a short delay so user can see success message
      setTimeout(() => {
        onClose()
        if (onSuccess) {
          onSuccess()
        }
      }, 1500)
    } catch (err: any) {
      console.error('Error adding mapping:', err)
      setError(err.message || 'Failed to add mapping')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Crosswalk</DialogTitle>
          <DialogDescription>
            Add a mapping for the missing value "{mapping.sourceValue}" in crosswalk "{mapping.crosswalkName}".
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Mapping was added successfully! The missing mapping record will be removed.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sourceValue" className="text-right">
                  Source Value
                </Label>
                <Input
                  id="sourceValue"
                  value={mapping.sourceValue}
                  readOnly
                  className="col-span-3 bg-muted"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetValue" className="text-right">
                  Target Value
                </Label>
                <div className="col-span-3 relative">
                  {isLoadingValues ? (
                    <div className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Loading values...</span>
                    </div>
                  ) : targetValues.length > 0 ? (
                    <Select 
                      value={targetValue} 
                      onValueChange={setTargetValue}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a target value" />
                      </SelectTrigger>
                      <SelectContent>
                        {targetValues.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="targetValue"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      className="w-full"
                      placeholder="Enter corresponding target value (no values available)"
                      autoFocus
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Confidence
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Low</span>
                    <span className="text-sm font-medium">{confidence}%</span>
                    <span className="text-sm text-muted-foreground">High</span>
                  </div>
                  <Slider
                    value={[confidence]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(value) => setConfidence(value[0])}
                  />
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="my-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !targetValue.trim()}>
                {isSubmitting ? 'Adding...' : 'Add Mapping'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}