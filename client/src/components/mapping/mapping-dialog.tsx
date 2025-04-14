import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMappingManager } from "@/hooks/use-mapping-manager";
import { MappingEditor, MappingItem } from "@/components/mapping/mapping-editor";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export interface MappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  sourceLabel?: string;
  targetLabel?: string;
  initialMappings?: MappingItem[];
  sourceValues: string[];
  targetValues: string[];
  onSave: (mappings: MappingItem[]) => Promise<void> | void;
  onSubmitForApproval?: (mappings: MappingItem[]) => Promise<void> | void;
  isLoading?: boolean;
  readOnly?: boolean;
  showSubmitButton?: boolean;
  crosswalkId?: number;
}

/**
 * A reusable dialog for editing mappings between source and target values.
 * This can be used in any part of the application where mappings need to be edited.
 */
export function MappingDialog({
  open,
  onOpenChange,
  title,
  description,
  sourceLabel = "Source Value",
  targetLabel = "Target Value",
  initialMappings = [],
  sourceValues,
  targetValues,
  onSave,
  onSubmitForApproval,
  isLoading = false,
  readOnly = false,
  showSubmitButton = false,
  crosswalkId,
}: MappingDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use the mapping manager hook to handle mapping operations
  const {
    mappings,
    hasChanges,
    setAllMappings,
    resetChanges
  } = useMappingManager({
    initialMappings,
  });
  
  // Reset mappings when the dialog is opened with new initial mappings
  useEffect(() => {
    if (open) {
      setAllMappings(initialMappings);
      resetChanges();
    }
  }, [open, initialMappings, setAllMappings, resetChanges]);
  
  // Handle form submission
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(mappings);
      
      toast({
        title: "Success",
        description: "Mappings saved successfully.",
      });
      
      resetChanges();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save mappings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle submit for approval
  const handleSubmitForApproval = async () => {
    if (!onSubmitForApproval) return;
    
    try {
      setIsSubmitting(true);
      
      // Update mappings to set status to PENDING for those that are DRAFT or undefined
  // Also ensure crosswalkId is propagated to all mappings
      const mappingsToSubmit = mappings.map(mapping => {
        // Only update status for DRAFT or undefined items
        if (!mapping.status || mapping.status === 'DRAFT') {
          return { 
            ...mapping, 
            status: 'PENDING' as const,
            // Add crosswalkId if it exists and is not already assigned
            ...(crosswalkId && !mapping.crosswalkId ? { crosswalkId } : {})
          };
        }
        // For other items, just ensure crosswalkId is set if needed
        return { 
          ...mapping,
          ...(crosswalkId && !mapping.crosswalkId ? { crosswalkId } : {})
        };
      });
      
      // Update local mappings state
      setAllMappings(mappingsToSubmit);
      
      // Submit to the server
      await onSubmitForApproval(mappingsToSubmit);
      
      toast({
        title: "Success",
        description: "Mappings submitted for approval successfully.",
      });
      
      resetChanges();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting for approval:", error);
      toast({
        title: "Error",
        description: `Failed to submit mappings for approval: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        <div className="py-4">
          <MappingEditor
            mappings={mappings}
            onMappingsChange={setAllMappings}
            sourceValues={sourceValues}
            targetValues={targetValues}
            sourceLabel={sourceLabel}
            targetLabel={targetLabel}
            readOnly={readOnly || isLoading || isSaving}
          />
        </div>
        
        <DialogFooter className="flex flex-row gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving || isSubmitting}
          >
            Cancel
          </Button>
          
          {!readOnly && showSubmitButton && onSubmitForApproval && (
            <Button 
              variant="secondary"
              onClick={handleSubmitForApproval}
              disabled={isLoading || isSaving || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for Approval
            </Button>
          )}
          
          {!readOnly && (
            <Button 
              onClick={handleSave}
              disabled={!hasChanges || isLoading || isSaving || isSubmitting}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}