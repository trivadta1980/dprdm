import React, { useState, useEffect } from 'react'
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
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
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
  const [defaultConfidence, setDefaultConfidence] = useState<number>(75)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [groupByCrosswalk, setGroupByCrosswalk] = useState<boolean>(true)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      // Initialize batch items from the provided mappings
      const initialBatchItems = mappings.map(mapping => ({
        id: mapping.id,
        crosswalkId: mapping.crosswalkId,
        crosswalkName: mapping.crosswalkName || 'Unknown',
        sourceValue: mapping.sourceValue,
        targetValue: '',
        status: 'pending' as const
      }))
      
      setBatchItems(initialBatchItems)
      setDefaultConfidence(75)
      setIsSubmitting(false)
      setError(null)
      setProgress(0)
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
          const currentMapping = await apiRequest(`/api/crosswalks/${crosswalkId}`, {
            method: 'GET'
          })

          // Create new mappings to add
          const newMappings = items.map(item => ({
            sourceValue: item.sourceValue,
            targetValue: item.targetValue.trim(),
            confidence: defaultConfidence / 100, // Convert to 0-1 scale
            status: 'PENDING' // New mappings are pending by default
          }))

          // Prepare updated mapping data
          const updatedMappingData = {
            ...currentMapping.mappingData,
            mappings: [
              ...currentMapping.mappingData.mappings,
              ...newMappings
            ]
          }

          // Update the crosswalk
          await apiRequest(`/api/crosswalks/${crosswalkId}`, {
            method: 'PATCH',
            body: {
              mappingData: updatedMappingData
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
          {/* Default confidence setting */}
          <div className="flex items-center space-x-4 pb-4">
            <Label className="min-w-[150px]">Default Confidence</Label>
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Low</span>
                <span className="text-sm font-medium">{defaultConfidence}%</span>
                <span className="text-sm text-muted-foreground">High</span>
              </div>
              <Slider
                value={[defaultConfidence]}
                min={0}
                max={100}
                step={5}
                onValueChange={(value) => setDefaultConfidence(value[0])}
                disabled={isSubmitting}
              />
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
                      <Input
                        value={item.targetValue}
                        onChange={(e) => handleTargetValueChange(item.id, e.target.value)}
                        placeholder="Enter target value"
                        disabled={isSubmitting || item.status === 'success'}
                        className={
                          item.status === 'success' 
                            ? 'bg-green-50 border-green-200' 
                            : item.status === 'error' 
                              ? 'bg-red-50 border-red-200' 
                              : ''
                        }
                      />
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