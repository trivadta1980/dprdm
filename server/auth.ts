import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, resetPasswordRequestSchema, resetPasswordSchema } from "@shared/schema";

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

export async function comparePasswords(supplied: string, stored: string) {
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
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      console.log(`[DEBUG Login] Login attempt for username: ${username}`);
      try {
        const user = await storage.getUserByUsername(username);
        console.log(`[DEBUG Login] User found:`, user ? { 
          id: user.id, 
          username: user.username, 
          isActive: user.isActive 
        } : 'Not found');

        if (!user) {
          console.log('[DEBUG Login] Login failed: User not found');
          return done(null, false, { message: "Invalid username or password" });
        }

        if (!user.isActive) {
          console.log('[DEBUG Login] Login failed: Account inactive');
          return done(null, false, { message: "Account is inactive" });
        }

        const passwordMatch = await comparePasswords(password, user.password);
        console.log(`[DEBUG Login] Password match result: ${passwordMatch}`);

        if (!passwordMatch) {
          console.log('[DEBUG Login] Login failed: Password mismatch');
          return done(null, false, { message: "Invalid username or password" });
        }

        console.log('[DEBUG Login] Login successful');
        return done(null, user);
      } catch (error) {
        console.error('[DEBUG Login] Login error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        // If user not found, return null instead of error to handle gracefully
        console.log(`[DEBUG Auth] User with id ${id} not found during deserialization`);
        return done(null, null);
      }
      done(null, user);
    } catch (error) {
      console.error('[DEBUG Auth] Error during user deserialization:', error);
      done(null, null); // Return null instead of error to prevent session failure
    }
  });

  app.post("/api/login", (req, res, next) => {
    res.set({
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff'
    });

    console.log('[DEBUG Login Route] Login request received:', {
      path: req.path,
      method: req.method,
      headers: req.headers
    });

    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error('[DEBUG Login Route] Authentication error:', err);
        return res.status(500).json({ message: err.message || "Internal server error" });
      }
      if (!user) {
        console.log('[DEBUG Login Route] Authentication failed:', info?.message);
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.logIn(user, async (err) => {
        if (err) {
          console.error('[DEBUG Login Route] Login error:', err);
          return res.status(500).json({ message: err.message || "Failed to establish session" });
        }
        
        console.log('[DEBUG Login Route] User logged in successfully:', user.username);
        
        // Log successful login for audit trail
        import('./utils/auditLogger').then(({ logCrudEvent }) => {
          logCrudEvent(
            req,
            'LOGIN',
            'USER',
            user.id.toString(),
            user.username,
            null,
            null,
            `User ${user.username} logged in successfully`,
            {
              ip: req.ip,
              userAgent: req.headers['user-agent'],
              loginTime: new Date().toISOString()
            }
          ).catch(err => console.error('Failed to log login event:', err));
        }).catch(err => console.error('Failed to import auditLogger for login:', err));
        
        // Get the user role information to include with the login response
        try {
          const userRole = await storage.getRole(user.roleId);
          
          // Combine the user and role data
          const userData = {
            ...user,
            routes: userRole?.routes || []
          };
          
          res.status(200).json(userData);
        } catch (error) {
          console.error('Error getting user role during login:', error);
          res.status(200).json(user); // Fall back to just the user if we can't get the role
        }
      });
    })(req, res, next);
  });

  app.use("/api", (req: Request, res: Response, next: NextFunction) => {
    console.log('[DEBUG Auth Middleware]', {
      path: req.path,
      method: req.method,
      isAuthenticated: req.isAuthenticated(),
      sessionID: req.sessionID,
      headers: {
        cookie: req.headers.cookie,
        authorization: req.headers.authorization
      }
    });

    // Allow external API routes with API key authentication 
    if (req.path.startsWith('/external/')) {
      console.log('[DEBUG Auth Middleware] External API route, skipping session auth check:', req.path);
      return next();
    }

    // Always allow public routes
    if (req.path === "/login" || req.path === "/register" || req.path === "/reset-password/request" || req.path === "/reset-password") {
      console.log('[DEBUG Auth Middleware] Skipping auth check for public route:', req.path);
      return next();
    }

    if (!req.isAuthenticated()) {
      console.log('[DEBUG Auth Middleware] Unauthorized access attempt:', {
        path: req.path,
        sessionID: req.sessionID
      });
      return res.sendStatus(401);
    }
    next();
  });

  app.post("/api/register", async (req, res, next) => {
    // Require admin role to create new users
    if (!req.isAuthenticated() || req.user.roleId !== 1) {
      return res.status(403).json({ message: "Only administrators can create new users" });
    }

    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const existingEmail = await storage.getUserByEmail(req.body.email);
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Use the provided password or fall back to the default
    const passwordToUse = req.body.password || DEFAULT_PASSWORD;
    const hashedPassword = await hashPassword(passwordToUse);
    
    // If admin provided a password, user doesn't need to change it immediately
    // If using default password, user will be required to change it
    const requireChange = !req.body.password || req.body.password === DEFAULT_PASSWORD;
    
    console.log(`[DEBUG Register] Creating user with ${requireChange ? 'required' : 'no required'} password change`);
    
    const user = await storage.createUser({
      ...req.body,
      password: hashedPassword,
      requirePasswordChange: requireChange,
      roleId: req.body.roleId || 3
    });

    // Don't automatically log in the created user
    try {
      const userRole = await storage.getRole(user.roleId);
      
      // Combine the user and role data
      const userData = {
        ...user,
        routes: userRole?.routes || []
      };
      
      res.status(201).json(userData);
    } catch (error) {
      console.error('Error getting user role during registration:', error);
      res.status(201).json(user); // Fall back to just the user if we can't get the role
    }
  });


  app.post("/api/logout", (req, res, next) => {
    // Store user info before logout since req.user will be cleared
    const userId = req.user?.id;
    const username = req.user?.username;

    // Log the logout event before actually logging out
    if (req.isAuthenticated() && userId) {
      import('./utils/auditLogger').then(({ logCrudEvent }) => {
        logCrudEvent(
          req,
          'LOGOUT',
          'USER',
          userId.toString(),
          username || 'Unknown User',
          null,
          null,
          `User ${username || 'Unknown'} logged out`,
          {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            logoutTime: new Date().toISOString()
          }
        ).catch(err => console.error('Failed to log logout event:', err));
      }).catch(err => console.error('Failed to import auditLogger for logout:', err));
    }

    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Get the user role information
    try {
      const userRole = await storage.getRole(req.user.roleId);
      
      // Combine the user and role data
      const userData = {
        ...req.user,
        routes: userRole?.routes || []
      };
      
      res.json(userData);
    } catch (error) {
      console.error('Error getting user role:', error);
      res.json(req.user); // Fall back to just the user if we can't get the role
    }
  });

  app.post("/api/reset-password/request", async (req, res) => {
    /* const result = resetPasswordRequestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(result.error);
    }

    const user = await storage.getUserByEmail(result.data.email);
    if (!user) {
      return res.sendStatus(200);
    }

    const token = await generateResetToken();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); 

    await storage.setResetToken(user.id, token, expiry);

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    });
    const resetLink = `${process.env.APP_URL || req.headers.origin}/reset-password?token=${token}`;
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Password Reset" <noreply@example.com>',
        to: result.data.email,
        subject: 'Password Reset Request',
        text: `You requested a password reset. Please use the following link to reset your password: ${resetLink}`,
        html: `
          <p>You requested a password reset.</p>
          <p>Please click the link below to reset your password:</p>
          <p><a href="${resetLink}">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this reset, please ignore this email.</p>
        `
      });
      console.log('Password reset email sent to:', result.data.email);
      res.sendStatus(200);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      if (process.env.NODE_ENV === "development") {
        res.json({ token, emailError: error.message });
      } else {
        res.status(500).json({ message: "Failed to send reset email" });
      }
    }*/
  });

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

  app.patch("/api/roles/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.roleId !== 1) {
      return res.sendStatus(403);
    }

    const roleId = Number(req.params.id);
    if (roleId === 1) {
      return res.status(403).send("Cannot modify admin role");
    }

    const existingRole = await storage.getRole(roleId);
    if (!existingRole) {
      return res.status(404).send("Role not found");
    }

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
    if (roleId === 1) {
      return res.status(403).send("Cannot delete admin role");
    }

    const result = await storage.deleteRole(roleId);
    if (!result.success) {
      if (result.message) {
        console.log('DELETE /api/roles/:id - Cannot delete role:', result.message);
        return res.status(409).json({ error: result.message });
      }
      console.log('DELETE /api/roles/:id - Role not found');
      return res.sendStatus(404);
    }
    console.log('DELETE /api/roles/:id - Role deleted successfully');
    res.sendStatus(200);
  });
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  console.log('[DEBUG RequireAuth]', {
    path: req.path,
    isAuthenticated: req.isAuthenticated(),
    sessionID: req.sessionID
  });

  if (!req.isAuthenticated()) {
    console.log('[DEBUG RequireAuth] Unauthorized access blocked');
    
    // Load these inside the condition to avoid circular dependencies
    import('./utils/auditLogger').then(({ logCrudEvent }) => {
      // Log the unauthorized access attempt
      logCrudEvent(
        req,
        'ERROR',
        'SYSTEM',
        `auth_${Date.now()}`,
        'Authentication Failure',
        null,
        null,
        `Unauthorized access attempt to ${req.method} ${req.path}`,
        {
          path: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }
      ).catch(err => console.error('Failed to log auth error:', err));
    }).catch(err => console.error('Failed to import auditLogger:', err));
    
    return res.sendStatus(401);
  }
  next();
};