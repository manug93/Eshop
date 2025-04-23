import { Express } from "express";
import { storage } from "./storage";
import { InsertProduct, InsertCategory, InsertPromotion, users, promotions } from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc } from "drizzle-orm";

// Admin middleware to check if the user is an admin
export function isAdmin(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  if (!(req.user as any).isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
}

export function setupAdmin(app: Express) {
  // Get all users (admin only)
  app.get("/api/admin/users", isAdmin, async (req, res, next) => {
    try {
      const users = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isAdmin: users.isAdmin,
        preferredLanguage: users.preferredLanguage,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        stripeCustomerId: users.stripeCustomerId,
        stripeSubscriptionId: users.stripeSubscriptionId
      }).from(users);
      
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  // Update user (admin only)
  app.patch("/api/admin/users/:id", isAdmin, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      // Don't allow password update through this endpoint
      delete userData.password;
      
      const user = await storage.updateUser(userId, userData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // Admin product management
  app.post("/api/admin/products", isAdmin, async (req, res, next) => {
    try {
      const productData: InsertProduct = req.body;
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/products/:id", isAdmin, async (req, res, next) => {
    try {
      const productId = parseInt(req.params.id);
      const productData = req.body;
      
      const product = await storage.updateProduct(productId, productData);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/products/:id", isAdmin, async (req, res, next) => {
    try {
      const productId = parseInt(req.params.id);
      await storage.deleteProduct(productId);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Admin category management
  app.post("/api/admin/categories", isAdmin, async (req, res, next) => {
    try {
      const categoryData: InsertCategory = req.body;
      
      // Auto-generate slug if not provided
      if (!categoryData.slug && categoryData.name) {
        categoryData.slug = categoryData.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }
      
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  });

  // Admin order management
  app.get("/api/admin/orders", isAdmin, async (req, res, next) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/orders/:id/status", isAdmin, async (req, res, next) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const order = await storage.updateOrderStatus(orderId, status);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      next(error);
    }
  });

  // Admin promotion management
  app.post("/api/admin/promotions", isAdmin, async (req, res, next) => {
    try {
      const promotionData: InsertPromotion = req.body;
      
      // Validation
      if (!promotionData.code || !promotionData.type || typeof promotionData.value !== 'number') {
        return res.status(400).json({ message: "Invalid promotion data" });
      }
      
      if (promotionData.type !== 'percentage' && promotionData.type !== 'fixed') {
        return res.status(400).json({ message: "Type must be 'percentage' or 'fixed'" });
      }
      
      if (promotionData.type === 'percentage' && (promotionData.value <= 0 || promotionData.value > 100)) {
        return res.status(400).json({ message: "Percentage value must be between 0 and 100" });
      }
      
      // Create the promotion
      const promotion = await db.insert(promotions).values(promotionData).returning();
      res.status(201).json(promotion[0]);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/promotions", isAdmin, async (req, res, next) => {
    try {
      const allPromotions = await db.select().from(promotions);
      res.json(allPromotions);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/promotions/:id", isAdmin, async (req, res, next) => {
    try {
      const promotionId = parseInt(req.params.id);
      const promotionData = req.body;
      
      const [updatedPromotion] = await db
        .update(promotions)
        .set(promotionData)
        .where(eq(promotions.id, promotionId))
        .returning();
      
      if (!updatedPromotion) {
        return res.status(404).json({ message: "Promotion not found" });
      }
      
      res.json(updatedPromotion);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/promotions/:id", isAdmin, async (req, res, next) => {
    try {
      const promotionId = parseInt(req.params.id);
      
      await db
        .delete(promotions)
        .where(eq(promotions.id, promotionId));
      
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Admin dashboard statistics
  app.get("/api/admin/stats", isAdmin, async (req, res, next) => {
    try {
      // Get total users count
      const [usersCount] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(users);
      
      // Get total orders count
      const [ordersCount] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(orders);
      
      // Get total revenue
      const [revenue] = await db
        .select({ total: sql`sum(total)`.mapWith(Number) })
        .from(orders)
        .where(eq(orders.status, 'completed'));
      
      // Get products count
      const [productsCount] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(products);
      
      // Get recent orders
      const recentOrders = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(5);
      
      // Return all statistics
      res.json({
        usersCount: usersCount.count || 0,
        ordersCount: ordersCount.count || 0,
        revenue: revenue.total || 0,
        productsCount: productsCount.count || 0,
        recentOrders
      });
    } catch (error) {
      next(error);
    }
  });
}