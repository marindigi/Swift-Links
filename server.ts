import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { nanoid } from "nanoid";
import Database from "better-sqlite3";
import session from "express-session";
import bcrypt from "bcryptjs";
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import { UAParser } from 'ua-parser-js';
import dns from 'node:dns';
import { promisify } from 'node:util';
import helmet from "helmet";
import { rateLimit as expressRateLimit } from "express-rate-limit";

const resolveTxt = promisify(dns.resolveTxt);

const SUPABASE_URL = process.env.SUPABASE_URL || "https://agqxtvotqgndohhtdvov.supabase.co";
const SUPABASE_PUBLIC_KEY = process.env.SUPABASE_PUBLIC_KEY || "sb_publishable_kUE5pMvbhzYTS5HgTUDauQ_i9iKzn-I";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

// Initialize Stripe lazily
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia' as any,
    });
  }
  return stripe;
};

// Email Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  ...(process.env.SMTP_USER && process.env.SMTP_PASS ? {
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    }
  } : {}),
});

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Email sending skipped: SMTP credentials not configured.');
      console.log(`To: ${to}\nSubject: ${subject}\nBody: ${html}`);
      return;
    }
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Cutly" <noreply@cutly.us>',
      to,
      subject,
      html,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};

const db = new Database("database.sqlite");

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    plan TEXT DEFAULT 'free',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Add columns if they don't exist (migration)
try {
  db.exec("ALTER TABLE users ADD COLUMN stripeCustomerId TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free'");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN name TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE urls ADD COLUMN expiresAt DATETIME");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN expiresAt DATETIME");
} catch (e) {}
try {
  db.exec("ALTER TABLE clicks ADD COLUMN city TEXT DEFAULT 'Unknown'");
} catch (e) {}
try {
  db.exec("ALTER TABLE clicks ADD COLUMN device TEXT DEFAULT 'Unknown'");
} catch (e) {}
try {
  db.exec("ALTER TABLE clicks ADD COLUMN browser TEXT DEFAULT 'Unknown'");
} catch (e) {}
try {
  db.exec("ALTER TABLE clicks ADD COLUMN os TEXT DEFAULT 'Unknown'");
} catch (e) {}
try {
  db.exec("ALTER TABLE domains ADD COLUMN verificationToken TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE domains ADD COLUMN verificationType TEXT DEFAULT 'txt'");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN pendingPlan TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN message TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN notify_link_created BOOLEAN DEFAULT 1");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN notify_weekly_report BOOLEAN DEFAULT 1");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN notify_plan_expiry BOOLEAN DEFAULT 1");
} catch (e) {}

// Promote specific user to admin
const adminEmail = process.env.ADMIN_EMAIL || "mcs.marinroeun@gmail.com";
const adminUser = db.prepare("SELECT * FROM users WHERE email = ?").get(adminEmail);
if (adminUser) {
  db.prepare("UPDATE users SET role = 'admin', plan = 'enterprise' WHERE email = ?").run(adminEmail);
}

// Create tasks table
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    userId TEXT,
    title TEXT,
    description TEXT,
    completed BOOLEAN DEFAULT 0,
    dueDate DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  );
`);

// Seed admin user
const adminPassword = process.env.ADMIN_PASSWORD || "8899";
const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10);
const existingAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get("admin") as any;
if (!existingAdmin) {
  db.prepare("INSERT INTO users (id, email, password) VALUES (?, ?, ?)").run(
    "admin-id",
    "admin",
    hashedAdminPassword
  );
} else {
  db.prepare("UPDATE users SET password = ? WHERE email = ?").run(hashedAdminPassword, "admin");
}

// Seed dearm user
const dearmPassword = process.env.DEARM_PASSWORD || "D2026";
const hashedDearmPassword = bcrypt.hashSync(dearmPassword, 10);
const existingDearm = db.prepare("SELECT * FROM users WHERE email = ?").get("dearm") as any;
if (!existingDearm) {
  db.prepare("INSERT INTO users (id, email, password) VALUES (?, ?, ?)").run(
    "dearm-id",
    "dearm",
    hashedDearmPassword
  );
} else {
  db.prepare("UPDATE users SET password = ? WHERE email = ?").run(hashedDearmPassword, "dearm");
}

// Seed puluy user
const puluyPassword = process.env.PULUY_PASSWORD || "P2026";
const hashedPuluyPassword = bcrypt.hashSync(puluyPassword, 10);
const existingPuluy = db.prepare("SELECT * FROM users WHERE email = ?").get("puluy") as any;
if (!existingPuluy) {
  db.prepare("INSERT INTO users (id, email, password) VALUES (?, ?, ?)").run(
    "puluy-id",
    "puluy",
    hashedPuluyPassword
  );
} else {
  db.prepare("UPDATE users SET password = ? WHERE email = ?").run(hashedPuluyPassword, "puluy");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS urls (
    id TEXT PRIMARY KEY,
    originalUrl TEXT,
    domainId TEXT,
    domainName TEXT,
    userId TEXT,
    clicks INTEGER DEFAULT 0,
    expiresAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS domains (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE,
    userId TEXT,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS landing_features (
    id TEXT PRIMARY KEY,
    icon TEXT,
    title TEXT,
    description TEXT,
    displayOrder INTEGER
  );

  CREATE TABLE IF NOT EXISTS landing_faqs (
    id TEXT PRIMARY KEY,
    question TEXT,
    answer TEXT,
    displayOrder INTEGER
  );
`);

// Seed default settings if empty
const settingsCount = db.prepare("SELECT COUNT(*) as count FROM settings").get() as any;
if (settingsCount.count === 0) {
  const defaults = [
    ['site_name', 'Cutly'],
    ['site_description', 'The enterprise-grade link management platform for modern teams.'],
    ['hero_title', 'SHORTEN. ANALYZE. SCALE.'],
    ['hero_subtitle', 'The enterprise-grade link management platform for modern teams. Build trust, track performance, and scale your reach.'],
    ['hero_accent_word', 'ANALYZE.'],
    ['stats_uptime', '99.9%'],
    ['stats_support', '24/7']
  ];
  const insert = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  defaults.forEach(([k, v]) => insert.run(k, v));
}

// Seed default features if empty
const featuresCount = db.prepare("SELECT COUNT(*) as count FROM landing_features").get() as any;
if (featuresCount.count === 0) {
  const defaultFeatures = [
    ['f1', 'BarChart2', 'Real-time Analytics', 'Track every click with detailed geographic and referrer data. Understand your audience like never before.', 1],
    ['f2', 'Globe', 'Custom Domains', 'Use your own brand\'s domain for a professional look. Build trust with every link you share.', 2],
    ['f3', 'History', 'Bulk Management', 'Generate and manage hundreds of links in seconds. Perfect for large-scale marketing campaigns.', 3],
    ['f4', 'Shield', 'Secure & Private', 'Enterprise-grade security for all your sensitive data. Your links are protected by industry-leading protocols.', 4],
    ['f5', 'Zap', 'Lightning Fast', 'Optimized redirects that happen in milliseconds. No more waiting for your audience to reach their destination.', 5],
    ['f6', 'Settings', 'API Access', 'Integrate link shortening directly into your workflow with our robust and well-documented API.', 6]
  ];
  const insert = db.prepare("INSERT INTO landing_features (id, icon, title, description, displayOrder) VALUES (?, ?, ?, ?, ?)");
  defaultFeatures.forEach(f => insert.run(...f));
}

// Seed default FAQs if empty
const faqsCount = db.prepare("SELECT COUNT(*) as count FROM landing_faqs").get() as any;
if (faqsCount.count === 0) {
  const defaultFaqs = [
    ['q1', 'Can I use my own custom domain?', 'Yes! All paid plans include custom domain support. You can easily connect your own domain or subdomain to keep your brand consistent across all your links.', 1],
    ['q2', 'What happens if I exceed my monthly link limit?', 'We\'ll never block your existing links. If you exceed your creation limit, you won\'t be able to create new links until the next billing cycle, or you can upgrade your plan instantly.', 2],
    ['q3', 'Do you offer an API?', 'Absolutely. Our Enterprise and Professional plans include full API access so you can programmatically create, manage, and track your links directly from your own applications.', 3],
    ['q4', 'How detailed are the analytics?', 'Our analytics track clicks, unique visitors, geographic location (country/city), device types, browsers, and referring sources in real-time.', 4]
  ];
  const insert = db.prepare("INSERT INTO landing_faqs (id, question, answer, displayOrder) VALUES (?, ?, ?, ?)");
  defaultFaqs.forEach(f => insert.run(...f));
}

db.exec(`
  CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    urlId TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    userAgent TEXT,
    referer TEXT,
    country TEXT DEFAULT 'Unknown',
    FOREIGN KEY(urlId) REFERENCES urls(id)
  );

  CREATE TABLE IF NOT EXISTS apiKeys (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE,
    name TEXT,
    userId TEXT,
    userEmail TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS rateLimits (
    apiKey TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0,
    resetAt DATETIME
  );
`);

try {
  db.exec(`ALTER TABLE domains ADD COLUMN status TEXT DEFAULT 'pending';`);
} catch (e) {
  // Column might already exist
}

// Rate limiting middleware
const rateLimit = (req: any, res: any, next: any) => {
  const apiKeyHeader = req.headers['x-api-key'];
  if (!apiKeyHeader) return next(); // Only rate limit API keys, not sessions

  const limit = 100; // 100 requests per hour
  const now = new Date();
  
  let record = db.prepare("SELECT * FROM rateLimits WHERE apiKey = ?").get(apiKeyHeader) as any;
  
  if (!record) {
    const resetAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    db.prepare("INSERT INTO rateLimits (apiKey, count, resetAt) VALUES (?, 1, ?)").run(apiKeyHeader, resetAt.toISOString());
    return next();
  }

  if (now > new Date(record.resetAt)) {
    // Reset counter
    const resetAt = new Date(now.getTime() + 60 * 60 * 1000);
    db.prepare("UPDATE rateLimits SET count = 1, resetAt = ? WHERE apiKey = ?").run(resetAt.toISOString(), apiKeyHeader);
    return next();
  }

  if (record.count >= limit) {
    return res.status(429).json({ error: "Rate limit exceeded. Try again later." });
  }

  db.prepare("UPDATE rateLimits SET count = count + 1 WHERE apiKey = ?").run(apiKeyHeader);
  next();
};

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const PORT = 3000;

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for now as it might break Vite in dev
    crossOriginEmbedderPolicy: false,
  }));

  // General rate limit
  const generalLimiter = expressRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/", generalLimiter);

  // Auth rate limit
  const authLimiter = expressRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit each IP to 20 requests per windowMs
    message: { error: "Too many attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);

  app.use(express.json());
  app.use(session({
    secret: process.env.SESSION_SECRET || "cutly-secret-dev-only",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }));

  // Middleware to verify Session or API Key
  const authenticate = async (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error: _error } = await supabase.auth.getUser(token);
      if (user) {
        // Sync user to local DB
        let existingUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as any;
        
        if (!existingUser && user.email) {
          // Try to find by email if not found by ID
          existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(user.email) as any;
          if (existingUser) {
            // Update ID to Supabase ID and also update foreign keys
            db.prepare("UPDATE users SET id = ? WHERE email = ?").run(user.id, user.email);
            db.prepare("UPDATE urls SET userId = ? WHERE userId = ?").run(user.id, existingUser.id);
            db.prepare("UPDATE domains SET userId = ? WHERE userId = ?").run(user.id, existingUser.id);
            db.prepare("UPDATE apiKeys SET userId = ? WHERE userId = ?").run(user.id, existingUser.id);
            db.prepare("UPDATE tasks SET userId = ? WHERE userId = ?").run(user.id, existingUser.id);
            // Refresh existingUser with new ID
            existingUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as any;
          }
        }

        let role = existingUser?.role || 'user';
        let plan = existingUser?.plan || 'free';
        let status = existingUser?.status || 'active';
        let expiresAt = existingUser?.expiresAt;

        // Check for plan expiration
        if (expiresAt && new Date(expiresAt) < new Date() && plan !== 'free') {
          console.log(`[Auth] Plan expired for user ${user.id}. Downgrading to free.`);
          db.prepare("UPDATE users SET plan = 'free', expiresAt = NULL WHERE id = ?").run(user.id);
          plan = 'free';
          expiresAt = null;
        }

        // Use existing name/avatar if available locally, otherwise try to get from metadata (if we had it)
        let name = existingUser?.name || user.user_metadata?.full_name || user.user_metadata?.name || null;
        let avatar_url = existingUser?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

        if (user.email === adminEmail || user.email === 'mcs.roeunmarin@gmail.com') {
          role = 'admin';
          plan = 'enterprise';
          status = 'active';
        }

        if (!existingUser) {
          db.prepare("INSERT INTO users (id, email, role, plan, status, name, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)").run(user.id, user.email, role, plan, status, name, avatar_url);
        } else {
          db.prepare("UPDATE users SET email = ?, role = ?, plan = ?, status = ?, name = COALESCE(name, ?), avatar_url = COALESCE(avatar_url, ?) WHERE id = ?").run(user.email, role, plan, status, name, avatar_url, user.id);
        }
        
        req.user = { uid: user.id, email: user.email, role, plan, status, expiresAt, name, avatar_url, isAnonymous: false };
        return next();
      }
    }

    const apiKeyHeader = req.headers['x-api-key'];

    if (apiKeyHeader) {
      const apiKey = db.prepare("SELECT * FROM apiKeys WHERE key = ?").get(apiKeyHeader) as any;
      if (apiKey) {
        // Get user role/plan
        const user = db.prepare("SELECT role, plan, name, avatar_url FROM users WHERE id = ?").get(apiKey.userId) as any;
        req.user = { 
          uid: apiKey.userId, 
          email: apiKey.userEmail, 
          role: user?.role || 'user', 
          plan: user?.plan || 'free',
          name: user?.name,
          avatar_url: user?.avatar_url,
          isAnonymous: false 
        };
        return rateLimit(req, res, next);
      }
      return res.status(401).json({ error: "Invalid API Key" });
    }

    const sessionUserId = (req.session as any).userId;
    
    if (!sessionUserId) {
      // For /api/auth/me, we don't want to auto-create a session
      if (req.path === '/api/auth/me') {
        return res.status(401).json({ error: "Not logged in" });
      }
      (req.session as any).userId = nanoid();
    }

    const userId = (req.session as any).userId;

    // Check if user is registered (has a password)
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    
    if (!user) {
      // Create anonymous user
      db.prepare("INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)").run(
        userId,
        `anon_${userId.substring(0, 8)}@cutly.local`
      );
      req.user = { uid: userId, email: null, role: 'user', plan: 'free', name: null, avatar_url: null, isAnonymous: true };
    } else {
      let role = user.role || 'user';
      let plan = user.plan || 'free';
      
      // Check for plan expiration
      if (user.expiresAt && new Date(user.expiresAt) < new Date() && plan !== 'free') {
        plan = 'free';
        db.prepare("UPDATE users SET plan = ?, expiresAt = NULL WHERE id = ?").run(plan, user.id);
      }

      if (user.email === adminEmail || user.email === 'mcs.roeunmarin@gmail.com') {
        role = 'admin';
        plan = 'enterprise';
        // Ensure DB is updated
        db.prepare("UPDATE users SET role = ?, plan = ? WHERE id = ?").run(role, plan, user.id);
      }
      req.user = { 
        uid: user.id, 
        email: user.email, 
        role, 
        plan, 
        name: user.name, 
        avatar_url: user.avatar_url, 
        isAnonymous: !user.password,
        status: user.status || 'active',
        expiresAt: user.expiresAt
      };
    }

    // If accessing protected routes (like analytics or keys) and is anonymous, return 401
    const protectedRoutes = ['/api/keys', '/api/analytics', '/api/admin'];
    if (req.user.isAnonymous && protectedRoutes.some(route => req.path.startsWith(route))) {
      return res.status(401).json({ error: "Authentication required" });
    }

    return next();
  };

  // Admin Middleware
  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    next();
  };

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    if (req.user.isAnonymous) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const linkCount = db.prepare("SELECT COUNT(*) as count FROM urls WHERE userId = ? AND createdAt >= ?").get(req.user.uid, startOfMonth.toISOString()) as any;
    const domainCount = db.prepare("SELECT COUNT(*) as count FROM domains WHERE userId = ?").get(req.user.uid) as any;

    const user = db.prepare("SELECT pendingPlan FROM users WHERE id = ?").get(req.user.uid) as any;

    res.json({ 
      id: req.user.uid, 
      email: req.user.email,
      role: req.user.role,
      plan: req.user.plan,
      pendingPlan: user?.pendingPlan,
      name: req.user.name,
      avatar_url: req.user.avatar_url,
      status: req.user.status,
      expiresAt: req.user.expiresAt,
      usage: {
        linksThisMonth: linkCount.count,
        domains: domainCount.count
      }
    });
  });

  // Admin Routes
  app.get("/api/admin/users", authenticate, requireAdmin, (_req: any, res) => {
    try {
      const users = db.prepare("SELECT id, email, role, plan, pendingPlan, name, avatar_url, status, expiresAt, createdAt, message FROM users ORDER BY createdAt DESC").all() as any[];
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const startOfMonthStr = startOfMonth.toISOString();

      const usersWithUsage = users.map(user => {
        const usage = db.prepare("SELECT COUNT(*) as count FROM urls WHERE userId = ? AND createdAt >= ?").get(user.id, startOfMonthStr) as any;
        return {
          ...user,
          usage: {
            linksThisMonth: usage?.count || 0
          }
        };
      });

      res.json(usersWithUsage);
    } catch (error) {
      console.error("Fetch users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users/:id/update", authenticate, requireAdmin, (req: any, res) => {
    const { role, plan, status, expiresAt, pendingPlan, name, email, message } = req.body;
    const { id } = req.params;
    
    try {
      const updates = [];
      const values = [];
      
      if (role) { updates.push("role = ?"); values.push(role); }
      if (plan) { updates.push("plan = ?"); values.push(plan); }
      if (status) { updates.push("status = ?"); values.push(status); }
      if (name !== undefined) { updates.push("name = ?"); values.push(name); }
      if (email !== undefined) { updates.push("email = ?"); values.push(email); }
      if (message !== undefined) { updates.push("message = ?"); values.push(message); }
      if (pendingPlan !== undefined) {
        updates.push("pendingPlan = ?");
        values.push(pendingPlan === '' ? null : pendingPlan);
      }
      if (expiresAt !== undefined) { 
        updates.push("expiresAt = ?"); 
        values.push(expiresAt === '' ? null : expiresAt); 
      }
      
      if (updates.length > 0) {
        values.push(id);
        const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
        db.prepare(query).run(...values);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", authenticate, requireAdmin, (req: any, res) => {
    const { id } = req.params;
    if (id === req.user.uid) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }
    try {
      // Delete related data first to avoid foreign key constraints
      
      // 1. Delete clicks for user's URLs
      const userUrls = db.prepare("SELECT id FROM urls WHERE userId = ?").all(id);
      const urlIds = userUrls.map((u: any) => u.id);
      
      if (urlIds.length > 0) {
        const placeholders = urlIds.map(() => '?').join(',');
        db.prepare(`DELETE FROM clicks WHERE urlId IN (${placeholders})`).run(...urlIds);
      }

      // 2. Delete URLs, Domains, API Keys
      db.prepare("DELETE FROM urls WHERE userId = ?").run(id);
      db.prepare("DELETE FROM domains WHERE userId = ?").run(id);
      db.prepare("DELETE FROM apiKeys WHERE userId = ?").run(id);
      
      // 3. Finally delete the user
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    console.log(`[Login Attempt] Email: ${email}`);
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    
    if (user) {
      console.log(`[Login] User found: ${user.email}, hasPassword: ${!!user.password}`);
      if (user.password && bcrypt.compareSync(password, user.password)) {
        console.log(`[Login] Password match for ${email}`);
        (req.session as any).userId = user.id;
        return res.json({ id: user.id, email: user.email });
      } else {
        console.log(`[Login] Password mismatch for ${email}`);
      }
    } else {
      console.log(`[Login] User not found: ${email}`);
    }
    
    res.status(401).json({ error: "Invalid credentials" });
  });

  app.post("/api/auth/register", (req, res) => {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    try {
      const id = nanoid();
      const hashedPassword = bcrypt.hashSync(password, 10);
      
      db.prepare("INSERT INTO users (id, email, password) VALUES (?, ?, ?)").run(
        id,
        email,
        hashedPassword
      );

      (req.session as any).userId = id;
      res.json({ id, email, name });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Failed to logout" });
      res.json({ success: true });
    });
  });

  // Stripe Payment Routes
  app.post("/api/payments/create-checkout-session", authenticate, async (req: any, res) => {
    const { plan, interval } = req.body;
    const s = getStripe();
    
    if (!s) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }

    if (req.user.isAnonymous) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      // Define prices (in a real app, these would be in Stripe dashboard)
      const prices: Record<string, Record<string, number>> = {
        pro: { monthly: 1200, yearly: 12000 },
        enterprise: { monthly: 4900, yearly: 46800 }
      };

      if (!prices[plan]) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      const amount = prices[plan][interval];
      const session = await s.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Cutly ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan (${interval})`,
                description: `Subscription to Cutly ${plan} plan`,
              },
              unit_amount: amount,
              recurring: {
                interval: interval === 'monthly' ? 'month' : 'year',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/dashboard?payment=success`,
        cancel_url: `${req.headers.origin}/pricing?payment=cancelled`,
        customer_email: req.user.email,
        metadata: {
          userId: req.user.uid,
          plan: plan,
          interval: interval
        },
      });

      // Store pending plan
      db.prepare("UPDATE users SET pendingPlan = ? WHERE id = ?").run(plan, req.user.uid);

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe session error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe Webhook
  app.post("/api/payments/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const s = getStripe();

    if (!s || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(500).json({ error: "Stripe webhook not configured" });
    }

    let event;

    try {
      event = s.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        const customerId = session.customer as string;
        
        if (userId && plan) {
          // Update user plan and customer ID
          const expiresAt = new Date();
          if (session.metadata?.interval === 'monthly') {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          } else {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          }
          
          db.prepare("UPDATE users SET plan = ?, pendingPlan = NULL, expiresAt = ?, stripeCustomerId = ? WHERE id = ?").run(
            plan,
            expiresAt.toISOString(),
            customerId,
            userId
          );
          console.log(`[Stripe] Plan updated for user ${userId} to ${plan}, customer: ${customerId}`);
        }
        break;
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        // In a real app, you'd look up the user by Stripe customer ID
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  // Payment Method Management
  app.get("/api/payments/methods", authenticate, async (req: any, res) => {
    const s = getStripe();
    if (!s) return res.status(500).json({ error: "Stripe not configured" });

    const user = db.prepare("SELECT stripeCustomerId FROM users WHERE id = ?").get(req.user.uid) as any;
    if (!user?.stripeCustomerId) {
      return res.json({ methods: [], defaultMethodId: null });
    }

    try {
      const paymentMethods = await s.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      const customer = await s.customers.retrieve(user.stripeCustomerId) as Stripe.Customer;
      const defaultMethodId = customer.invoice_settings.default_payment_method as string;

      res.json({ 
        methods: paymentMethods.data.map(pm => ({
          id: pm.id,
          brand: pm.card?.brand,
          last4: pm.card?.last4,
          expMonth: pm.card?.exp_month,
          expYear: pm.card?.exp_year,
        })),
        defaultMethodId
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payments/methods/:id/default", authenticate, async (req: any, res) => {
    const s = getStripe();
    if (!s) return res.status(500).json({ error: "Stripe not configured" });

    const user = db.prepare("SELECT stripeCustomerId FROM users WHERE id = ?").get(req.user.uid) as any;
    if (!user?.stripeCustomerId) return res.status(404).json({ error: "Customer not found" });

    try {
      await s.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: req.params.id,
        },
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/payments/methods/:id", authenticate, async (req: any, res) => {
    const s = getStripe();
    if (!s) return res.status(500).json({ error: "Stripe not configured" });

    try {
      await s.paymentMethods.detach(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payments/create-setup-session", authenticate, async (req: any, res) => {
    const s = getStripe();
    if (!s) return res.status(500).json({ error: "Stripe not configured" });

    let user = db.prepare("SELECT stripeCustomerId FROM users WHERE id = ?").get(req.user.uid) as any;
    
    try {
      if (!user?.stripeCustomerId) {
        const customer = await s.customers.create({
          email: req.user.email,
          metadata: { userId: req.user.uid }
        });
        db.prepare("UPDATE users SET stripeCustomerId = ? WHERE id = ?").run(customer.id, req.user.uid);
        user = { stripeCustomerId: customer.id };
      }

      const session = await s.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'setup',
        customer: user.stripeCustomerId,
        success_url: `${req.headers.origin}/profile?payment_setup=success`,
        cancel_url: `${req.headers.origin}/profile?payment_setup=cancelled`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/profile/update", authenticate, (req: any, res) => {
    const { name, email, avatar_url } = req.body;
    
    if (req.user.isAnonymous) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      // Check if email is already taken by another user
      if (email && email !== req.user.email) {
        const existingUser = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email, req.user.uid);
        if (existingUser) {
          return res.status(400).json({ error: "Email is already in use" });
        }
      }

      db.prepare("UPDATE users SET email = ?, name = ?, avatar_url = ? WHERE id = ?").run(email, name, avatar_url, req.user.uid);
      
      const updatedUser = db.prepare("SELECT id, email, name, avatar_url, role, plan, createdAt FROM users WHERE id = ?").get(req.user.uid) as any;
      res.json(updatedUser);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.post("/api/profile/delete", authenticate, (req: any, res) => {
    if (req.user.isAnonymous) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const id = req.user.uid;
      
      // Delete related data
      const userUrls = db.prepare("SELECT id FROM urls WHERE userId = ?").all(id);
      const urlIds = userUrls.map((u: any) => u.id);
      
      if (urlIds.length > 0) {
        const placeholders = urlIds.map(() => '?').join(',');
        db.prepare(`DELETE FROM clicks WHERE urlId IN (${placeholders})`).run(...urlIds);
      }

      db.prepare("DELETE FROM urls WHERE userId = ?").run(id);
      db.prepare("DELETE FROM domains WHERE userId = ?").run(id);
      db.prepare("DELETE FROM apiKeys WHERE userId = ?").run(id);
      db.prepare("DELETE FROM tasks WHERE userId = ?").run(id);
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
      
      req.session.destroy(() => {
        res.json({ success: true });
      });
    } catch (error) {
      console.error("Delete profile error:", error);
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });

  app.post("/api/profile/upgrade", authenticate, (req: any, res) => {
    const { plan } = req.body;
    if (!['pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    try {
      db.prepare("UPDATE users SET pendingPlan = ? WHERE id = ?").run(plan, req.user.uid);
      res.json({ success: true, pendingPlan: plan });
    } catch (error) {
      res.status(500).json({ error: "Failed to request upgrade" });
    }
  });

  app.post("/api/profile/message/dismiss", authenticate, (req: any, res) => {
    try {
      db.prepare("UPDATE users SET message = NULL WHERE id = ?").run(req.user.uid);
      res.json({ success: true });
    } catch (error) {
      console.error("Dismiss message error:", error);
      res.status(500).json({ error: "Failed to dismiss message" });
    }
  });

  app.get("/api/profile/notifications", authenticate, (req: any, res) => {
    if (req.user.isAnonymous) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      const user = db.prepare("SELECT notify_link_created, notify_weekly_report, notify_plan_expiry FROM users WHERE id = ?").get(req.user.uid) as any;
      res.json({
        notify_link_created: user?.notify_link_created !== 0,
        notify_weekly_report: user?.notify_weekly_report !== 0,
        notify_plan_expiry: user?.notify_plan_expiry !== 0
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notification settings" });
    }
  });

  app.post("/api/profile/notifications", authenticate, (req: any, res) => {
    if (req.user.isAnonymous) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const { notify_link_created, notify_weekly_report, notify_plan_expiry } = req.body;
    try {
      db.prepare("UPDATE users SET notify_link_created = ?, notify_weekly_report = ?, notify_plan_expiry = ? WHERE id = ?").run(
        notify_link_created ? 1 : 0,
        notify_weekly_report ? 1 : 0,
        notify_plan_expiry ? 1 : 0,
        req.user.uid
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update notification settings" });
    }
  });

  // URL Management APIs
  app.get("/api/urls", authenticate, (req: any, res) => {
    const urls = db.prepare("SELECT * FROM urls WHERE userId = ? ORDER BY createdAt DESC").all(req.user.uid);
    res.json(urls);
  });

  app.delete("/api/urls/:id", authenticate, (req: any, res) => {
    const result = db.prepare("DELETE FROM urls WHERE id = ? AND userId = ?").run(req.params.id, req.user.uid);
    if (result.changes === 0) {
      return res.status(404).json({ error: "URL not found" });
    }
    res.json({ success: true });
  });

  // Domain Management APIs
  app.get("/api/domains", (_req, res) => {
    const domains = db.prepare("SELECT * FROM domains ORDER BY createdAt DESC").all();
    res.json(domains);
  });

// Plan Limits
const PLAN_LIMITS = {
  free: {
    domains: 1,
    linksPerMonth: 50
  },
  pro: {
    domains: 5,
    linksPerMonth: Infinity
  },
  enterprise: {
    domains: Infinity,
    linksPerMonth: Infinity
  }
};

// Helper to check link limits
const checkLinkLimit = (userId: string, count = 1) => {
  const user = db.prepare("SELECT plan, status FROM users WHERE id = ?").get(userId) as any;
  
  if (user?.status === 'inactive') {
    throw new Error("Your account is inactive. Please contact support.");
  }

  const plan = (user?.plan || 'free') as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan];

  if (limits.linksPerMonth === Infinity) return true;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const currentCount = db.prepare("SELECT COUNT(*) as count FROM urls WHERE userId = ? AND createdAt >= ?").get(userId, startOfMonth.toISOString()) as any;
  
  if (currentCount.count + count > limits.linksPerMonth) {
    throw new Error(`Plan limit reached. You can only create ${limits.linksPerMonth} links per month on the ${plan} plan.`);
  }
  return true;
};

// Helper to check domain limits
const checkDomainLimit = (userId: string) => {
  const user = db.prepare("SELECT plan, status FROM users WHERE id = ?").get(userId) as any;

  if (user?.status === 'inactive') {
    throw new Error("Your account is inactive. Please contact support.");
  }

  const plan = (user?.plan || 'free') as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan];

  if (limits.domains === Infinity) return true;

  const currentCount = db.prepare("SELECT COUNT(*) as count FROM domains WHERE userId = ?").get(userId) as any;
  
  if (currentCount.count >= limits.domains) {
    throw new Error(`Plan limit reached. You can only add ${limits.domains} custom domain(s) on the ${plan} plan.`);
  }
  return true;
};

  app.post("/api/domains", authenticate, (req: any, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Domain name is required" });
    
    try {
      checkDomainLimit(req.user.uid);
      
      const domainName = name.trim().toLowerCase();
      const id = nanoid(8);
      const verificationToken = `cutly-verification=${nanoid(32)}`;
      
      db.prepare("INSERT INTO domains (id, name, userId, status, verificationToken, verificationType) VALUES (?, ?, ?, ?, ?, ?)").run(
        id, 
        domainName, 
        req.user.uid, 
        'pending',
        verificationToken,
        'txt'
      );
      
      res.json({ id, name: domainName, status: 'pending', verificationToken, verificationType: 'txt' });
    } catch (error: any) {
      res.status(403).json({ error: error.message || "Failed to add domain" });
    }
  });

  app.post("/api/domains/:id/verify", authenticate, async (req: any, res) => {
    const { id } = req.params;
    const domain = db.prepare("SELECT * FROM domains WHERE id = ? AND userId = ?").get(id, req.user.uid) as any;
    
    if (!domain) return res.status(404).json({ error: "Domain not found" });
    if (domain.status === 'verified') return res.json({ status: 'verified', message: 'Domain is already verified' });

    try {
      const txtRecords = await resolveTxt(domain.name);
      const isVerified = txtRecords.some(record => record.includes(domain.verificationToken));

      if (isVerified) {
        db.prepare("UPDATE domains SET status = 'verified' WHERE id = ?").run(id);
        return res.json({ status: 'verified', message: 'Domain verified successfully!' });
      } else {
        return res.status(400).json({ 
          status: 'pending', 
          error: "Verification failed. DNS record not found. Please ensure the TXT record is correctly added and wait for DNS propagation." 
        });
      }
    } catch (error: any) {
      console.error("Domain verification error:", error);
      return res.status(400).json({ 
        status: 'pending', 
        error: `Verification failed: ${error.message}. Please check your DNS settings.` 
      });
    }
  });

  app.delete("/api/domains/:id", authenticate, (req: any, res) => {
    const result = db.prepare("DELETE FROM domains WHERE id = ? AND userId = ?").run(req.params.id, req.user.uid);
    res.json({ success: result.changes > 0 });
  });

  // API to create a short URL
  app.post("/api/shorten", authenticate, (req: any, res) => {
    const { url, domainId, expiresAt } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    try {
      checkLinkLimit(req.user.uid);

      const id = nanoid(6);

      let domainName = null;
      if (domainId) {
        const domain = db.prepare("SELECT name, status FROM domains WHERE id = ? AND userId = ?").get(domainId, req.user.uid) as any;
        if (!domain) return res.status(404).json({ error: "Domain not found" });
        if (domain.status !== 'verified') return res.status(403).json({ error: "Domain must be verified before use" });
        domainName = domain.name;
      }

      db.prepare(`
        INSERT INTO urls (id, originalUrl, domainId, domainName, userId, expiresAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, url, domainId || null, domainName || null, req.user.uid, expiresAt || null);

      // Send email notification for new link creation
      try {
        const user = db.prepare("SELECT email, name, notify_link_created FROM users WHERE id = ?").get(req.user.uid) as any;
        if (user && user.email && user.notify_link_created !== 0) {
          const shortUrl = domainName ? `https://${domainName}/${id}` : `https://cutly.us/${id}`;
          const subject = `New Link Created: ${shortUrl}`;
          const html = `
            <h2>Hello ${user.name || 'User'},</h2>
            <p>You have successfully created a new short link.</p>
            <p><strong>Original URL:</strong> ${url}</p>
            <p><strong>Short URL:</strong> <a href="${shortUrl}">${shortUrl}</a></p>
            <br/>
            <p>Best regards,</p>
            <p>The Cutly Team</p>
          `;
          sendEmail(user.email, subject, html); // Fire and forget
        }
      } catch (e) {
        console.error("Failed to send new link email:", e);
      }

      res.json({ id, existing: false, domainName });
    } catch (error: any) {
      console.error("Shorten error:", error);
      res.status(403).json({ error: error.message || "Failed to shorten URL" });
    }
  });

  // Bulk Shorten API
  app.post("/api/bulk-shorten", authenticate, (req: any, res) => {
    const { url, urls, count, domainId, expiresAt } = req.body;
    
    const urlList: string[] = urls && Array.isArray(urls) 
      ? urls 
      : Array(Math.min(Math.max(parseInt(count as string) || 1, 1), 500)).fill(url);

    if (urlList.length === 0 || !urlList[0]) {
      return res.status(400).json({ error: "URL(s) required" });
    }

    // Validate all URLs
    const invalidUrls = urlList.filter(u => {
      try {
        new URL(u);
        return false;
      } catch {
        return true;
      }
    });

    if (invalidUrls.length > 0) {
      return res.status(400).json({ 
        error: "One or more URLs are invalid", 
        invalidUrls: invalidUrls.slice(0, 10) // Return first 10 invalid URLs for feedback
      });
    }

    try {
      checkLinkLimit(req.user.uid, urlList.length);

      let domainName = null;
      if (domainId) {
        const domain = db.prepare("SELECT name FROM domains WHERE id = ?").get(domainId) as any;
        domainName = domain?.name;
      }

      const ids: string[] = [];
      const insert = db.prepare(`
        INSERT INTO urls (id, originalUrl, domainId, domainName, userId, expiresAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction((list: string[]) => {
        for (let i = 0; i < list.length; i++) {
          const id = nanoid(6);
          insert.run(id, list[i], domainId || null, domainName || null, req.user.uid, expiresAt || null);
          ids.push(id);
        }
      });

      transaction(urlList);
      res.json({ ids, domainName });
    } catch (error: any) {
      console.error("Bulk shorten error:", error);
      res.status(403).json({ error: error.message || "Bulk shortening failed" });
    }
  });

  // Analytics API
  app.get("/api/analytics", authenticate, (req: any, res) => {
    const { startDate, endDate, range } = req.query;
    
    const urls = db.prepare("SELECT * FROM urls WHERE userId = ?").all(req.user.uid);
    const urlIds = urls.map((u: any) => u.id);
    
    if (urlIds.length === 0) {
      return res.json({ urls: [], clicks: [] });
    }

    const placeholders = urlIds.map(() => "?").join(",");
    let query = `
      SELECT * FROM clicks 
      WHERE urlId IN (${placeholders})
    `;
    const params: any[] = [...urlIds];

    if (startDate) {
      query += ` AND timestamp >= ?`;
      params.push(startDate);
    } else if (range !== 'all') {
      query += ` AND timestamp >= date('now', '-30 days')`;
    }

    if (endDate) {
      query += ` AND timestamp <= ?`;
      params.push(endDate);
    }

    const clicks = db.prepare(query).all(...params);

    res.json({ urls, clicks });
  });

  // API Key Management APIs
  app.get("/api/keys", authenticate, (req: any, res) => {
    const keys = db.prepare("SELECT * FROM apiKeys WHERE userId = ?").all(req.user.uid);
    res.json(keys);
  });

  app.post("/api/keys", authenticate, (req: any, res) => {
    const { name } = req.body;
    try {
      const key = `sk_${nanoid(32)}`;
      const id = nanoid(12);
      db.prepare("INSERT INTO apiKeys (id, key, name, userId, userEmail) VALUES (?, ?, ?, ?, ?)").run(
        id, key, name || "Default Key", req.user.uid, req.user.email
      );
      res.json({ id, key, name });
    } catch (error) {
      res.status(500).json({ error: "Failed to create API key" });
    }
  });

  app.delete("/api/keys/:id", authenticate, (req: any, res) => {
    const result = db.prepare("DELETE FROM apiKeys WHERE id = ? AND userId = ?").run(req.params.id, req.user.uid);
    res.json({ success: result.changes > 0 });
  });

  app.post("/api/domains/:id/verify", authenticate, (req: any, res) => {
    // In a real app, this would check DNS records (TXT or CNAME)
    // For this demo, we'll simulate verification success
    try {
      const domain = db.prepare("SELECT * FROM domains WHERE id = ? AND userId = ?").get(req.params.id, req.user.uid);
      if (!domain) return res.status(404).json({ error: "Domain not found" });

      db.prepare("UPDATE domains SET status = 'verified' WHERE id = ?").run(req.params.id);
      res.json({ success: true, status: 'verified' });
    } catch (error) {
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // Tasks API
  app.get("/api/tasks", authenticate, (req: any, res) => {
    try {
      const tasks = db.prepare("SELECT * FROM tasks WHERE userId = ? ORDER BY createdAt DESC").all(req.user.uid);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", authenticate, (req: any, res) => {
    const { title, description, dueDate } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });

    if (req.user.status === 'pending') {
      return res.status(403).json({ error: "Your account is pending admin approval." });
    }

    try {
      // Check limit for free users
      if (req.user.plan === 'free') {
        const count = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE userId = ?").get(req.user.uid) as any;
        if (count.count >= 3) {
          return res.status(403).json({ error: "Plan limit reached. Free users can only create 3 notes." });
        }
      }

      const id = nanoid(10);
      db.prepare("INSERT INTO tasks (id, userId, title, description, dueDate) VALUES (?, ?, ?, ?, ?)").run(
        id, req.user.uid, title, description, dueDate
      );
      const newTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
      res.json(newTask);
    } catch (error) {
      console.error("Task creation error:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.put("/api/tasks/:id", authenticate, (req: any, res) => {
    const { title, description, completed, dueDate } = req.body;
    const { id } = req.params;

    try {
      const task = db.prepare("SELECT * FROM tasks WHERE id = ? AND userId = ?").get(id, req.user.uid);
      if (!task) return res.status(404).json({ error: "Task not found" });

      const updates = [];
      const values = [];

      if (title !== undefined) { updates.push("title = ?"); values.push(title); }
      if (description !== undefined) { updates.push("description = ?"); values.push(description); }
      if (completed !== undefined) { updates.push("completed = ?"); values.push(completed ? 1 : 0); }
      if (dueDate !== undefined) { updates.push("dueDate = ?"); values.push(dueDate); }

      if (updates.length > 0) {
        values.push(id);
        db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`).run(...values);
      }

      const updatedTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", authenticate, (req: any, res) => {
    try {
      const result = db.prepare("DELETE FROM tasks WHERE id = ? AND userId = ?").run(req.params.id, req.user.uid);
      if (result.changes === 0) return res.status(404).json({ error: "Task not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Redirect short URL to long URL
  app.get("/:id", async (req, res, next) => {
    const urlId = req.params.id;
    
    // Skip if it looks like an API call or static asset
    if (urlId.startsWith('api') || urlId.includes('.')) {
      return next();
    }

    const url = db.prepare("SELECT * FROM urls WHERE id = ?").get(urlId) as any;
    
    if (url) {
      // Enforce custom domain if set and verified
      if (url.domainId) {
        const domain = db.prepare("SELECT * FROM domains WHERE id = ?").get(url.domainId) as any;
        
        if (domain && domain.status === 'verified') {
          const host = req.get('host');
          // Allow localhost for testing, but otherwise enforce custom domain
          if (host !== domain.name && !host.includes('localhost')) {
            return res.redirect(301, `https://${domain.name}/${urlId}`);
          }
        }
      }

      // Check expiration
      if (url.expiresAt && new Date() > new Date(url.expiresAt)) {
        return res.redirect("/expired");
      }

      // Send redirect immediately so crawlers and users don't wait
      res.redirect(url.originalUrl);

      // Do tracking in the background
      (async () => {
        try {
          // Increment click count
          db.prepare("UPDATE urls SET clicks = clicks + 1 WHERE id = ?").run(urlId);
          
          // Try to get country and city from IP
          let country = 'Unknown';
          let city = 'Unknown';
          const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
          if (ip && ip !== '127.0.0.1' && ip !== '::1') {
            try {
              const ipStr = Array.isArray(ip) ? ip[0] : ip;
              const geoResponse = await fetch(`http://ip-api.com/json/${ipStr.split(',')[0]}`, { signal: AbortSignal.timeout(3000) });
              const geoData = await geoResponse.json() as any;
              if (geoData.status === 'success') {
                country = geoData.country || 'Unknown';
                city = geoData.city || 'Unknown';
              }
            } catch (e) {
              console.error("GeoIP error:", e);
            }
          }

          // Parse User Agent
          const ua = req.headers['user-agent'] || '';
          const parser = new UAParser(ua);
          const browser = parser.getBrowser().name || 'Unknown';
          const os = parser.getOS().name || 'Unknown';
          const device = parser.getDevice().type || 'desktop';

          // Log click event
          db.prepare("INSERT INTO clicks (urlId, userAgent, referer, country, city, browser, os, device) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
            urlId,
            ua || 'unknown',
            req.headers['referer'] || 'direct',
            country,
            city,
            browser,
            os,
            device
          );
        } catch (err) {
          console.error("Background tracking error:", err);
        }
      })();
    } else {
      // If not found in DB, redirect to not-found page
      res.redirect("/not-found");
    }
  });

  // Global error handler for 500s
  app.use((err: any, req: any, res: any, _next: any) => {
    console.error(err.stack);
    if (req.path.startsWith('/api/')) {
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.redirect('/server-error');
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  // Public Settings & Stats
  app.get("/api/public/settings", (_req, res) => {
    try {
      const settings = db.prepare("SELECT * FROM settings").all() as any[];
      const features = db.prepare("SELECT * FROM landing_features ORDER BY displayOrder ASC").all() as any[];
      const faqs = db.prepare("SELECT * FROM landing_faqs ORDER BY displayOrder ASC").all() as any[];
      
      const settingsMap: Record<string, string> = {};
      settings.forEach(s => settingsMap[s.key] = s.value);
      
      res.json({
        settings: settingsMap,
        features,
        faqs
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch public settings" });
    }
  });

  app.get("/api/public/stats", (_req, res) => {
    try {
      const totalLinks = db.prepare("SELECT COUNT(*) as count FROM urls").get() as any;
      const totalClicks = db.prepare("SELECT SUM(clicks) as count FROM urls").get() as any;
      const settings = db.prepare("SELECT * FROM settings WHERE key LIKE 'stats_%'").all() as any[];
      
      const statsMap: Record<string, string> = {
        linksCreated: `${(totalLinks.count / 1000000).toFixed(1)}M+`,
        totalClicks: `${(totalClicks.count / 1000000).toFixed(1)}M+`,
      };
      
      // If counts are small, show real numbers
      if (totalLinks.count < 1000000) statsMap.linksCreated = totalLinks.count.toLocaleString();
      if (totalClicks.count < 1000000) statsMap.totalClicks = (totalClicks.count || 0).toLocaleString();

      settings.forEach(s => {
        const key = s.key.replace('stats_', '');
        statsMap[key] = s.value;
      });
      
      res.json(statsMap);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch public stats" });
    }
  });

  // Admin Settings
  app.get("/api/admin/settings", authenticate, requireAdmin, (_req, res) => {
    try {
      const settings = db.prepare("SELECT * FROM settings").all();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admin settings" });
    }
  });

  app.post("/api/admin/settings", authenticate, requireAdmin, (req, res) => {
    const { key, value } = req.body;
    try {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  app.get("/api/admin/features", authenticate, requireAdmin, (_req, res) => {
    try {
      const features = db.prepare("SELECT * FROM landing_features ORDER BY displayOrder ASC").all();
      res.json(features);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch features" });
    }
  });

  app.post("/api/admin/features", authenticate, requireAdmin, (req, res) => {
    const { id, icon, title, description, displayOrder } = req.body;
    try {
      db.prepare("INSERT OR REPLACE INTO landing_features (id, icon, title, description, displayOrder) VALUES (?, ?, ?, ?, ?)").run(
        id || nanoid(),
        icon,
        title,
        description,
        displayOrder || 0
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update feature" });
    }
  });

  app.delete("/api/admin/features/:id", authenticate, requireAdmin, (req, res) => {
    try {
      db.prepare("DELETE FROM landing_features WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete feature" });
    }
  });

  app.get("/api/admin/faqs", authenticate, requireAdmin, (_req, res) => {
    try {
      const faqs = db.prepare("SELECT * FROM landing_faqs ORDER BY displayOrder ASC").all();
      res.json(faqs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch faqs" });
    }
  });

  app.post("/api/admin/faqs", authenticate, requireAdmin, (req, res) => {
    const { id, question, answer, displayOrder } = req.body;
    try {
      db.prepare("INSERT OR REPLACE INTO landing_faqs (id, question, answer, displayOrder) VALUES (?, ?, ?, ?)").run(
        id || nanoid(),
        question,
        answer,
        displayOrder || 0
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update faq" });
    }
  });

  app.delete("/api/admin/faqs/:id", authenticate, requireAdmin, (req, res) => {
    try {
      db.prepare("DELETE FROM landing_faqs WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete faq" });
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Schedule daily job at 8:00 AM to check for expiring domains and plans
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily check for expiring domains and plans...');
    
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const sevenDaysStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sevenDaysEnd = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

    // Check expiring plans (3 days)
    try {
      const expiringUsers = db.prepare(`
        SELECT id, email, name, plan, expiresAt 
        FROM users 
        WHERE expiresAt IS NOT NULL 
        AND expiresAt > ? 
        AND expiresAt <= ?
        AND (notify_plan_expiry IS NULL OR notify_plan_expiry = 1)
      `).all(now.toISOString(), threeDaysFromNow.toISOString()) as any[];

      for (const user of expiringUsers) {
        const subject = `Urgent: Your ${user.plan} plan expires in less than 3 days`;
        const html = `
          <h2>Hello ${user.name || 'User'},</h2>
          <p>Your <strong>${user.plan}</strong> plan is scheduled to expire on <strong>${new Date(user.expiresAt).toLocaleDateString()}</strong>.</p>
          <p>Please log in to your account and renew your plan to avoid any interruption in service.</p>
          <br/>
          <p>Best regards,</p>
          <p>The Cutly Team</p>
        `;
        await sendEmail(user.email, subject, html);
      }

      // Check expiring plans (7 days)
      const sevenDayUsers = db.prepare(`
        SELECT id, email, name, plan, expiresAt 
        FROM users 
        WHERE expiresAt IS NOT NULL 
        AND expiresAt > ? 
        AND expiresAt <= ?
        AND (notify_plan_expiry IS NULL OR notify_plan_expiry = 1)
      `).all(sevenDaysStart.toISOString(), sevenDaysEnd.toISOString()) as any[];

      for (const user of sevenDayUsers) {
        const subject = `Reminder: Your ${user.plan} plan expires in 7 days`;
        const html = `
          <h2>Hello ${user.name || 'User'},</h2>
          <p>This is a reminder that your <strong>${user.plan}</strong> plan will expire in one week on <strong>${new Date(user.expiresAt).toLocaleDateString()}</strong>.</p>
          <p>To ensure uninterrupted access to all premium features, please renew your plan before it expires.</p>
          <br/>
          <p>Best regards,</p>
          <p>The Cutly Team</p>
        `;
        await sendEmail(user.email, subject, html);
      }

    } catch (error) {
      console.error('Error checking expiring plans:', error);
    }

    // Check expiring domains (assuming domains have an expiresAt field, if not, we'll skip or add it)
    try {
      // If domains don't have expiresAt, this will just return empty or fail gracefully
      const expiringDomains = db.prepare(`
        SELECT d.name, u.email, u.name as userName
        FROM domains d
        JOIN users u ON d.userId = u.id
        WHERE d.status = 'active' AND d.createdAt < ?
      `).all(new Date(now.getTime() - 335 * 24 * 60 * 60 * 1000).toISOString()) as any[]; // Assuming 1 year expiry, warn at 335 days (30 days before)

      for (const domain of expiringDomains) {
        const subject = `Action Required: Your custom domain ${domain.name} is expiring soon`;
        const html = `
          <h2>Hello ${domain.userName || 'User'},</h2>
          <p>Your custom domain <strong>${domain.name}</strong> is approaching its annual renewal date.</p>
          <p>Please ensure your payment method is up to date to keep your custom links working.</p>
          <br/>
          <p>Best regards,</p>
          <p>The Cutly Team</p>
        `;
        await sendEmail(domain.email, subject, html);
      }
    } catch (error) {
      console.error('Error checking expiring domains:', error);
    }
  });
  // Schedule weekly analytics email every Monday at 9:00 AM
  cron.schedule('0 9 * * 1', async () => {
    console.log('Running weekly analytics report...');
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
      const users = db.prepare("SELECT id, email, name FROM users WHERE email IS NOT NULL AND (notify_weekly_report IS NULL OR notify_weekly_report = 1)").all() as any[];

      for (const user of users) {
        // Get total clicks for the user in the last week
        const stats = db.prepare(`
          SELECT COUNT(c.id) as weeklyClicks
          FROM clicks c
          JOIN urls u ON c.urlId = u.id
          WHERE u.userId = ? AND c.timestamp >= ?
        `).get(user.id, oneWeekAgo.toISOString()) as any;

        if (stats && stats.weeklyClicks > 0) {
          const subject = `Your Weekly Cutly Analytics Report`;
          const html = `
            <h2>Hello ${user.name || 'User'},</h2>
            <p>Here is your weekly analytics summary for your short links:</p>
            <div style="padding: 20px; background-color: #f3f4f6; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0; color: #111827;">Total Clicks This Week</h3>
              <p style="font-size: 24px; font-weight: bold; color: #4f46e5; margin: 10px 0 0 0;">${stats.weeklyClicks}</p>
            </div>
            <p>Log in to your dashboard to see detailed analytics, top performing links, and more.</p>
            <br/>
            <p>Best regards,</p>
            <p>The Cutly Team</p>
          `;
          await sendEmail(user.email, subject, html);
        }
      }
    } catch (error) {
      console.error('Error sending weekly analytics:', error);
    }
  });
}

startServer();
