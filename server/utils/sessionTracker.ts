/**
 * Session Tracker
 * 
 * This module tracks user session activity, duration, and interactions
 * with the system. It provides detailed logging about user engagement.
 */

import { logSystemEvent } from './auditLogger';
import { logInfo, logWarning } from './errorLogger';

// In-memory session store with activity tracking
interface ActiveSession {
  userId: number;
  username: string;
  startTime: Date;
  lastActivity: Date;
  activityCount: number;
  pageViews: Record<string, number>;
  activityLog: {
    timestamp: Date;
    action: string;
    path: string;
  }[];
}

// Cache of active sessions
const activeSessions: Record<string, ActiveSession> = {};

/**
 * Initialize a new user session
 */
export function startUserSession(sessionId: string, userId: number, username: string) {
  const now = new Date();
  
  activeSessions[sessionId] = {
    userId,
    username,
    startTime: now,
    lastActivity: now,
    activityCount: 1,
    pageViews: {},
    activityLog: [{
      timestamp: now,
      action: 'SESSION_START',
      path: '/api/login',
    }]
  };
  
  logInfo(
    `User session started: ${username} (${userId})`,
    'USER',
    userId,
    { sessionId, timestamp: now }
  );
  
  return activeSessions[sessionId];
}

/**
 * Record a user activity within a session
 */
export function recordUserActivity(
  sessionId: string, 
  path: string, 
  action: string = 'PAGE_VIEW'
) {
  if (!activeSessions[sessionId]) {
    // Session not found or expired
    return null;
  }
  
  const now = new Date();
  const session = activeSessions[sessionId];
  
  // Update session data
  session.lastActivity = now;
  session.activityCount++;
  
  // Track page view counts
  if (action === 'PAGE_VIEW') {
    session.pageViews[path] = (session.pageViews[path] || 0) + 1;
  }
  
  // Add to activity log
  session.activityLog.push({
    timestamp: now,
    action,
    path
  });
  
  // Limit activity log size
  if (session.activityLog.length > 1000) {
    session.activityLog = session.activityLog.slice(-1000);
  }
  
  return session;
}

/**
 * End a user session and log details
 */
export function endUserSession(sessionId: string) {
  if (!activeSessions[sessionId]) {
    return null;
  }
  
  const session = activeSessions[sessionId];
  const now = new Date();
  const durationMs = now.getTime() - session.startTime.getTime();
  const durationMinutes = Math.round(durationMs / 1000 / 60);
  
  // Get most viewed pages
  const pageViewEntries = Object.entries(session.pageViews);
  pageViewEntries.sort((a, b) => b[1] - a[1]);
  const topPages = pageViewEntries.slice(0, 5);
  
  // Log session summary
  logSystemEvent(
    'LOGOUT',
    'USER',
    session.userId.toString(),
    session.username,
    {
      sessionId,
      startTime: session.startTime,
      endTime: now,
      durationMinutes,
      activityCount: session.activityCount,
      topPages,
      // Don't include full activity log as it could be very large
    }
  );
  
  // Clean up
  delete activeSessions[sessionId];
  
  return {
    userId: session.userId,
    username: session.username,
    durationMinutes,
    activityCount: session.activityCount
  };
}

/**
 * Handle inactive session cleanup
 */
export function cleanupInactiveSessions(maxInactiveMinutes = 30) {
  const now = new Date();
  let cleanedCount = 0;
  
  Object.keys(activeSessions).forEach(sessionId => {
    const session = activeSessions[sessionId];
    const inactiveTime = now.getTime() - session.lastActivity.getTime();
    const inactiveMinutes = Math.round(inactiveTime / 1000 / 60);
    
    if (inactiveMinutes > maxInactiveMinutes) {
      // Log session timeout
      logWarning(
        `User session timed out after ${inactiveMinutes} minutes of inactivity: ${session.username} (${session.userId})`,
        'USER',
        session.userId,
        {
          sessionId,
          startTime: session.startTime,
          lastActivity: session.lastActivity,
          inactiveMinutes,
          activityCount: session.activityCount
        }
      );
      
      // End the session
      endUserSession(sessionId);
      cleanedCount++;
    }
  });
  
  if (cleanedCount > 0) {
    logInfo(
      `Cleaned up ${cleanedCount} inactive sessions`,
      'SYSTEM',
      'session-cleanup',
      { maxInactiveMinutes }
    );
  }
  
  return cleanedCount;
}

/**
 * Get session statistics
 */
export function getSessionStats() {
  const now = new Date();
  const sessionStats = Object.values(activeSessions).map(session => {
    const durationMs = now.getTime() - session.startTime.getTime();
    return {
      userId: session.userId,
      username: session.username,
      durationMinutes: Math.round(durationMs / 1000 / 60),
      activityCount: session.activityCount,
      lastActivityMinutesAgo: Math.round((now.getTime() - session.lastActivity.getTime()) / 1000 / 60)
    };
  });
  
  return {
    activeSessions: sessionStats.length,
    sessionDetails: sessionStats
  };
}

/**
 * Get details about a specific user's session
 */
export function getUserSessionInfo(userId: number) {
  const userSessions = Object.values(activeSessions).filter(
    session => session.userId === userId
  );
  
  if (userSessions.length === 0) {
    return null;
  }
  
  const now = new Date();
  
  return userSessions.map(session => {
    const durationMs = now.getTime() - session.startTime.getTime();
    const lastActivityMs = now.getTime() - session.lastActivity.getTime();
    
    return {
      username: session.username,
      startTime: session.startTime,
      durationMinutes: Math.round(durationMs / 1000 / 60),
      lastActivity: session.lastActivity,
      lastActivityMinutesAgo: Math.round(lastActivityMs / 1000 / 60),
      activityCount: session.activityCount,
      topPages: Object.entries(session.pageViews)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    };
  });
}