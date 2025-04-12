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
}: {
  dataSetId?: number;
  onApprovalChange?: (payload: EventPayload) => void;
}) {
  const queryClient = useQueryClient();

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
            console.log(`[useApprovalEvents] Invalidating query for dataSetId: ${dataSetId}`);
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

    // Return a cleanup function
    return () => {
      unsubscribeApproval();
      unsubscribeDataUpdate();
    };
  }, [dataSetId, queryClient, onApprovalChange]);
}