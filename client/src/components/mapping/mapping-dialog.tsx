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
  isLoading?: boolean;
  readOnly?: boolean;
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
  isLoading = false,
  readOnly = false,
}: MappingDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
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
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          
          {!readOnly && (
            <Button 
              onClick={handleSave}
              disabled={!hasChanges || isLoading || isSaving}
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