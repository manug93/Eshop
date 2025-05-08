import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { generateTokens, verifyAccessToken, refreshTokens, TokenPayload } from "./jwt";
import jwt from 'jsonwebtoken';


// Interface pour l'utilisateur
interface IUser {
  id: number;
  username: string;
  email: string;
  password: string;
  isAdmin: boolean;
  firstName: string | null;
  lastName: string | null;
  preferredLanguage: string;
  createdAt: Date;
  updatedAt: Date;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

type IUserWithoutPassword = Omit<IUser, 'password'>;

// Extension de l'interface Express.User
declare global {
  namespace Express {
    interface User extends Omit<IUser, 'password'> {}
  }
}

const scryptAsync = promisify(scrypt);

/**
 * Hashes a password using scrypt with a random salt
 */
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compares a supplied password with a stored hashed password
 */
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}


export const extractToken = ExtractJwt.fromAuthHeaderAsBearerToken();
/**
 * Middleware to authenticate requests using JWT
 * Verifies the JWT token from the Authorization header
 */

export function isAuth(req: Request) {
  const token = extractToken(req);
  if (!token) {
    return false;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret key') as TokenPayload;
    return decoded.userId ? true : false;
  } catch {
    return false;
  }
}

export function userFromToken(req: Request) {
  const token = extractToken(req);
  if (!token) {
    return null;
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret key') as TokenPayload;
  return decoded.userId ? storage.getUser(decoded.userId) : null;
}

export function isJwtAuthenticated(req: Request, res: Response, next: NextFunction) {
  /*const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Token non fourni" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Format de token invalide" });
  }*/
  
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: "Token invalide" });
  }
  verifyAccessToken(token)
    .then((payload) => {
      req.user = { id: payload.userId } as Express.User;
      next();
    })
    .catch(() => res.status(401).json({ message: "Token invalide" }));
}

// =====================================================================
// SESSION AUTHENTICATION
// =====================================================================

/**
 * Middleware to check if a user is authenticated using sessions
 */
export function isSessionAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Non authentifié" });
}




// Choose which authentication method to use by default (JWT or Session)
// You can switch between them by commenting/uncommenting the appropriate line
export const isAuthenticated = isJwtAuthenticated; // Using JWT for authentication
// export const isAuthenticated = isSessionAuthenticated; // Using Session for authentication

const isProd = process.env.NODE_ENV === "production";

export function setupAuth(app: Express) {
  // =====================================================================
  // SHARED SETUP (used by both JWT and Session auth)
  // =====================================================================
  
  app.use(passport.initialize());

  // Configure Passport Local Strategy (used by both JWT and Session auth)
  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
      },
      async (username: string, password: string, done: (error: Error | null, user?: IUserWithoutPassword | false, info?: { message: string }) => void) => {
        try {
          const user = await storage.getUserByUsername(username);
          if (!user) {
            return done(null, false, { message: "Username ou mot de passe incorrect" });
          }

          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "Username ou mot de passe incorrect" });
          }

          const { password: _, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  // =====================================================================
  // JWT AUTHENTICATION SETUP
  // =====================================================================
  
  // Configure JWT Strategy
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET || "your-secret-key",
      },
      async (payload: { userId: number }, done) => {
        try {
          const user = await storage.getUser(payload.userId);
          if (!user) {
            return done(null, false);
          }
          const { password, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // =====================================================================
  // SESSION AUTHENTICATION SETUP
  // =====================================================================
  
  // Session configuration
  const sessionOptions: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
    },
    store: storage.sessionStore,
  };

  // Only enable these if using session-based authentication
  app.set("trust proxy", 1); // Needed for secure cookies with proxies
  app.use(session(sessionOptions));
  app.use(passport.session());

  // Serialize/Deserialize User (only needed for session-based auth)
  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      const { password, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      done(error);
    }
  });

  // =====================================================================
  // GOOGLE OAUTH SETUP (works with both JWT and Session auth)
  // =====================================================================

  // Configure Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: any) => void) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("Email non trouvé"));
          }

          let user = await storage.getUserByEmail(email);
          
          if (!user) {
            user = await storage.createUser({
              username: profile.displayName,
              email: email,
              password: randomBytes(32).toString("hex"),
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
            });
          }
          
          const { password, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // =====================================================================
  // AUTHENTICATION ROUTES
  // =====================================================================
  
  /**
   * Register a new user
   * Works with both JWT and Session auth
   * Returns JWT tokens if JWT auth is enabled
   */
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });
      
      const { password: _, ...userWithoutPassword } = user;

      // For JWT auth: generate and return tokens
      const tokens = generateTokens(user);
      
      // Both JWT and Session can use the same response format
      // When using Session auth, the tokens will be ignored by the client
      res.status(201).json({
        user: userWithoutPassword,
        ...tokens,
      });
    } catch (error) {
      next(error);
    }
  });

  //Fix for JWT auth
  app.use(async (req, res, next) => {
    console.log("req.body", req.body);
    req.isAuthenticated = function(): this is Express.AuthenticatedRequest {
        return isAuth(req as Request);
      };
    if(isAuth(req as Request)){
        req.user = await userFromToken(req as Request) as User | undefined;
      }
    next();
  });

  // Debug middleware - remove in production
  app.use( (req, res, next) => { 
    console.log("➡️ Cookies reçus:", req.cookies);
    console.log("➡️ Session ID:", req.sessionID);
    console.log("➡️ Session data:", req.session);
    console.log("➡️ is authenticated :",  isAuth(req as Request));
    console.log("➡️ user:", req.user);
    console.log("➡️ request body:", req.body);
    console.log("➡️ request headers:", req.headers);  
    next();
  });

  /**
   * Login route
   * Works with both JWT and Session auth
   * Returns JWT tokens if JWT auth is enabled
   * Creates a session if Session auth is enabled
   */
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: IUserWithoutPassword | false, info: { message: string }) => {
      if (err) return next(err);
      if (!user) {
        console.log(info?.message);
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      // For session-based auth: login the user
      if (isAuthenticated === isSessionAuthenticated) {
        req.login(user, (loginErr) => {
          if (loginErr) {
            return next(loginErr);
          }
          
          // Return user without tokens for session auth
          return res.json({ user });
        });
      } else {
        // For JWT auth: generate and return tokens
        const tokens = generateTokens(user as User);
        res.json({
          user,
          ...tokens,
        });
      }
    })(req, res, next);
  });

  /**
   * Refresh JWT token
   * Only used with JWT auth
   */
  app.post("/api/refresh", async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" });
      }

      const tokens = await refreshTokens(refreshToken);
      res.json(tokens);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Logout route
   * Works with both JWT and Session auth
   */
  app.post("/api/logout", (req, res) => {
    // For session-based authentication
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Could not log out" });
        }
      });
    }
    
    // For JWT-based authentication, the client should dispose of the tokens
    res.json({ success: true, message: "Logged out successfully" });
  });

  /**
   * Google OAuth routes
   * Works with both JWT and Session auth
   */
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      // For JWT auth: generate and return tokens
      if (isAuthenticated === isJwtAuthenticated) {
        const tokens = generateTokens(req.user as User);
        res.redirect(`/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
      } else {
        // For session auth: just redirect to home
        res.redirect("/");
      }
    }
  );

  // =====================================================================
  // PROTECTED ROUTES - requires authentication
  // =====================================================================

  /**
   * Get current user info
   * Works with both JWT and Session auth
   */
  app.get("/api/user", isAuthenticated, (req, res) => {
    res.json(req.user);
  });
  
  /**
   * Get orders for current user
   */
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

  /**
   * Update user profile
   */
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
  
  /**
   * Get user addresses
   */
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
  
  /**
   * Get user's default address
   */
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
  
  /**
   * Add new address
   */
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
  
  /**
   * Update address
   */
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
  
  /**
   * Delete address
   */
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
  
  /**
   * Set address as default
   */
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

  /**
   * Get current user information
   */
  app.get("/api/me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Vérifier que req.user existe et contient un ID
      if (!req.user || typeof req.user.id !== 'number') {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Retourner uniquement les champs nécessaires
      const userData: IUserWithoutPassword = {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        firstName: user.firstName,
        lastName: user.lastName,
        preferredLanguage: user.preferredLanguage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId
      };

      res.json(userData);
    } catch (error) {
      console.error("Erreur lors de la récupération des informations utilisateur:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });
}