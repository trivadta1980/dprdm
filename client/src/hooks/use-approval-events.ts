/**
 * Custom hook for listening to approval-related events
 */
import { useEffect } from 'react';
import { EventBus, EventPayload } from '@/lib/eventBus';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook that subscribes to approval events and triggers data refetching when needed
 * 
 * @param options Configuration options for the hook
 * @returns Cleanup function
 */
export function useApprovalEvents({
  dataSetId,
  onApprovalChange,
  componentName = 'Unknown',
}: {
  dataSetId?: number;
  onApprovalChange?: (payload: EventPayload) => void;
  componentName?: string;
}) {
  const queryClient = useQueryClient();
  
  // Log component registration for debugging
  console.log(`[useApprovalEvents] Component ${componentName} registered with dataSetId: ${dataSetId || 'all'}`);

  useEffect(() => {
    // Listen for approval status changes
    const unsubscribeApproval = EventBus.subscribe(
      'approvalStatusChanged',
      (payload: EventPayload) => {
        console.log('[useApprovalEvents] Approval status changed event received:', payload);
        
        // If payload contains our dataSetId or no specific dataSetId is provided (listen to all)
        if (!dataSetId || payload.dataSetId === dataSetId) {
          // Invalidate queries related to the data set
          if (dataSetId) {
            // This is the primary query key used in reference-data-instances-page
            console.log(`[useApprovalEvents] Invalidating query for dataSetId: ${dataSetId} from component ${componentName}`);
            queryClient.invalidateQueries({ queryKey: [`/api/reference-data/${dataSetId}`] });
            
            // Also invalidate other related queries that might be in use
            queryClient.invalidateQueries({ queryKey: [`/api/reference-data/${dataSetId}/instances`] });
          } else {
            // If no specific dataset, invalidate all reference data
            queryClient.invalidateQueries({ queryKey: ['/api/reference-data'] });
          }
          
          // Optional callback for custom handling
          if (onApprovalChange) {
            onApprovalChange(payload);
          }
        }
      }
    );

    // Listen for general data updates
    const unsubscribeDataUpdate = EventBus.subscribe(
      'referenceDataUpdated',
      (payload: EventPayload) => {
        console.log('[useApprovalEvents] Reference data updated event received:', payload);
        
        // If payload contains our dataSetId or no specific dataSetId is provided (listen to all)
        if (!dataSetId || payload.dataSetId === dataSetId) {
          // Invalidate queries related to the data set
          if (dataSetId) {
            // This is the primary query key used in reference-data-instances-page
            console.log(`[useApprovalEvents] Invalidating query for dataSetId: ${dataSetId} (data update)`);
            queryClient.invalidateQueries({ queryKey: [`/api/reference-data/${dataSetId}`] });
            
            // Also invalidate other related queries that might be in use
            queryClient.invalidateQueries({ queryKey: [`/api/reference-data/${dataSetId}/instances`] });
          } else {
            // If no specific dataset, invalidate all reference data
            queryClient.invalidateQueries({ queryKey: ['/api/reference-data'] });
          }
        }
      }
    );

    // Listen for approvals dashboard updates
    const unsubscribeApprovalsUpdate = EventBus.subscribe(
      'approvalsUpdated',
      (payload: EventPayload) => {
        console.log('[useApprovalEvents] Approvals updated event received:', payload);
        
        // Invalidate all approval-related queries
        queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
        queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
        
        // Invalidate specific approval category queries based on the type
        if (payload.type === 'crosswalk') {
          console.log('[useApprovalEvents] Invalidating crosswalk approvals queries');
          queryClient.invalidateQueries({ queryKey: ["/api/approvals/crosswalk-mappings/pending"] });
          
          // Invalidate specific crosswalk mappings
          if (payload.ids && Array.isArray(payload.ids)) {
            payload.ids.forEach(id => {
              queryClient.invalidateQueries({ queryKey: [`/api/crosswalks/${id}`] });
            });
          }
          
          // Also invalidate all crosswalks
          queryClient.invalidateQueries({ queryKey: ["/api/crosswalks"] });
        } else if (payload.type === 'relationship') {
          console.log('[useApprovalEvents] Invalidating relationship values approvals queries');
          queryClient.invalidateQueries({ queryKey: ["/api/approvals/relationship-values/pending"] });
          
          // Invalidate all relationships
          queryClient.invalidateQueries({ queryKey: ["/api/relationships"] });
        } else if (payload.type === 'dataset') {
          console.log('[useApprovalEvents] Invalidating dataset instances approvals queries');
          queryClient.invalidateQueries({ queryKey: ["/api/approvals/dataset-instances/pending"] });
          
          // Invalidate all datasets
          queryClient.invalidateQueries({ queryKey: ["/api/reference-data"] });
        }
        
        // Optional callback for custom handling
        if (onApprovalChange) {
          onApprovalChange(payload);
        }
      }
    );
    
    // Return a cleanup function
    return () => {
      unsubscribeApproval();
      unsubscribeDataUpdate();
      unsubscribeApprovalsUpdate();
    };
  }, [dataSetId, queryClient, onApprovalChange]);
}