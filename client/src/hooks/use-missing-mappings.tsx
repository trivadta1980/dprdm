import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export interface MissingMapping {
  id: number;
  crosswalkId: number;
  crosswalkName?: string;
  sourceValue: string;
  requestedAt: string;
  lastRequestedAt: string;
  requestCount: number;
  requestUserId: number | null;
  userName?: string;
  requestContext?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MissingMappingStatistics {
  totalCount: number;
  crosswalkCounts: {
    crosswalkId: number;
    crosswalkName: string;
    count: number;
  }[];
}

// Hook for managing missing mappings
export const useMissingMappings = (crosswalkId?: number) => {
  const queryClient = useQueryClient();
  
  // Fetch all missing mappings
  const {
    data: missingMappings = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['missing-mappings', crosswalkId],
    queryFn: async () => {
      try {
        console.log('Fetching missing mappings', crosswalkId ? `for crosswalk ${crosswalkId}` : 'for all crosswalks');
        const url = crosswalkId 
          ? `/api/missing-mappings?crosswalkId=${crosswalkId}` 
          : '/api/missing-mappings';
        
        const response = await fetch(url, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Missing mappings API response:', data);
        
        // Ensure the response is an array
        if (!Array.isArray(data)) {
          console.warn('Missing mappings response is not an array:', data);
          return [];
        }
        
        return data as MissingMapping[];
      } catch (err) {
        console.error('Error fetching missing mappings:', err);
        throw err;
      }
    },
    retry: 1 // Only retry once to avoid flooding logs
  });
  
  // Fetch missing mappings statistics
  const {
    data: statistics,
    isLoading: isLoadingStatistics,
    error: statisticsError
  } = useQuery({
    queryKey: ['missing-mappings-statistics'],
    queryFn: async () => {
      try {
        console.log('Fetching missing mappings statistics');
        
        const response = await fetch('/api/missing-mappings/statistics', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Missing mappings statistics API response:', data);
        
        // Ensure response has the expected shape
        if (data && typeof data === 'object') {
          const stats: MissingMappingStatistics = {
            totalCount: typeof data.totalCount === 'number' ? data.totalCount : 0,
            crosswalkCounts: Array.isArray(data.crosswalkCounts) ? data.crosswalkCounts : []
          };
          return stats;
        }
        
        console.warn('Missing mappings statistics response has unexpected format:', data);
        // Default fallback
        return { totalCount: 0, crosswalkCounts: [] };
      } catch (err) {
        console.error('Error fetching missing mappings statistics:', err);
        throw err;
      }
    },
    retry: 1 // Only retry once to avoid flooding logs
  });
  
  // Log a new missing mapping
  const { mutate: logMissingMapping } = useMutation({
    mutationFn: async (mapping: {
      crosswalkId: number;
      sourceValue: string;
      requestContext?: string;
    }) => {
      const response = await fetch('/api/missing-mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(mapping),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate missing mappings queries
      queryClient.invalidateQueries({ queryKey: ['missing-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['missing-mappings-statistics'] });
      toast({
        title: 'Missing mapping logged',
        description: 'The missing mapping has been recorded successfully.',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      console.error('Error logging missing mapping:', error);
      toast({
        title: 'Error',
        description: `Failed to log missing mapping: ${error.message || 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  });
  
  // Delete a missing mapping
  const { mutate: deleteMissingMapping } = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/missing-mappings/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate missing mappings queries
      queryClient.invalidateQueries({ queryKey: ['missing-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['missing-mappings-statistics'] });
      toast({
        title: 'Missing mapping deleted',
        description: 'The missing mapping has been deleted successfully.',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      console.error('Error deleting missing mapping:', error);
      toast({
        title: 'Error',
        description: `Failed to delete missing mapping: ${error.message || 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  });
  
  return {
    missingMappings,
    isLoading,
    error,
    refetch,
    statistics,
    isLoadingStatistics,
    statisticsError,
    logMissingMapping,
    deleteMissingMapping
  };
};