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
  const apiKey = req.headers['x-api-key'] as string;
  
  console.log('API Key Auth - Checking for API key');
  
  if (!apiKey) {
    console.log('API Key Auth - No API key provided');
    return res.status(401).json({ error: 'API key is required' });
  }
  
  try {
    // Validate the API key
    const { valid, apiKey: apiKeyDetails } = await storage.validateApiKey(apiKey);
    
    if (!valid || !apiKeyDetails) {
      console.log('API Key Auth - Invalid API key');
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    // Check if the key is active
    if (!apiKeyDetails.isActive) {
      console.log('API Key Auth - API key is inactive');
      return res.status(401).json({ error: 'API key is inactive' });
    }
    
    // Check if the key has expired
    if (apiKeyDetails.expiresAt && new Date(apiKeyDetails.expiresAt) < new Date()) {
      console.log('API Key Auth - API key has expired');
      return res.status(401).json({ error: 'API key has expired' });
    }
    
    // Update the last used timestamp
    await storage.updateApiKeyLastUsed(apiKeyDetails.id);
    
    // Attach the API key details to the request for later use
    (req as any).apiKey = apiKeyDetails;
    
    console.log('API Key Auth - Valid API key for:', apiKeyDetails.name);
    next();
  } catch (error) {
    console.error('API Key Auth - Error validating API key:', error);
    res.status(500).json({ error: 'Error validating API key' });
  }
};