/**
 * Simple event bus implementation for cross-component communication
 * Allows components to publish and subscribe to events
 */

// Define event types for type safety
export enum EventType {
  INSTANCE_SUBMITTED_FOR_APPROVAL = 'INSTANCE_SUBMITTED_FOR_APPROVAL',
  RELATIONSHIP_VALUE_SUBMITTED_FOR_APPROVAL = 'RELATIONSHIP_VALUE_SUBMITTED_FOR_APPROVAL',
  APPROVAL_STATUS_CHANGED = 'APPROVAL_STATUS_CHANGED',
}

// Define event data interfaces
export interface InstanceApprovalEvent {
  dataSetId: number;
  instanceId: string;
  instanceName?: string;
}

export interface RelationshipApprovalEvent {
  relationshipId: number;
  valueId: number;
  sourceId?: string;
  targetId?: string;
}

export interface ApprovalStatusEvent {
  type: 'instance' | 'relationship';
  id: number | string;
  status: 'APPROVED' | 'REJECTED';
}

// Union type for all possible event payloads
export type EventData = 
  | InstanceApprovalEvent 
  | RelationshipApprovalEvent 
  | ApprovalStatusEvent;

// Event listener type
type EventCallback = (data: EventData) => void;

class EventBus {
  private listeners: { [key in EventType]?: EventCallback[] } = {};

  /**
   * Subscribe to an event
   * @param event The event type to subscribe to
   * @param callback The callback to execute when the event occurs
   * @returns An unsubscribe function
   */
  subscribe(event: EventType, callback: EventCallback): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    this.listeners[event]?.push(callback);
    
    // Return unsubscribe function
    return () => {
      if (!this.listeners[event]) return;
      
      this.listeners[event] = this.listeners[event]?.filter(
        (listener) => listener !== callback
      );
    };
  }

  /**
   * Publish an event
   * @param event The event type to publish
   * @param data The data to pass to event subscribers
   */
  publish(event: EventType, data: EventData): void {
    if (!this.listeners[event]) return;
    
    this.listeners[event]?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Remove all listeners for a specific event
   * @param event The event type to clear listeners for
   */
  clear(event?: EventType): void {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

// Create a singleton instance
export const eventBus = new EventBus();

// React hook for using the event bus in function components
import { useEffect } from 'react';

export function useEventListener(event: EventType, callback: EventCallback) {
  useEffect(() => {
    // Subscribe when the component mounts
    const unsubscribe = eventBus.subscribe(event, callback);
    
    // Unsubscribe when the component unmounts
    return () => {
      unsubscribe();
    };
  }, [event, callback]);
}