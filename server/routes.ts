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

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);
  return httpServer;
}