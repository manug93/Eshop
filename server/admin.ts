import { Express, Request, Response, NextFunction } from "express";
import passport from "passport";
import { storage } from "./storage";
import { verifyAccessToken } from "./jwt";
import { 
  InsertProduct, 
  InsertCategory, 
  InsertPromotion,
  InsertCategoryMapping,
  users, 
  promotions,
  products,
  orders,
  orderItems,
  cartItems,
  wishlists,
  categoryMappings
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc } from "drizzle-orm";
import Stripe from "stripe";
import fetch from "node-fetch";
import { extractToken } from "./auth";

// Admin middleware to check if the user is an admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  console.log("token :",token);
  if (!token) {
    return res.status(401).json({ message: "Token invalide" });
  }
  verifyAccessToken(token)
    .then(async (payload) => {
      req.user = { id: payload.userId } as Express.User;
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      if (!(user as any).isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    })
    .catch(() => res.status(401).json({ message: "Token invalide" }));
    
}

export function setupAdmin(app: Express) {
  // Get all users (admin only)
  app.get("/api/admin/users", isAdmin, async (req, res, next) => {
    try {
      const allUsers = await db.select({
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
      
      res.json(allUsers);
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
  
  // Get all products including inactive ones (admin only)
  app.get("/api/admin/products", isAdmin, async (req, res, next) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const products = await storage.getProducts(50, 0, includeInactive);
      res.json({ products });
    } catch (error) {
      next(error);
    }
  });
  
  // Reactivate an inactive product
  app.post("/api/admin/products/:id/reactivate", isAdmin, async (req, res, next) => {
    try {
      const productId = parseInt(req.params.id);
      const { stock = 1 } = req.body;
      
      console.log(`[Admin API] Request received to reactivate product with ID: ${productId} with stock: ${stock}`);
      
      if (isNaN(productId)) {
        console.error(`[Admin API] Invalid product ID: ${req.params.id}`);
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid product ID format' 
        });
      }
      
      const product = await storage.reactivateProduct(productId, stock);
      
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: 'Product not found' 
        });
      }
      
      console.log(`[Admin API] Successfully reactivated product ID: ${productId}`);
      
      // Get updated products list to refresh the UI
      const updatedProducts = await storage.getProducts(50, 0, true);
      
      res.json({
        success: true,
        message: `Product "${product.title}" has been successfully reactivated with ${stock} units in stock.`,
        product,
        products: updatedProducts
      });
    } catch (error) {
      console.error("[Admin API] Error in reactivate product endpoint:", error);
      next(error);
    }
  });

  // Delete all products with zero stock
  app.delete("/api/admin/products/zerostock", isAdmin, async (req, res, next) => {
    try {
      // First get all products with zero stock
      const zeroStockProducts = await db
        .select()
        .from(products)
        .where(eq(products.stock, 0));
      
      let deleted = 0;
      let deactivated = 0;
      
      // Process each product
      for (const product of zeroStockProducts) {
        try {
          await storage.deleteProduct(product.id);
          deleted++;
        } catch (error) {
          console.error(`Could not delete product ${product.id}, marking as inactive`);
          deactivated++;
        }
      }
      
      res.status(200).json({
        success: true,
        message: `Processed ${zeroStockProducts.length} products: ${deleted} deleted, ${deactivated} deactivated`
      });
    } catch (error) {
      console.error("Error in delete zero stock products endpoint:", error);
      next(error);
    }
  });
  
  // Delete product by ID
  app.delete("/api/admin/products/:id", isAdmin, async (req, res, next) => {
    try {
      const productId = parseInt(req.params.id);
      console.log(`[Admin API] Request received to delete product with ID: ${productId}`);
      
      if (isNaN(productId)) {
        console.error(`[Admin API] Invalid product ID: ${req.params.id}`);
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid product ID format' 
        });
      }
      
      try {
        const result = await storage.deleteProduct(productId);
        console.log(`[Admin API] Delete operation result for product ID ${productId}:`, result);
        
        // Force cache invalidation by sending the updated products list
        const updatedProducts = await db.select().from(products);
        console.log(`[Admin API] Returning ${updatedProducts.length} products after deletion operation`);
        
        // Return appropriate message based on whether it was a full delete or just marked as inactive
        return res.status(200).json({ 
          success: true, 
          message: result.message,
          fullDelete: result.fullDelete,
          products: updatedProducts
        });
      } catch (deleteError: any) {
        console.error(`[Admin API] Error while deleting product ID ${productId}:`, deleteError);
        return res.status(500).json({ 
          success: false, 
          message: `Error processing product deletion: ${deleteError.message}` 
        });
      }
    } catch (error) {
      console.error("[Admin API] Error in delete product endpoint:", error);
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
  
  // Update category (admin only)
  app.patch("/api/admin/categories/:id", isAdmin, async (req, res, next) => {
    try {
      const categoryId = parseInt(req.params.id);
      const categoryData: Partial<InsertCategory> = req.body;
      
      // Auto-generate slug if name is provided but slug is not
      if (categoryData.name && !categoryData.slug) {
        categoryData.slug = categoryData.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }
      
      // Prevent updating the default category (ID 1)
      if (categoryId === 1 && (categoryData.name || categoryData.slug)) {
        return res.status(400).json({ 
          message: "Cannot modify the default category name or slug." 
        });
      }
      
      // Update the category in the database
      const updatedCategory = await storage.updateCategory(categoryId, categoryData);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      console.error('[Admin API] Error updating category:', error);
      next(error);
    }
  });
  
  // Delete category (admin only)
  app.delete("/api/admin/categories/:id", isAdmin, async (req, res, next) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      // Prevent deletion of the default category (ID 1)
      if (categoryId === 1) {
        return res.status(400).json({ 
          message: "Cannot delete the default category. It is used for products without a category." 
        });
      }
      
      const result = await storage.deleteCategory(categoryId);
      
      res.json({ 
        success: result, 
        message: result ? 
          "Category deleted successfully. Products in this category have been moved to the default category." : 
          "Category not found or could not be deleted." 
      });
    } catch (error) {
      console.error('[Admin API] Error deleting category:', error);
      next(error);
    }
  });
  
  // Interface for DummyJSON category response
  interface DummyJSONCategory {
    slug: string;
    name: string;
    url: string;
  }
  
  // Helper function to fetch categories from the DummyJSON API
  async function fetchExternalCategories(): Promise<DummyJSONCategory[]> {
    try {
      // Fetch categories from the API
      const response = await fetch('https://dummyjson.com/products/categories');
      
      if (!response.ok) {
        throw new Error(`Error fetching categories: ${response.status} ${response.statusText}`);
      }
      
      // Parse the response
      const categorySlugs = await response.json();
      
      // Validate that we got an array
      if (!Array.isArray(categorySlugs)) {
        throw new Error('Expected an array from DummyJSON API, but got something else');
      }
      
      console.log("Retrieved category slugs from API:", categorySlugs);
      
      // Format each category with name and URL
      return categorySlugs.map(slug => {
        // Format the name: convert hyphens to spaces and capitalize each word
        const name = String(slug)
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        return {
          slug: String(slug),
          name,
          url: `https://dummyjson.com/products/category/${slug}`
        };
      });
    } catch (error) {
      console.error('Error fetching external categories:', error);
      throw error;
    }
  }

  // Import external categories from DummyJSON
  app.get("/api/admin/import-external-categories", isAdmin, async (req, res, next) => {
    try {
      const externalCategories = await fetchExternalCategories();
      res.json(externalCategories);
    } catch (error) {
      console.error('Error importing external categories:', error);
      res.status(500).json({ message: 'Failed to import external categories', error: String(error) });
    }
  });
  
  // Get category mappings (admin only)
  app.get("/api/admin/category-mappings", isAdmin, async (req, res, next) => {
    try {
      const mappings = await storage.getCategoryMappings();
      res.json(mappings);
    } catch (error) {
      console.error('[Admin API] Error fetching category mappings:', error);
      next(error);
    }
  });

  // Admin category mappings management
  app.post("/api/admin/category-mappings", isAdmin, async (req, res, next) => {
    try {
      console.log('[Admin API] Category mappings received:', req.body.mappings);
      
      const { mappings } = req.body;
      
      if (!mappings || !Array.isArray(mappings)) {
        return res.status(400).json({ message: "Invalid mappings data format" });
      }
      
      // Process the mappings to normalize data formats
      const processedMappings = mappings.map(mapping => {
        let externalCat;
        let externalCatName;
        
        // Handle externalCategory - normalize to string (slug) for database storage
        if (typeof mapping.externalCategory === 'object' && mapping.externalCategory !== null) {
          externalCat = mapping.externalCategory.slug || '';
          externalCatName = mapping.externalCategory.name || externalCat;
        } else {
          externalCat = String(mapping.externalCategory);
          externalCatName = externalCat
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
        
        // Ensure internalCategoryId is a number
        let internalCatId = mapping.internalCategoryId;
        if (typeof internalCatId !== 'number') {
          internalCatId = parseInt(String(internalCatId), 10);
          if (isNaN(internalCatId)) {
            throw new Error(`Invalid internalCategoryId for external category ${externalCat}`);
          }
        }
        
        return {
          externalCategory: externalCat,
          internalCategoryId: internalCatId,
          _name: externalCatName // Temporary field to help with category creation
        };
      });
      
      // Process each mapping
      for (const mapping of processedMappings) {
        // Check if the internal category exists
        const category = await storage.getCategoryById(mapping.internalCategoryId);
        if (!category) {
          // Create a new category with name and slug based on the external category
          const categoryName = mapping._name;
          
          try {
            const newCategory = await storage.createCategory({
              name: categoryName,
              slug: mapping.externalCategory,
            });
            
            // Update the mapping to use the new category
            mapping.internalCategoryId = newCategory.id;
            console.log(`[Admin API] Created new category '${categoryName}' (ID: ${newCategory.id}) for external category '${mapping.externalCategory}'`);
          } catch (err) {
            console.error(`[Admin API] Error creating category for ${mapping.externalCategory}:`, err);
            // Continue processing other mappings
          }
        }
        
        // Remove temporary field
        delete mapping._name;
      }
      
      // Create/update the mappings in the database
      const savedMappings = await Promise.all(
        mappings.map(async (mapping) => {
          // Check if this mapping already exists in the database
          const existingMapping = await storage.getCategoryMappingByExternalCategory(mapping.externalCategory);
          
          if (existingMapping) {
            // Update the existing mapping
            return storage.updateCategoryMapping(mapping.externalCategory, mapping.internalCategoryId);
          } else {
            // Create a new mapping
            return storage.createCategoryMapping(mapping);
          }
        })
      );
      
      res.status(200).json({ 
        success: true, 
        message: "Category mappings saved successfully",
        mappings: savedMappings
      });
    } catch (error) {
      console.error('[Admin API] Error saving category mappings:', error);
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
  
  // Process refund for an order
  app.post("/api/admin/orders/:id/refund", isAdmin, async (req, res, next) => {
    try {
      const orderId = parseInt(req.params.id);
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID is required" });
      }
      
      // Get the order
      const order = await storage.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if the Stripe API is available
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({
          message: "Stripe payment processing is unavailable. Please configure STRIPE_SECRET_KEY."
        });
      }
      
      // Initialize Stripe with the secret key
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      
      try {
        // Process the refund through Stripe
        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          reason: 'requested_by_customer'
        });
        
        // Update the order status to refunded
        const updatedOrder = await storage.updateOrderStatus(orderId, 'refunded');
        
        res.json({ 
          success: true, 
          order: updatedOrder,
          refund: {
            id: refund.id,
            amount: refund.amount / 100, // Convert from cents to dollars
            status: refund.status
          }
        });
      } catch (stripeError: any) {
        console.error("Stripe refund error:", stripeError);
        return res.status(400).json({ 
          message: "Error processing refund", 
          error: stripeError.message 
        });
      }
    } catch (error) {
      console.error("Server refund error:", error);
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
  
  // Get top 10 orders by total value
  app.get("/api/admin/charts/top-orders", isAdmin, async (req, res, next) => {
    try {
      const topOrders = await db
        .select({
          id: orders.id,
          total: orders.total,
          date: orders.createdAt,
          username: users.username
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(eq(orders.status, 'completed'))
        .orderBy(desc(orders.total))
        .limit(10);
      
      res.json(topOrders);
    } catch (error) {
      console.error("Error fetching top orders:", error);
      next(error);
    }
  });
  
  // Get monthly sales data for the past 12 months
  app.get("/api/admin/charts/sales-by-month", isAdmin, async (req, res, next) => {
    try {
      // PostgreSQL query to get monthly sales data - using created_at column name
      const monthlySales = await db.execute(sql`
        SELECT 
          DATE_TRUNC('month', orders.created_at) AS month,
          SUM(total) AS revenue,
          COUNT(*) AS order_count
        FROM orders
        WHERE status = 'completed'
        AND orders.created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', orders.created_at)
        ORDER BY month ASC
      `);
      
      // Format the result - use rows property from query result and handle typing issues
      const formattedSales = monthlySales.rows.map(row => ({
        month: new Date(String(row.month)).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: Number(row.revenue) || 0,
        orderCount: Number(row.order_count) || 0
      }));
      
      res.json(formattedSales);
    } catch (error) {
      console.error("Error fetching monthly sales:", error);
      next(error);
    }
  });
  
  // Get sales data by category
  app.get("/api/admin/charts/sales-by-category", isAdmin, async (req, res, next) => {
    try {
      // PostgreSQL query to get sales by category
      const categoryData = await db.execute(sql`
        SELECT 
          c.name AS category_name,
          SUM(oi.quantity * oi.price) AS revenue,
          SUM(oi.quantity) AS units_sold
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'completed'
        GROUP BY c.name
        ORDER BY revenue DESC
      `);
      
      // Format the result and handle null categories
      const formattedData = categoryData.rows.map(row => ({
        category: row.category_name || 'Uncategorized',
        revenue: Number(row.revenue) || 0,
        unitsSold: Number(row.units_sold) || 0
      }));
      
      res.json(formattedData);
    } catch (error) {
      console.error("Error fetching sales by category:", error);
      next(error);
    }
  });
  
  // Get top 10 buyers
  app.get("/api/admin/charts/top-buyers", isAdmin, async (req, res, next) => {
    try {
      const topBuyers = await db.execute(sql`
        SELECT 
          u.username,
          u.id AS user_id,
          COUNT(o.id) AS order_count,
          SUM(o.total) AS total_spent
        FROM users u
        JOIN orders o ON u.id = o.user_id
        WHERE o.status = 'completed'
        GROUP BY u.id, u.username
        ORDER BY total_spent DESC
        LIMIT 10
      `);
      
      const formattedData = topBuyers.rows.map(row => ({
        username: row.username,
        userId: row.user_id,
        orderCount: Number(row.order_count) || 0,
        totalSpent: Number(row.total_spent) || 0
      }));
      
      res.json(formattedData);
    } catch (error) {
      console.error("Error fetching top buyers:", error);
      next(error);
    }
  });
  
  // Get top 10 products by sales
  app.get("/api/admin/charts/top-products", isAdmin, async (req, res, next) => {
    try {
      const topProducts = await db.execute(sql`
        SELECT 
          p.id AS product_id,
          p.title AS product_name,
          SUM(oi.quantity) AS units_sold,
          SUM(oi.quantity * oi.price) AS revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'completed'
        GROUP BY p.id, p.title
        ORDER BY units_sold DESC
        LIMIT 10
      `);
      
      const formattedData = topProducts.rows.map(row => ({
        productId: row.product_id,
        productName: row.product_name,
        unitsSold: Number(row.units_sold) || 0,
        revenue: Number(row.revenue) || 0
      }));
      
      res.json(formattedData);
    } catch (error) {
      console.error("Error fetching top products:", error);
      next(error);
    }
  });
  
  // Get 10 most expensive products and their sales count
  app.get("/api/admin/charts/expensive-products", isAdmin, async (req, res, next) => {
    try {
      const expensiveProducts = await db.execute(sql`
        SELECT 
          p.id AS product_id,
          p.title AS product_name,
          p.price,
          COALESCE(SUM(oi.quantity), 0) AS units_sold
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
        WHERE p.active = true
        GROUP BY p.id, p.title, p.price
        ORDER BY p.price DESC
        LIMIT 10
      `);
      
      const formattedData = expensiveProducts.rows.map(row => ({
        productId: row.product_id,
        productName: row.product_name,
        price: Number(row.price) || 0,
        unitsSold: Number(row.units_sold) || 0
      }));
      
      res.json(formattedData);
    } catch (error) {
      console.error("Error fetching expensive products:", error);
      next(error);
    }
  });
  
  // Get most viewed products (simulated since we don't track views yet)
  app.get("/api/admin/charts/most-viewed", isAdmin, async (req, res, next) => {
    try {
      // Since we don't have actual view tracking, we'll use a combination of 
      // order frequency and rating as a proxy for popularity/views
      const popularProducts = await db.execute(sql`
        SELECT 
          p.id AS product_id,
          p.title AS product_name,
          p.rating,
          COUNT(DISTINCT oi.order_id) AS order_frequency
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        WHERE p.active = true
        GROUP BY p.id, p.title, p.rating
        ORDER BY (p.rating * COUNT(DISTINCT oi.order_id)) DESC
        LIMIT 10
      `);
      
      const formattedData = popularProducts.rows.map(row => ({
        productId: row.product_id,
        productName: row.product_name,
        rating: Number(row.rating) || 0,
        orderFrequency: Number(row.order_frequency) || 0,
        // Estimated views based on order frequency and rating
        estimatedViews: Math.round((Number(row.order_frequency) || 0) * (Number(row.rating) || 0) * 10)
      }));
      
      res.json(formattedData);
    } catch (error) {
      console.error("Error fetching most viewed products:", error);
      next(error);
    }
  });
  
  // Import products from DummyJSON API
  app.post("/api/admin/products/import", isAdmin, async (req, res, next) => {
    try {
      const { 
        category, 
        limit = 5, 
        skip = 0,
        checkDuplicates = true
      } = req.body;
      
      if (limit <= 0 || limit > 30) {
        return res.status(400).json({ 
          message: "Limit must be between 1 and 30" 
        });
      }
      
      if (skip < 0) {
        return res.status(400).json({
          message: "Skip must be 0 or a positive number"
        });
      }
      
      // Build the URL based on whether a category is provided
      const baseUrl = 'https://dummyjson.com/products';
      const url = category && category !== 'all'
        ? `${baseUrl}/category/${category}?limit=${limit}&skip=${skip}`
        : `${baseUrl}?limit=${limit}&skip=${skip}`;
      
      // Fetch data from DummyJSON API
      const response = await fetch(url);
      
      if (!response.ok) {
        return res.status(response.status).json({
          message: `Error fetching from DummyJSON: ${response.statusText}`
        });
      }
      
      const data = await response.json();
      
      console.log("DummyJSON response:", JSON.stringify(data, null, 2));
      
      if (!data.products || !Array.isArray(data.products)) {
        return res.status(500).json({ 
          message: "Invalid response from DummyJSON API" 
        });
      }
      
      // Process each product and add to database
      const importedProducts = [];
      const skippedDuplicates = [];
      
      for (const product of data.products) {
        try {
          // Check for duplicates if requested
          if (checkDuplicates) {
            // Search for existing product with the same title
            const existingProducts = await db
              .select()
              .from(products)
              .where(eq(products.title, product.title));
            
            if (existingProducts.length > 0) {
              console.log(`Skipping duplicate product: ${product.title}`);
              skippedDuplicates.push(product.title);
              continue; // Skip this product and continue with the next one
            }
          }
          
          // Map DummyJSON product to our schema
          const productData = {
            title: product.title,
            description: product.description,
            price: product.price,
            thumbnail: product.thumbnail,
            // Ensure brand has a default value if it's missing
            brand: product.brand || product.category || "Unknown Brand",
            stock: product.stock || 0,
            categoryId: null, // We'll need to map this if needed
            discountPercentage: product.discountPercentage || null,
            rating: product.rating || null,
            // Use the images array directly 
            images: product.images || []
          };
          
          console.log("Attempting to create product:", productData);
          // Save to database
          const savedProduct = await storage.createProduct(productData);
          console.log("Product created successfully:", savedProduct);
          importedProducts.push(savedProduct);
        } catch (error) {
          console.error(`Error importing product ${product.title}:`, error);
          // Continue with next product even if one fails
        }
      }
      
      res.status(200).json({
        success: true,
        count: importedProducts.length,
        products: importedProducts,
        skipped: skippedDuplicates.length,
        skippedProducts: skippedDuplicates
      });
    } catch (error) {
      console.error("Error importing products:", error);
      next(error);
    }
  });
}