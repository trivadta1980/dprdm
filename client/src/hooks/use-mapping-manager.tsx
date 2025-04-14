import { useState, useCallback } from 'react';
import { MappingItem } from '@/components/mapping/mapping-editor';

interface UseMappingManagerOptions {
  onChange?: (mappings: MappingItem[]) => void;
  initialMappings?: MappingItem[];
  validateMapping?: (mapping: MappingItem) => string | null;
}

/**
 * A hook for managing mapping data with validation and change tracking
 */
export function useMappingManager({
  onChange,
  initialMappings = [],
  validateMapping,
}: UseMappingManagerOptions = {}) {
  const [mappings, setMappings] = useState<MappingItem[]>(initialMappings);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add a new mapping with validation
  const addMapping = useCallback((mapping: MappingItem) => {
    // Check if mapping already exists
    const exists = mappings.some(
      m => m.sourceValue === mapping.sourceValue && m.targetValue === mapping.targetValue
    );

    if (exists) {
      setErrors({
        ...errors,
        duplicate: `Mapping from "${mapping.sourceValue}" to "${mapping.targetValue}" already exists.`
      });
      return false;
    }

    // Validate mapping if validator provided
    if (validateMapping) {
      const error = validateMapping(mapping);
      if (error) {
        setErrors({
          ...errors,
          validation: error
        });
        return false;
      }
    }

    // Add mapping
    const newMappings = [...mappings, {
      ...mapping,
      id: mapping.id || Date.now().toString()
    }];
    
    setMappings(newMappings);
    setHasChanges(true);
    if (onChange) {
      onChange(newMappings);
    }
    return true;
  }, [mappings, errors, validateMapping, onChange]);

  // Update an existing mapping
  const updateMapping = useCallback((id: string, updatedMapping: Partial<MappingItem>) => {
    const index = mappings.findIndex(m => m.id === id);
    if (index === -1) return false;

    // Check for duplicates if sourceValue or targetValue changed
    if (updatedMapping.sourceValue || updatedMapping.targetValue) {
      const newSourceValue = updatedMapping.sourceValue || mappings[index].sourceValue;
      const newTargetValue = updatedMapping.targetValue || mappings[index].targetValue;
      
      const exists = mappings.some(
        (m, i) => i !== index && 
                m.sourceValue === newSourceValue && 
                m.targetValue === newTargetValue
      );

      if (exists) {
        setErrors({
          ...errors,
          duplicate: `Mapping from "${newSourceValue}" to "${newTargetValue}" already exists.`
        });
        return false;
      }
    }

    // Validate the updated mapping if validator provided
    if (validateMapping) {
      const updatedItem = {
        ...mappings[index],
        ...updatedMapping
      };
      const error = validateMapping(updatedItem);
      if (error) {
        setErrors({
          ...errors,
          validation: error
        });
        return false;
      }
    }

    // Update the mapping
    const newMappings = [...mappings];
    newMappings[index] = {
      ...newMappings[index],
      ...updatedMapping
    };
    
    setMappings(newMappings);
    setHasChanges(true);
    if (onChange) {
      onChange(newMappings);
    }
    return true;
  }, [mappings, errors, validateMapping, onChange]);

  // Delete a mapping
  const deleteMapping = useCallback((id: string) => {
    const newMappings = mappings.filter(m => m.id !== id);
    setMappings(newMappings);
    setHasChanges(true);
    if (onChange) {
      onChange(newMappings);
    }
    return true;
  }, [mappings, onChange]);

  // Delete all mappings
  const clearMappings = useCallback(() => {
    setMappings([]);
    setHasChanges(true);
    if (onChange) {
      onChange([]);
    }
  }, [onChange]);

  // Set all mappings (e.g., from import)
  const setAllMappings = useCallback((newMappings: MappingItem[]) => {
    // Ensure all mappings have IDs
    const mappingsWithIds = newMappings.map(m => ({
      ...m,
      id: m.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      // Ensure status is a valid enum value if it exists
      ...(m.status ? { status: m.status as 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' } : {})
    })) as MappingItem[];
    
    setMappings(mappingsWithIds);
    setHasChanges(true);
    if (onChange) {
      onChange(mappingsWithIds);
    }
  }, [onChange]);

  // Bulk add mappings with duplicate detection
  const addMappings = useCallback((newMappings: MappingItem[]) => {
    const existingIds = new Set(mappings.map(m => `${m.sourceValue}|${m.targetValue}`));
    const uniqueMappings = newMappings.filter(
      m => !existingIds.has(`${m.sourceValue}|${m.targetValue}`)
    ).map(m => ({
      ...m,
      id: m.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      // Ensure status is a valid enum value if it exists
      ...(m.status ? { status: m.status as 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' } : {})
    })) as MappingItem[];
    
    if (uniqueMappings.length === 0) {
      return { added: 0, duplicates: newMappings.length };
    }
    
    const updatedMappings = [...mappings, ...uniqueMappings] as MappingItem[];
    setMappings(updatedMappings);
    setHasChanges(true);
    if (onChange) {
      onChange(updatedMappings);
    }
    
    return { 
      added: uniqueMappings.length, 
      duplicates: newMappings.length - uniqueMappings.length 
    };
  }, [mappings, onChange]);

  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Reset changes flag
  const resetChanges = useCallback(() => {
    setHasChanges(false);
  }, []);

  return {
    mappings,
    hasChanges,
    errors,
    addMapping,
    updateMapping,
    deleteMapping,
    clearMappings,
    setAllMappings,
    addMappings,
    clearErrors,
    resetChanges
  };
}

export default useMappingManager;