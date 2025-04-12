/**
 * Event Bus System
 * 
 * A simple event system to enable communication between different parts
 * of the application without tight coupling.
 */

/**
 * Event payload type definition
 */
export type EventPayload = {
  dataSetId?: number;
  instanceIds?: string[];
  relationshipId?: number;
  relationshipValueIds?: number[];
  timestamp: string;
  userId?: string;
  actionType: 'approve' | 'reject' | 'update' | 'delete';
};

/**
 * Event types supported by the event bus
 */
export type EventTypes = 
  | 'referenceDataUpdated'   // When reference data instances are updated
  | 'relationshipUpdated'    // When relationship values are updated
  | 'approvalStatusChanged'; // When approval status changes on any entity

/**
 * Event Bus class for managing application-wide events
 */
export class EventBus {
  /**
   * Dispatch a custom event with a payload
   */
  static dispatch(eventName: EventTypes, payload: EventPayload): void {
    // Add a timestamp if not provided
    if (!payload.timestamp) {
      payload.timestamp = new Date().toISOString();
    }
    
    // Enhanced logging for event diagnostics
    console.log(`[EventBus] Dispatching ${eventName} at ${new Date().toISOString()}:`, {
      ...payload,
      dataSetId: payload.dataSetId || 'none',
      instanceIds: payload.instanceIds || [],
      relationshipId: payload.relationshipId || 'none'
    });
    
    // Create and dispatch custom event
    const event = new CustomEvent(eventName, { 
      detail: payload,
      bubbles: true
    });
    
    // Dispatch on window to ensure global access
    window.dispatchEvent(event);
  }
  
  /**
   * Subscribe to an event
   */
  static subscribe(eventName: EventTypes, callback: (payload: EventPayload) => void): () => void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<EventPayload>;
      callback(customEvent.detail);
    };
    
    window.addEventListener(eventName, handler);
    
    // Return unsubscribe function for cleanup
    return () => {
      window.removeEventListener(eventName, handler);
    };
  }
}

/**
 * Convenience function for dispatching data update events
 */
export const dispatchDataUpdate = (
  dataSetId: number,
  instanceIds: string[],
  actionType: 'approve' | 'reject' | 'update' | 'delete'
): void => {
  EventBus.dispatch('referenceDataUpdated', {
    dataSetId,
    instanceIds,
    timestamp: new Date().toISOString(),
    actionType
  });
};

/**
 * Convenience function for dispatching approval status change events
 */
export const dispatchApprovalStatusChange = (
  payload: Omit<EventPayload, 'timestamp'>
): void => {
  EventBus.dispatch('approvalStatusChanged', {
    ...payload,
    timestamp: new Date().toISOString()
  });
};