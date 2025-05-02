import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";
import cors from "cors";
import 'dotenv/config';
import { createServer } from './https';

const app = express();

const allowedOrigins = [
  "http://localhost:5000",       // frontend in dev
  "https://localhost:5000",      // frontend in dev
  "https://eshop.inchtechs.com", // frontend in prod
  "http://eshop.inchtechs.com",  // frontend in prod (non-HTTPS)
  "https://www.eshop.inchtechs.com", // www subdomain
  "http://www.eshop.inchtechs.com"   // www subdomain (non-HTTPS)
];

// Configure CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      // allow requests like curl or server-side without origin
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Important pour les cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'] // Permet l'accès aux cookies côté client
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  // Seed the database with default admin user
  await seedDatabase();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Créer le serveur (HTTP en production, HTTPS en développement)
  const serverInstance = createServer(app);

  //export default app;
  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.

  const port = 5000;
  serverInstance.listen(port, () => {
    const protocol = process.env.NODE_ENV === 'production' ? 'HTTP' : 'HTTPS';
    log(`serving on port ${port} with ${protocol}`);
  });
})();


