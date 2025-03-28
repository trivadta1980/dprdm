import { Router, Request, Response } from 'express';
import { requireAuth } from './auth';

const router = Router();

/**
 * Authentication diagnostic route
 * For testing authentication issues in production vs development
 */
router.get('/auth-test', requireAuth, (req: Request, res: Response) => {
  // Log session and authentication details
  console.log(`[Diagnostics] Auth Test Request:`, {
    sessionID: req.sessionID,
    isAuthenticated: req.isAuthenticated(),
    user: req.user,
    path: req.path,
    originalUrl: req.originalUrl,
    headers: {
      ...req.headers,
      cookie: req.headers.cookie ? '***REDACTED***' : undefined // Don't log actual cookie values
    }
  });
  
  res.json({
    authenticated: true,
    sessionID: req.sessionID,
    user: req.user ? { id: (req.user as any).id, username: (req.user as any).username } : null,
    timestamp: new Date().toISOString()
  });
});

/**
 * Route registration diagnostic
 * Shows all registered routes in the application
 */
router.get('/routes', requireAuth, (req: Request, res: Response) => {
  // Get the Express app instance
  const app = req.app;
  
  // Collect route information
  const routes: any[] = [];
  
  // @ts-ignore - Accessing internal Express properties
  const stack = app._router?.stack || [];
  
  stack.forEach((layer: any) => {
    if (layer.route) {
      const path = layer.route?.path;
      const methods = Object.keys(layer.route.methods).filter(m => layer.route.methods[m]);
      routes.push({ path, methods });
    } else if (layer.name === 'router' && layer.handle?.stack) {
      // This is a router middleware
      const routerPath = layer.regexp?.toString().replace('\\/?(?=\\/|$)', '').replace(/^\\\//, '/').replace(/\\\//g, '/').replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ':param');
      layer.handle.stack.forEach((stackItem: any) => {
        if (stackItem.route) {
          const subPath = stackItem.route?.path;
          const subMethods = Object.keys(stackItem.route.methods).filter(m => stackItem.route.methods[m]);
          routes.push({ 
            path: routerPath === '/' ? subPath : `${routerPath}${subPath}`,
            methods: subMethods,
            middleware: stackItem.route.stack.map((s: any) => s.name || 'anonymous')
          });
        }
      });
    }
  });
  
  res.json({
    routes: routes,
    timestamp: new Date().toISOString()
  });
});

/**
 * Request mirroring diagnostic
 * Shows the exact request details received by the server
 */
router.get('/mirror', (req: Request, res: Response) => {
  res.json({
    url: req.url,
    method: req.method,
    path: req.path,
    params: req.params,
    query: req.query,
    headers: {
      ...req.headers,
      cookie: req.headers.cookie ? '***COOKIE PRESENT***' : undefined // Don't expose cookie data
    },
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : 'unavailable',
    sessionID: req.sessionID || 'unavailable',
    timestamp: new Date().toISOString()
  });
});

/**
 * API endpoint test with detailed authentication logging
 * Specifically for troubleshooting the by-target endpoint
 */
router.get('/test-crosswalks-by-target/:id', requireAuth, async (req: Request, res: Response) => {
  const targetId = req.params.id;
  
  try {
    console.log(`[Diagnostics] Crosswalks By Target Test:`, {
      targetId,
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      userId: req.user ? (req.user as any).id : null,
      headers: {
        ...req.headers,
        cookie: req.headers.cookie ? '***REDACTED***' : undefined
      }
    });
    
    // Test fetching from the actual endpoint with the server session
    const url = `/api/crosswalks/by-target/${targetId}`;
    console.log(`[Diagnostics] Attempting internal request to: ${url}`);
    
    // We don't want to actually make another HTTP request, so we'll respond with diagnostic info
    res.json({
      diagnosticInfo: {
        endpoint: url,
        authentication: {
          isAuthenticated: req.isAuthenticated(),
          sessionID: req.sessionID,
          userId: req.user ? (req.user as any).id : null
        },
        requestInfo: {
          targetId,
          originalUrl: req.originalUrl,
          path: req.path,
          method: req.method
        },
        timestamp: new Date().toISOString()
      },
      message: "This is a diagnostic endpoint. In production, this would help identify authentication issues."
    });
  } catch (error) {
    console.error(`[Diagnostics] Error in test-crosswalks-by-target:`, error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
  }
});

export default router;