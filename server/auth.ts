import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { resetPasswordRequestSchema, resetPasswordSchema } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function generateResetToken() {
  return randomBytes(32).toString("hex");
}

const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD || "Password123";

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !user.isActive || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const existingEmail = await storage.getUserByEmail(req.body.email);
    if (existingEmail) {
      return res.status(400).send("Email already exists");
    }

    // Use submitted password if provided, otherwise use DEFAULT_PASSWORD
    const passwordToUse = req.body.password || DEFAULT_PASSWORD;
    const hashedPassword = await hashPassword(passwordToUse);
    
    // If password was provided by user, they don't need to change it
    const requireChange = !req.body.password;
    
    const user = await storage.createUser({
      ...req.body,
      password: hashedPassword,
      requirePasswordChange: requireChange,
      roleId: req.body.roleId || 3 // Use provided role or default to 'user' (ID 3)
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Password reset request
  app.post("/api/reset-password/request", async (req, res) => {
    const result = resetPasswordRequestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(result.error);
    }

    const user = await storage.getUserByEmail(result.data.email);
    if (!user) {
      // Don't reveal whether the email exists
      return res.sendStatus(200);
    }

    const token = await generateResetToken();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // Token expires in 1 hour

    await storage.setResetToken(user.id, token, expiry);

    // TODO: Send email with reset link
    // For development, we'll just return the token
    if (process.env.NODE_ENV === "development") {
      res.json({ token });
    } else {
      res.sendStatus(200);
    }
  });

  // Reset password with token
  app.post("/api/reset-password", async (req, res) => {
    const result = resetPasswordSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(result.error);
    }

    const { token, password } = result.data;
    const user = await storage.getUserByResetToken(token);

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return res.status(400).send("Invalid or expired reset token");
    }

    const hashedPassword = await hashPassword(password);
    await storage.updatePassword(user.id, hashedPassword);
    await storage.clearResetToken(user.id);

    res.sendStatus(200);
  });

  // Role management (admin only)
  app.post("/api/roles", async (req, res) => {
    if (!req.isAuthenticated() || req.user.roleId !== 1) {
      return res.sendStatus(403);
    }

    const existingRole = await storage.getRoleByName(req.body.name);
    if (existingRole) {
      return res.status(400).send("Role already exists");
    }

    const role = await storage.createRole(req.body);
    res.status(201).json(role);
  });

  app.get("/api/roles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const roles = await storage.getAllRoles();
    res.json(roles);
  });

  // User management (admin only)
  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.roleId !== 1) {
      return res.sendStatus(403);
    }

    const success = await storage.deleteUser(Number(req.params.id));
    if (success) {
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = Number(req.params.id);
    // Only allow users to update their own profile unless they're an admin
    if (req.user.id !== userId && req.user.roleId !== 1) {
      return res.sendStatus(403);
    }

    const user = await storage.updateUser(userId, req.body);
    if (user) {
      res.json(user);
    } else {
      res.sendStatus(404);
    }
  });

  // Add password change endpoint
  app.post("/api/change-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    const { currentPassword, newPassword } = req.body;
    const user = await storage.getUser(req.user.id);

    if (!user) {
      return res.sendStatus(404);
    }

    if (!(await comparePasswords(currentPassword, user.password))) {
      return res.status(400).send("Current password is incorrect");
    }

    const hashedNewPassword = await hashPassword(newPassword);
    await storage.updatePassword(user.id, hashedNewPassword);
    await storage.updateRequirePasswordChange(user.id, false);

    res.sendStatus(200);
  });

  // Add these routes after the existing role routes in setupAuth function
  app.patch("/api/roles/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.roleId !== 1) {
      return res.sendStatus(403);
    }

    const roleId = Number(req.params.id);

    // Prevent modifying admin role
    if (roleId === 1) {
      return res.status(403).send("Cannot modify admin role");
    }

    const existingRole = await storage.getRole(roleId);
    if (!existingRole) {
      return res.status(404).send("Role not found");
    }

    // Check if name is being changed and if it already exists
    if (req.body.name !== existingRole.name) {
      const roleWithName = await storage.getRoleByName(req.body.name);
      if (roleWithName) {
        return res.status(400).send("Role name already exists");
      }
    }

    const role = await storage.updateRole(roleId, req.body);
    res.json(role);
  });

  app.delete("/api/roles/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.roleId !== 1) {
      return res.sendStatus(403);
    }

    const roleId = Number(req.params.id);

    // Prevent deleting admin role
    if (roleId === 1) {
      return res.status(403).send("Cannot delete admin role");
    }

    const success = await storage.deleteRole(roleId);
    if (success) {
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  });
}