/**
 * Session Tracker
 * 
 * Tracks user sessions, activity, and time spent in the system.
 * Used for audit trail and analytics.
 */

import { logCrudEvent } from './auditLogger';

interface SessionInfo {
  userId: number;
  username: string;
  startTime: number;
  lastActivity: number;
  activityCount: number;
  paths: Set<string>;
}

// In-memory store of active sessions
const activeSessions: Record<string, SessionInfo> = {};

// Configure session timeout (30 minutes of inactivity)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Start tracking a new user session
 * @param sessionId The session ID from Express
 * @param userId The user ID
 * @param username The username
 */
export function startUserSession(sessionId: string, userId: number, username: string): void {
  const now = Date.now();
  
  activeSessions[sessionId] = {
    userId,
    username,
    startTime: now,
    lastActivity: now,
    activityCount: 1,
    paths: new Set<string>()
  };
  
  // Log session start
  logCrudEvent(
    { user: { id: userId, username } } as any,
    'CREATE',
    'SYSTEM',
    `session_${sessionId}`,
    'User Session',
    null,
    null,
    `User ${username} started a new session`,
    { sessionId }
  );
}

/**
 * Record user activity within a session
 * @param sessionId The session ID from Express
 * @param path The request path
 */
export function recordUserActivity(sessionId: string, path: string): void {
  const session = activeSessions[sessionId];
  
  if (!session) {
    // Session not found, possibly expired or new
    return;
  }
  
  const now = Date.now();
  
  // Update session activity
  session.lastActivity = now;
  session.activityCount += 1;
  session.paths.add(path);
}

/**
 * Get stats about a user's current session
 * @param sessionId The session ID from Express
 */
export function getSessionStats(sessionId: string): {
  duration: number;
  activityCount: number;
  uniquePaths: number;
} | null {
  const session = activeSessions[sessionId];
  
  if (!session) {
    return null;
  }
  
  const now = Date.now();
  
  return {
    duration: now - session.startTime,
    activityCount: session.activityCount,
    uniquePaths: session.paths.size
  };
}

/**
 * End user session tracking
 * @param sessionId The session ID from Express
 */
export function endUserSession(sessionId: string): void {
  const session = activeSessions[sessionId];
  
  if (!session) {
    return;
  }
  
  const now = Date.now();
  const duration = now - session.startTime;
  const durationMinutes = Math.round(duration / 60000);
  
  // Log session end with statistics
  logCrudEvent(
    { user: { id: session.userId, username: session.username } } as any,
    'LOGOUT',
    'SYSTEM',
    `session_${sessionId}`,
    'User Session',
    null,
    null,
    `User ${session.username} ended session after ${durationMinutes} minutes`,
    {
      sessionId,
      duration,
      activityCount: session.activityCount,
      uniquePaths: Array.from(session.paths)
    }
  );
  
  // Remove session from tracking
  delete activeSessions[sessionId];
}

/**
 * Check and clean up inactive sessions
 * Returns the number of cleaned up sessions
 */
export function cleanupInactiveSessions(): number {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [sessionId, session] of Object.entries(activeSessions)) {
    const inactiveTime = now - session.lastActivity;
    
    // If inactive for more than timeout period, end the session
    if (inactiveTime > SESSION_TIMEOUT_MS) {
      // Log timeout event
      logCrudEvent(
        { user: { id: session.userId, username: session.username } } as any,
        'SYSTEM',
        'SYSTEM',
        `session_${sessionId}`,
        'User Session',
        null,
        null,
        `User ${session.username} session timed out after ${Math.round(inactiveTime / 60000)} minutes of inactivity`,
        { sessionId, inactivityTime: inactiveTime }
      );
      
      // Remove session from tracking
      delete activeSessions[sessionId];
      cleanedCount++;
    }
  }
  
  return cleanedCount;
}

/**
 * Get all active sessions for monitoring purposes
 * Can be used by admins to see who's currently online
 */
export function getActiveSessions(): {
  sessionId: string;
  userId: number;
  username: string;
  startTime: Date;
  lastActivity: Date;
  activityCount: number;
  durationMinutes: number;
}[] {
  const now = Date.now();
  
  return Object.entries(activeSessions).map(([sessionId, session]) => ({
    sessionId,
    userId: session.userId,
    username: session.username,
    startTime: new Date(session.startTime),
    lastActivity: new Date(session.lastActivity),
    activityCount: session.activityCount,
    durationMinutes: Math.round((now - session.startTime) / 60000)
  }));
}