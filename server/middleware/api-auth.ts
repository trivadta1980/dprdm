import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

/**
 * API Key Authentication Middleware
 * 
 * This middleware checks for a valid API key in the 'x-api-key' header.
 * It validates the key against the database and attaches the API key object to the request if valid.
 * 
 * Example usage:
 * app.use('/api/external', apiKeyAuth, externalRoutes);
 */
export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract API key from header
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Missing API key. Please provide a valid API key in the x-api-key header.' 
      });
    }

    // Validate API key
    const { valid, apiKey: apiKeyData } = await storage.validateApiKey(apiKey);

    if (!valid || !apiKeyData) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid API key. Please provide a valid API key.'
      });
    }

    // Attach API key to request for later use
    (req as any).apiKey = apiKeyData;
    
    // Log API usage (optional)
    console.log(`API call: ${req.method} ${req.path} [API Key: ${apiKeyData.name}]`);
    
    // Update last used timestamp
    await storage.updateApiKeyLastUsed(apiKeyData.id);
    
    next();
  } catch (error) {
    console.error('API Key Authentication Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'An error occurred while authenticating the API key.' 
    });
  }
};