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
import { AlertCircle, CheckCircle2 } from 'lucide-react'

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
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      // Reset form state when dialog opens
      setTargetValue('')
      setConfidence(75)
      setIsSubmitting(false)
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])

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
      const currentMapping = await apiRequest(`/api/crosswalks/${mapping.crosswalkId}`, {
        method: 'GET'
      })

      // Prepare the updated mapping data, ensuring we handle missing structure
      const existingMappingData = currentMapping.mappingData || { 
        mappings: [],
        sourceAttribute: currentMapping.sourceAttribute || '',
        targetAttribute: currentMapping.targetAttribute || ''
      };
      
      const updatedMappingData = {
        ...existingMappingData,
        mappings: [
          ...(existingMappingData.mappings || []),
          {
            sourceValue: mapping.sourceValue,
            targetValue: targetValue.trim(),
            confidence: confidence / 100, // Convert to 0-1 scale
            status: 'PENDING' // New mappings are pending by default
          }
        ]
      }

      // Update the crosswalk with the new mapping
      // The API expects data rather than body
      await apiRequest(`/api/crosswalks/${mapping.crosswalkId}`, {
        method: 'PATCH',
        data: {
          mappingData: updatedMappingData
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
                <Input
                  id="targetValue"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter corresponding target value"
                  autoFocus
                />
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