import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

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
    // Get API key from header
    const apiKey = req.headers['x-api-key'] as string;
    
    // If no API key is provided, return unauthorized
    if (!apiKey) {
      return res.status(401).json({
        status: 'error',
        message: 'API key is required'
      });
    }
    
    // Validate the API key
    const { valid, apiKey: validApiKey } = await storage.validateApiKey(apiKey);
    
    if (!valid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid API key'
      });
    }
    
    // Attach the API key to the request for potential later use
    // Note: TypeScript definition extension
    (req as any).apiKey = validApiKey;
    
    next();
  } catch (error) {
    console.error('API Key Auth Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during API authentication'
    });
  }
};