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
import { useToast } from '@/hooks/use-toast'
import { Checkbox } from '@/components/ui/checkbox'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { MissingMapping } from '@/hooks/use-missing-mappings'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  AlertCircle, 
  ThumbsUp, 
  ThumbsDown,
  Loader2,
  Sparkles,
  Brain,
  Check,
  RotateCcw
} from 'lucide-react'

interface SmartSuggestionsDialogProps {
  isOpen: boolean
  onClose: () => void
  mapping: MissingMapping | null
  onSuccess?: () => void
}

interface Suggestion {
  value: string
  confidence: number
  selected: boolean
}

export function SmartSuggestionsDialog({
  isOpen,
  onClose,
  mapping,
  onSuccess
}: SmartSuggestionsDialogProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && mapping) {
      // Reset state
      setSuggestions([])
      setIsGenerating(false)
      setIsSubmitting(false)
      setError(null)
      setSuccess(false)
      setProgress(0)
      
      // Start generating suggestions
      generateSuggestions()
    }
  }, [isOpen, mapping])

  const generateSuggestions = async () => {
    if (!mapping) return
    
    setIsGenerating(true)
    setError(null)
    
    try {
      // Simulate an API call to generate suggestions
      // In a real implementation, this would be a call to a suggestion service
      // that analyzes existing mappings and source/target patterns

      // First, fetch the crosswalk to get existing mappings
      const crosswalk = await apiRequest(`/api/crosswalks/${mapping.crosswalkId}`, {
        method: 'GET'
      })
      
      // Update progress to show activity
      setProgress(30)
      
      // Get existing mappings to analyze patterns
      const existingMappingData = crosswalk.mappingData || { mappings: [] }
      const existingMappings = existingMappingData.mappings || []
      
      // Create a basic suggestion generator based on existing patterns
      // This is a simple implementation; a real system would use more sophisticated algorithms
      const generatedSuggestions: Suggestion[] = await generateSuggestionsFromPatterns(
        mapping.sourceValue,
        existingMappings
      )
      
      setProgress(100)
      
      // If we couldn't generate any suggestions, show a message
      if (generatedSuggestions.length === 0) {
        setError('No suggestions could be generated. Not enough data to analyze patterns.')
        setSuggestions([])
      } else {
        setSuggestions(generatedSuggestions)
      }
    } catch (err: any) {
      console.error('Error generating suggestions:', err)
      setError(err.message || 'Failed to generate suggestions')
    } finally {
      setIsGenerating(false)
    }
  }

  // This is a simplified algorithm for demonstration purposes
  // In a real implementation, this would be much more sophisticated
  const generateSuggestionsFromPatterns = async (
    sourceValue: string, 
    existingMappings: any[]
  ): Promise<Suggestion[]> => {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Get only approved or pending mappings to analyze
    const validMappings = existingMappings.filter(m => 
      m.status === 'APPROVED' || m.status === 'PENDING'
    )
    
    if (validMappings.length < 3) {
      // Not enough data to analyze patterns
      return []
    }
    
    // Find similar source values using string similarity
    const similarSourceValues = validMappings
      .map(m => ({
        similarity: calculateSimilarity(sourceValue, m.sourceValue),
        mapping: m
      }))
      .filter(item => item.similarity > 0.3) // Only keep items with some similarity
      .sort((a, b) => b.similarity - a.similarity) // Sort by similarity
      .slice(0, 5) // Take top 5
    
    if (similarSourceValues.length === 0) {
      return []
    }
    
    // Generate suggestions based on similar items
    const suggestions: Suggestion[] = similarSourceValues.map(item => ({
      value: item.mapping.targetValue,
      confidence: Math.round(item.similarity * 100),
      selected: item.similarity > 0.8 // Pre-select high confidence matches
    }))
    
    // Add a simple transformation if the source looks like a code or ID
    const isCodeLike = /^[A-Z0-9_-]+$/i.test(sourceValue)
    if (isCodeLike) {
      // For code-like values, sometimes just copying the source is valid
      // if no clear pattern is found
      if (!suggestions.some(s => s.value === sourceValue)) {
        suggestions.push({
          value: sourceValue,
          confidence: 60,
          selected: suggestions.length === 0
        })
      }
    }
    
    return suggestions
  }

  // Simple string similarity function using Levenshtein distance
  const calculateSimilarity = (a: string, b: string): number => {
    if (!a || !b) return 0
    
    // Convert to lowercase for better comparison
    const s1 = a.toLowerCase()
    const s2 = b.toLowerCase()
    
    // Exact match
    if (s1 === s2) return 1
    
    // Check if one is a substring of the other
    if (s1.includes(s2) || s2.includes(s1)) {
      const ratio = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length)
      return 0.7 + (ratio * 0.3) // Scale between 0.7 and 1.0
    }
    
    // Simple case: calculate character overlap
    const set1 = new Set(s1.split(''))
    const set2 = new Set(s2.split(''))
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    
    return intersection.size / union.size
  }

  const toggleSelection = (index: number) => {
    setSuggestions(prev => 
      prev.map((suggestion, i) => 
        i === index 
          ? { ...suggestion, selected: !suggestion.selected } 
          : suggestion
      )
    )
  }

  const handleApplySuggestions = async () => {
    if (!mapping) return
    
    const selectedSuggestions = suggestions.filter(s => s.selected)
    if (selectedSuggestions.length === 0) {
      setError('Please select at least one suggestion to apply')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Fetch current crosswalk mapping
      const currentMapping = await apiRequest(`/api/crosswalks/${mapping.crosswalkId}`, {
        method: 'GET'
      })
      
      // Create new mappings from selected suggestions
      const newMappings = selectedSuggestions.map(suggestion => ({
        sourceValue: mapping.sourceValue,
        targetValue: suggestion.value,
        confidence: suggestion.confidence / 100, // Convert to 0-1 scale
        status: 'PENDING', // New mappings are pending by default
        isAiGenerated: true // Flag to indicate AI generation
      }))
      
      // Prepare updated mapping data, ensuring we handle missing structure
      const existingMappingData = currentMapping.mappingData || { 
        mappings: [],
        sourceAttribute: currentMapping.sourceAttribute || '',
        targetAttribute: currentMapping.targetAttribute || ''
      };
      
      // Update the crosswalk with new mappings
      const updatedMappingData = {
        ...existingMappingData,
        mappings: [
          ...(existingMappingData.mappings || []),
          ...newMappings
        ]
      }
      
      await apiRequest(`/api/crosswalks/${mapping.crosswalkId}`, {
        method: 'PATCH',
        data: {
          mappingData: updatedMappingData
        }
      })
      
      // Delete the missing mapping
      await apiRequest(`/api/missing-mappings/${mapping.id}`, {
        method: 'DELETE'
      })
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['crosswalks'] })
      queryClient.invalidateQueries({ queryKey: ['missing-mappings'] })
      queryClient.invalidateQueries({ queryKey: ['missing-mappings-statistics'] })
      
      // Show success
      setSuccess(true)
      toast({
        title: 'Suggestions applied',
        description: `Applied ${selectedSuggestions.length} suggested mapping(s) for "${mapping.sourceValue}"`,
        variant: 'default'
      })
      
      // Close after a delay
      setTimeout(() => {
        onClose()
        if (onSuccess) {
          onSuccess()
        }
      }, 1500)
    } catch (err: any) {
      console.error('Error applying suggestions:', err)
      setError(err.message || 'Failed to apply suggestions')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!mapping) {
    return null
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => !isGenerating && !isSubmitting && !open && onClose()}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
            Smart Suggestions
          </DialogTitle>
          <DialogDescription>
            AI-powered suggestions for mapping "{mapping.sourceValue}" in crosswalk "{mapping.crosswalkName}".
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {isGenerating ? (
            <div className="space-y-4 py-6">
              <div className="flex justify-center">
                <div className="flex flex-col items-center text-center">
                  <Brain className="h-16 w-16 text-primary/20 animate-pulse mb-4" />
                  <h3 className="text-lg font-medium">Generating Suggestions...</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mt-2">
                    Our system is analyzing existing mappings to suggest the best matches for this value.
                  </p>
                </div>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          ) : error && suggestions.length === 0 ? (
            <Alert variant="destructive" className="my-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex justify-between w-full">
                <span>{error}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={generateSuggestions}
                  className="h-8 px-2"
                >
                  <RotateCcw className="h-4 w-4 mr-1" /> Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : success ? (
            <Alert className="bg-green-50 border-green-200 my-4">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Selected suggestions have been applied successfully!
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="rounded-md border p-4 bg-muted/50">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium">Source Value:</span>
                  <span className="text-md">{mapping.sourceValue}</span>
                </div>
              </div>
              
              {suggestions.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Suggested Target Values</h3>
                    <Badge variant="outline" className="font-normal">
                      Select to apply
                    </Badge>
                  </div>
                  
                  <ScrollArea className="h-[200px] border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>Suggested Value</TableHead>
                          <TableHead className="w-[120px] text-right">Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suggestions.map((suggestion, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Checkbox
                                checked={suggestion.selected}
                                onCheckedChange={() => toggleSelection(index)}
                                id={`suggestion-${index}`}
                              />
                            </TableCell>
                            <TableCell>
                              <label
                                htmlFor={`suggestion-${index}`}
                                className="block cursor-pointer"
                              >
                                {suggestion.value}
                              </label>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={
                                  suggestion.confidence >= 80
                                    ? 'success'
                                    : suggestion.confidence >= 50
                                    ? 'outline'
                                    : 'secondary'
                                }
                              >
                                {suggestion.confidence}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              ) : null}
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <div className="flex-1 flex justify-start">
            {!isGenerating && !success && suggestions.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateSuggestions}
                disabled={isSubmitting}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            )}
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isGenerating || isSubmitting}
          >
            {success ? 'Close' : 'Cancel'}
          </Button>
          
          {!isGenerating && !success && suggestions.length > 0 && (
            <Button
              onClick={handleApplySuggestions}
              disabled={isSubmitting || !suggestions.some(s => s.selected)}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ThumbsUp className="h-4 w-4" />
              )}
              {isSubmitting ? 'Applying...' : 'Apply Selected'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}