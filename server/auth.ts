import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends Omit<User, "password"> {}
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

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send("Unauthorized");
}

const isProd = process.env.NODE_ENV === "production";
export function setupAuth(app: Express) {
  // Session configuration
  const sessionOptions: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd,
      sameSite:isProd?"none":"lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
    },
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionOptions));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Passport Local Strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        const isPasswordValid = await comparePasswords(password, user.password);
        
        if (!isPasswordValid) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Remove password from user object before serializing
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize/Deserialize User
  passport.serializeUser((user, done) => {
    done(null, (user as Express.User).id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      done(error);
    }
  });

  // Auth Routes
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(req.body.password);
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      // Log the user in after registration
      req.login(userWithoutPassword, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.use((req, res, next) => {
    console.log("➡️ Cookies reçus:", req.cookies);
    console.log("➡️ Session ID:", req.sessionID);
    console.log("➡️ Session data:", req.session);

    next();
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        return res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
  
  // Get orders for current user
  app.get("/api/user/orders", isAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as Express.User).id;
      
      // Get user orders
      const userOrders = await storage.getOrders(userId);
      
      // For each order, get the order items
      const ordersWithItems = await Promise.all(
        userOrders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          return {
            ...order,
            items
          };
        })
      );
      
      res.json(ordersWithItems);
    } catch (error) {
      next(error);
    }
  });

  // Update user profile
  app.put("/api/user/profile", isAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as Express.User).id;
      const { firstName, lastName, email, preferredLanguage } = req.body;
      
      // Update only allowed fields
      const userData = {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(preferredLanguage !== undefined && { preferredLanguage })
      };
      
      // Update user profile
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  // Get user addresses
  app.get("/api/user/addresses", isAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as Express.User).id;
      
      // Get user addresses
      const addresses = await storage.getUserAddresses(userId);
      res.json(addresses);
    } catch (error) {
      next(error);
    }
  });
  
  // Get user's default address
  app.get("/api/user/addresses/default", isAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as Express.User).id;
      
      // Get default address
      const address = await storage.getUserDefaultAddress(userId);
      
      if (!address) {
        return res.status(404).json({ message: "No default address found" });
      }
      
      res.json(address);
    } catch (error) {
      next(error);
    }
  });
  
  // Add new address
  app.post("/api/user/addresses", isAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as Express.User).id;
      
      // Create new address
      const address = await storage.createAddress({
        ...req.body,
        userId
      });
      
      res.status(201).json(address);
    } catch (error) {
      next(error);
    }
  });
  
  // Update address
  app.put("/api/user/addresses/:id", isAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as Express.User).id;
      const addressId = parseInt(req.params.id);
      
      // Verify address belongs to user
      const existingAddress = await storage.getAddressById(addressId);
      
      if (!existingAddress) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      if (existingAddress.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this address" });
      }
      
      // Update address
      const updatedAddress = await storage.updateAddress(addressId, req.body);
      
      if (!updatedAddress) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      res.json(updatedAddress);
    } catch (error) {
      next(error);
    }
  });
  
  // Delete address
  app.delete("/api/user/addresses/:id", isAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as Express.User).id;
      const addressId = parseInt(req.params.id);
      
      // Verify address belongs to user
      const existingAddress = await storage.getAddressById(addressId);
      
      if (!existingAddress) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      if (existingAddress.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this address" });
      }
      
      // Delete address
      await storage.deleteAddress(addressId);
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  
  // Set address as default
  app.put("/api/user/addresses/:id/default", isAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as Express.User).id;
      const addressId = parseInt(req.params.id);
      
      // Verify address belongs to user
      const existingAddress = await storage.getAddressById(addressId);
      
      if (!existingAddress) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      if (existingAddress.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this address" });
      }
      
      // Set as default
      await storage.setDefaultAddress(userId, addressId);
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
}