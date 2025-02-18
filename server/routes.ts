import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication and user management routes
  setupAuth(app);

  // Admin-only routes for user management
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.roleId !== 1) {
      return res.sendStatus(403);
    }
    const users = await storage.getAllUsers();
    res.json(users);
  });

  // Update user route
  app.patch("/api/users/:id", async (req, res) => {
    console.log('Received update request for user ID:', req.params.id);
    console.log('Update data:', req.body);

    if (!req.isAuthenticated()) {
      console.log('User not authenticated');
      return res.sendStatus(401);
    }

    const userId = Number(req.params.id);
    console.log('Authenticated user ID:', req.user.id, 'Role ID:', req.user.roleId);

    // Only allow users to update their own profile unless they're an admin
    if (req.user.id !== userId && req.user.roleId !== 1) {
      console.log('Permission denied: User cannot edit this profile');
      return res.sendStatus(403);
    }

    try {
      const user = await storage.updateUser(userId, req.body);
      console.log('Update result:', user);
      if (user) {
        res.json(user);
      } else {
        console.log('User not found');
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}