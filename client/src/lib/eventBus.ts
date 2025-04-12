/**
 * Event Bus System
 * 
 * A simple event system to enable communication between different parts
 * of the application without tight coupling.
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

export type EventTypes = 
  | 'referenceDataUpdated'   // When reference data instances are updated
  | 'relationshipUpdated'    // When relationship values are updated
  | 'approvalStatusChanged'; // When approval status changes on any entity

export class EventBus {
  /**
   * Dispatch a custom event with a payload
   */
  static dispatch(eventName: EventTypes, payload: EventPayload): void {
    console.log(`[EventBus] Dispatching event: ${eventName}`, payload);
    
    // Create and dispatch a custom event
    const event = new CustomEvent(eventName, {
      detail: payload,
      bubbles: true,
    });
    
    document.dispatchEvent(event);
  }

  /**
   * Subscribe to an event
   */
  static subscribe(eventName: EventTypes, callback: (payload: EventPayload) => void): () => void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<EventPayload>;
      callback(customEvent.detail);
    };
    
    document.addEventListener(eventName, handler);
    
    // Return an unsubscribe function
    return () => {
      document.removeEventListener(eventName, handler);
    };
  }
}

/**
 * Convenience function for dispatching data update events
 */
export const dispatchDataUpdate = (
  dataSetId: number, 
  instanceIds: string[] = [], 
  actionType: EventPayload['actionType'] = 'update',
  userId?: string
): void => {
  EventBus.dispatch('referenceDataUpdated', {
    dataSetId,
    instanceIds,
    timestamp: new Date().toISOString(),
    actionType,
    userId
  });
};

/**
 * Convenience function for dispatching approval status change events
 */
export const dispatchApprovalStatusChange = (
  payload: Partial<EventPayload> & { actionType: EventPayload['actionType'] }
): void => {
  EventBus.dispatch('approvalStatusChanged', {
    ...payload,
    timestamp: new Date().toISOString()
  });
};