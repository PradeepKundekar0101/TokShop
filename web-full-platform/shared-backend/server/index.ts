// Note: dotenv is loaded by the entry point (marketplace-app/server.ts or admin-app/server.ts)

// Validate required environment variables
if (!process.env.BASE_URL) {
  throw new Error("BASE_URL environment variable is required");
}
console.log(`[API Config] BASE_URL: ${process.env.BASE_URL}`);

import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { socketListener } from "./services/socket-listener";

const app = express();

// Trust proxy - important for sessions behind Nginx
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Session configuration with header-based restoration
// Sessions are primarily restored from client headers (x-access-token, x-user-data)
// The default MemoryStore is used as temporary storage during request lifecycle
const isProduction = process.env.NODE_ENV === 'production';
console.log(`[Session Config] isProduction: ${isProduction}, NODE_ENV: ${process.env.NODE_ENV}`);
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-for-development-only',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // In production with HTTPS, use secure cookies
    // Set FORCE_SECURE_COOKIES=true in env if behind HTTPS proxy
    secure: isProduction || process.env.FORCE_SECURE_COOKIES === 'true',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  name: 'sessionId'
}));

// Session restoration middleware - restores sessions from headers
app.use((req, res, next) => {
  // Always restore session from headers to ensure fresh authentication state
  const accessToken = req.headers['x-access-token'] as string;
  const adminToken = req.headers['x-admin-token'] as string;
  const userData = req.headers['x-user-data'] as string;

  // Debug logging for /api/admin/users requests
  if (req.path === '/api/admin/users') {
    console.log('[Session Restoration] /api/admin/users request:');
    console.log('  - x-admin-token:', adminToken ? 'present' : 'missing');
    console.log('  - x-access-token:', accessToken ? 'present' : 'missing');
    console.log('  - x-user-data:', userData ? 'present' : 'missing');
    console.log('  - session.user:', req.session.user ? 'exists' : 'empty');
    console.log('  - session.accessToken:', req.session.accessToken ? 'exists' : 'empty');
  }

  // Always restore accessToken from headers (regular user token takes priority)
  if (accessToken) {
    req.session.accessToken = accessToken;
  }
  // Fall back to admin token if no regular token
  else if (adminToken) {
    req.session.accessToken = adminToken;
  }

  // Always restore user data from headers if available
  if (userData) {
    try {
      // Decode from base64 (UTF-8)
      const decoded = Buffer.from(userData, 'base64').toString('utf8');
      const parsedUser = JSON.parse(decoded);
      req.session.user = parsedUser;

      if (req.path === '/api/admin/users') {
        console.log('  - Restored user:', { admin: parsedUser.admin, id: parsedUser.id });
      }
    } catch (e) {
      console.error('Failed to parse user data from header:', e);
    }
  }

  next();
});

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Add API 404 handler before Vite to ensure unmatched API routes return JSON
  app.use('/api', (req, res) => {
    res.status(404).json({
      success: false,
      error: `API endpoint not found: ${req.method} ${req.path}`
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve API + client on PORT (deployment may firewall other ports).
  // Default 5050: macOS AirPlay / Control Center often reserves 5000.
  const port = parseInt(process.env.PORT || '5050', 10);
  // reusePort helps multi-worker binds on Linux; macOS often returns ENOTSUP.
  server.listen(
    {
      port,
      host: "0.0.0.0",
      ...(process.platform === "linux" ? { reusePort: true as const } : {}),
    },
    async () => {
      log(`serving on port ${port}`);

      // Initialize Socket.IO listener for show events
      try {
        await socketListener.initialize();
        console.log('✅ Socket.IO listener initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Socket.IO listener:', error);
      }
    },
  );
})();
