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
  crosswalkMappingId?: number;
  crosswalkMappingIds?: number[];
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
  | 'crosswalkUpdated'       // When crosswalk mappings are updated
  | 'approvalStatusChanged'; // When approval status changes on any entity

/**
 * Event type enum for backward compatibility
 */
export enum EventType {
  RELATIONSHIP_VALUE_SUBMITTED_FOR_APPROVAL = 'relationshipValueSubmittedForApproval',
  RELATIONSHIP_VALUE_APPROVED = 'relationshipValueApproved',
  RELATIONSHIP_VALUE_REJECTED = 'relationshipValueRejected',
  REFERENCE_DATA_UPDATED = 'referenceDataUpdated',
  RELATIONSHIP_UPDATED = 'relationshipUpdated',
  CROSSWALK_MAPPING_APPROVED = 'crosswalkMappingApproved',
  CROSSWALK_MAPPING_REJECTED = 'crosswalkMappingRejected',
  CROSSWALK_UPDATED = 'crosswalkUpdated',
  APPROVAL_STATUS_CHANGED = 'approvalStatusChanged'
}

/**
 * Event Bus class for managing application-wide events
 */
export class EventBus {
  /**
   * Dispatch a custom event with a payload
   */
  static dispatch(eventName: EventTypes | string, payload: EventPayload): void {
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
  static subscribe(eventName: EventTypes | string, callback: (payload: EventPayload) => void): () => void {
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
  
  /**
   * Legacy publish method for backward compatibility
   */
  static publish(eventName: EventType | string, payload: Partial<EventPayload>): void {
    const fullPayload: EventPayload = {
      ...payload as any,
      timestamp: payload.timestamp || new Date().toISOString(),
      actionType: payload.actionType || 'update'
    };
    
    let eventNameStr: string;
    if (typeof eventName === 'string') {
      eventNameStr = eventName;
    } else {
      eventNameStr = String(eventName);
    }
    
    EventBus.dispatch(eventNameStr, fullPayload);
  }
}

/**
 * Singleton instance for backward compatibility
 */
export const eventBus = {
  publish: (eventName: EventType | string, payload: Partial<EventPayload>) => {
    EventBus.publish(eventName, payload);
  },
  subscribe: (eventName: EventTypes | string, callback: (payload: EventPayload) => void) => {
    return EventBus.subscribe(eventName, callback);
  }
};

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