import express, { Express, Request, Response, NextFunction } from 'express';
import { Server, createServer } from 'http';
import session from 'express-session';
import { storage } from './storage';
import { randomBytes } from 'crypto';
import { comparePasswords } from './auth';

// Fixed API Key routes
export function addApiKeyRoutes(app: Express) {
  // GET route for fetching API keys
  app.get('/api/-keys', async (req, res) => {
    if (!req.isAuthenticated()) {
      console.log('GET /api/-keys - Unauthorized access');
      return res.sendStatus(401);
    }
    console.log('GET /api/-keys - Request received');
    try {
      const apiKeys = await storage.getAllApiKeys();
      
      // Only admins can see all API keys
      const isAdmin = req.user.roleId === 1;
      
      // Filter keys if user is not admin to only show their own
      const filteredKeys = isAdmin 
        ? apiKeys 
        : apiKeys.filter(key => key.createdBy === req.user.id);
      
      // Don't send the actual key value for security
      const safeKeys = filteredKeys.map(key => {
        // Create a copy without the key field
        const { key: _, ...safeKey } = key;
        return safeKey;
      });
      
      console.log('GET /api/-keys - Keys fetched successfully:', safeKeys.length);
      res.json(safeKeys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      res.status(500).json({ error: 'Failed to fetch API keys' });
    }
  });
  
  // POST route for creating API keys with proper date handling
  app.post('/api/-keys', async (req, res) => {
    if (!req.isAuthenticated()) {
      console.log('POST /api/-keys - Unauthorized access');
      return res.sendStatus(401);
    }
    console.log('POST /api/-keys - Request received');
    try {
      // Generate a secure random key
      const apiKeyValue = randomBytes(32).toString('hex');
      
      // Extract only the fields we need from req.body to avoid date issues
      const { name, description, expiresAt } = req.body;
      
      // Create a proper Date object or undefined if expiresAt is provided
      let expiry = undefined;
      if (expiresAt) {
        expiry = new Date(expiresAt);
      }
      
      const apiKey = await storage.createApiKey({
        name,
        description,
        key: apiKeyValue,
        createdBy: req.user.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: expiry
      });
      
      console.log('POST /api/-keys - API key created successfully');
      
      // Only return the actual key value once during creation
      res.status(201).json({
        ...apiKey,
        key: apiKeyValue // Include the actual key only in the creation response
      });
    } catch (error) {
      console.error('POST /api/-keys - Error:', error);
      res.status(500).json({ error: String(error) });
    }
  });
}