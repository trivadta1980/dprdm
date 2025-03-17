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
      console.log(`Login attempt for username: ${username}`);
      try {
        const user = await storage.getUserByUsername(username);
        console.log(`User found:`, user ? { id: user.id, username: user.username, isActive: user.isActive } : 'Not found');

        if (!user) {
          console.log('Login failed: User not found');
          return done(null, false, { message: "Invalid username or password" });
        }

        if (!user.isActive) {
          console.log('Login failed: Account inactive');
          return done(null, false, { message: "Account is inactive" });
        }

        const passwordMatch = await comparePasswords(password, user.password);
        console.log(`Password match result: ${passwordMatch}`);

        if (!passwordMatch) {
          console.log('Login failed: Password mismatch');
          return done(null, false, { message: "Invalid username or password" });
        }

        console.log('Login successful');
        return done(null, user);
      } catch (error) {
        console.error('Login error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    // Set JSON content type and prevent it from being overridden
    res.set({
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff'
    });

    console.log('Login request received:', {
      path: req.path,
      method: req.method,
      headers: req.headers
    });

    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error('Authentication error:', err);
        return res.status(500).json({ message: err.message || "Internal server error" });
      }
      if (!user) {
        console.log('Authentication failed:', info?.message);
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ message: err.message || "Failed to establish session" });
        }
        console.log('User logged in successfully:', user.username);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.use("/api", (req: Request, res: Response, next: NextFunction) => {
    if (req.path === "/login" || req.path === "/register" || req.path === "/reset-password/request" || req.path === "/reset-password") {
      return next();
    }

    if (!req.isAuthenticated()) {
      console.log('Unauthorized access attempt to:', req.path);
      return res.sendStatus(401);
    }
    next();
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

    const passwordToUse = req.body.password || DEFAULT_PASSWORD;
    const hashedPassword = await hashPassword(passwordToUse);
    const requireChange = !req.body.password;
    const user = await storage.createUser({
      ...req.body,
      password: hashedPassword,
      requirePasswordChange: requireChange,
      roleId: req.body.roleId || 3
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
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

    const success = await storage.deleteRole(roleId);
    if (success) {
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  });
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401);
  }
  next();
};