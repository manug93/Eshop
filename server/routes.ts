import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";

import { setupAuth } from "./auth";
import { setupI18n } from "./i18n";
import { setupAdmin } from "./admin";
import { db } from "./db";
import { 
  users, 
  products,
  categories, 
  orders, 
  orderItems, 
  carts, 
  cartItems,
  wishlists,
  promotions
} from "@shared/schema";
import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";


if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing STRIPE_SECRET_KEY, Stripe functionality will not work properly');
}

// Initialize Stripe with the secret key
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as const,
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication, internationalization, and admin routes
  setupAuth(app);
  setupI18n(app);
  setupAdmin(app);
  
  // API routes for the e-commerce app
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  
  // Product routes
  app.get("/api/products", async (req, res, next) => {
    try {
      const { limit = '20', offset = '0', category, search, sort, includeInactive = 'false' } = req.query;
      
      // Query builder for products with category names
      let query = db.select({
        product: products,
        categoryName: categories.name
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id));
      
      // Only include active products by default, unless explicitly requested
      // Users should only see active products, admins can request inactive ones
      if (includeInactive !== 'true') {
        query = query.where(eq(products.active, true));
      }
      
      // Apply category filter
      if (category) {
        // First get the category id
        const [categoryRecord] = await db
          .select()
          .from(categories)
          .where(eq(categories.slug, category as string));
          
        if (categoryRecord) {
          query = query.where(eq(products.categoryId, categoryRecord.id));
        }
      }
      
      // Apply search filter
      if (search) {
        query = query.where(
          or(
            like(products.title, `%${search}%`),
            like(products.description, `%${search}%`),
            like(products.brand, `%${search}%`)
          )
        );
      }
      
      // Apply sorting
      if (sort) {
        switch(sort) {
          case 'price-asc':
            query = query.orderBy(asc(products.price));
            break;
          case 'price-desc':
            query = query.orderBy(desc(products.price));
            break;
          case 'rating-desc':
            query = query.orderBy(desc(products.rating));
            break;
          case 'newest':
            query = query.orderBy(desc(products.createdAt));
            break;
          default:
            // Default sorting
            query = query.orderBy(desc(products.featured), asc(products.title));
        }
      } else {
        // Default sorting
        query = query.orderBy(desc(products.featured), asc(products.title));
      }
      
      // Apply pagination
      query = query
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));
      
      const queryResults = await query;
      
      // Transform the results to include the category name as a property
      const results = queryResults.map(row => {
        return {
          ...row.product,
          category: row.categoryName || 'Uncategorized'
        };
      });
      
      // Get the total count for pagination (respecting the active filter)
      let countQuery = db.select({ count: sql`count(${products.id})` }).from(products);
      if (includeInactive !== 'true') {
        countQuery = countQuery.where(eq(products.active, true));
      }
      const [{ count }] = await countQuery;
      
      res.json({
        products: results,
        total: Number(count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      next(error);
    }
  });

  app.get("/api/products/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get product with category name
      const [result] = await db
        .select({
          product: products,
          categoryName: categories.name
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.id, id));
      
      if (!result || !result.product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Combine product with category name
      const product = {
        ...result.product,
        category: result.categoryName || 'Uncategorized'
      };
      
      // Allow viewing inactive products if requested by admin
      // But warn regular users if the product is inactive
      if (!product.active) {
        if (!req.isAuthenticated() || !(req.user as any).isAdmin) {
          return res.status(403).json({ 
            message: "This product is currently unavailable",
            product: {
              id: product.id,
              title: product.title,
              active: false
            }
          });
        }
      }
      
      res.json(product);
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      next(error);
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res, next) => {
    try {
      const allCategories = await db.select().from(categories);
      res.json(allCategories);
    } catch (error) {
      next(error);
    }
  });

  // Cart routes
  app.get("/api/cart", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = (req.user as any).id;
      
      // Get the user's cart or create one if it doesn't exist
      let cart = await storage.getCart(userId);
      
      if (!cart) {
        cart = await storage.createCart({ userId });
      }
      
      // Get the cart items with product details - only show active products
      const cartItemsWithProducts = await db
        .select({
          id: cartItems.id,
          productId: cartItems.productId,
          quantity: cartItems.quantity,
          addedAt: cartItems.addedAt,
          title: products.title,
          price: products.price,
          discountPercentage: products.discountPercentage,
          thumbnail: products.thumbnail,
          brand: products.brand,
          active: products.active
        })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .where(
          and(
            eq(cartItems.cartId, cart.id),
            eq(products.active, true) // Only show active products in cart
          )
        );
      
      res.json({
        cartId: cart.id,
        items: cartItemsWithProducts,
        itemCount: cartItemsWithProducts.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: cartItemsWithProducts.reduce((sum, item) => {
          const discountedPrice = item.price * (1 - (item.discountPercentage || 0) / 100);
          return sum + (discountedPrice * item.quantity);
        }, 0)
      });
    } catch (error) {
      next(error);
    }
  });

  // Get cart items
  app.get("/api/cart/items", async (req, res, next) => {
    try {
      // If user is not authenticated, create a guest cart in memory
      // This allows non-authenticated users to still use the cart functionality
      let items: {
        id: number;
        productId: number;
        quantity: number;
        title: string;
        price: number;
        thumbnail: string;
      }[] = [];
      
      if (req.isAuthenticated()) {
        const userId = (req.user as any).id;
        
        // Get the user's cart or create one
        let cart = await storage.getCart(userId);
        
        if (cart) {
          // Get the cart items with product details
          items = await db
            .select({
              id: cartItems.id,
              productId: cartItems.productId,
              quantity: cartItems.quantity,
              title: products.title,
              price: products.price,
              thumbnail: products.thumbnail,
            })
            .from(cartItems)
            .innerJoin(products, eq(cartItems.productId, products.id))
            .where(eq(cartItems.cartId, cart.id));
        }
      }
      
      res.json(items);
    } catch (error) {
      next(error);
    }
  });

  // Add item to cart
  app.post("/api/cart/items", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = (req.user as any).id;
      const { id, title, price, thumbnail, quantity = 1, description = "", brand = "", category = "other" } = req.body;
      
      if (!id) {
        return res.status(400).json({ message: "Product ID is required" });
      }
      
      // Get the user's cart or create one
      let cart = await storage.getCart(userId);
      
      if (!cart) {
        cart = await storage.createCart({ userId });
      }
      
      // Check if product exists in database
      let [existingProduct] = await db
        .select()
        .from(products)
        .where(eq(products.id, id));
      
      // If product doesn't exist, create it (for external products)
      if (!existingProduct) {
        try {
          // First, check if we have a default category
          let [defaultCategory] = await db
            .select()
            .from(categories)
            .where(eq(categories.name, "other"));
          
          // Create default category if it doesn't exist
          if (!defaultCategory) {
            [defaultCategory] = await db
              .insert(categories)
              .values({
                name: "other",
                slug: "other"
              })
              .returning();
          }

          // Then create the product
          [existingProduct] = await db
            .insert(products)
            .values({
              id: id, // Use the external ID
              title: title,
              description: description || "Product imported from external source",
              price: price,
              brand: brand || "Unknown",
              categoryId: defaultCategory.id,
              thumbnail: thumbnail || "",
              images: []
            })
            .returning();
            
          console.log(`Created product for external ID: ${id}`);
        } catch (err) {
          console.error("Error creating product:", err);
          // If we can't create the product, we'll just return a different error
          return res.status(400).json({ message: "Cannot add this product to cart" });
        }
      }
      
      // Add item to cart
      const cartItem = await storage.addCartItem({
        cartId: cart.id,
        productId: id,
        quantity
      });
      
      // Return the item with product details
      res.status(201).json({
        id: cartItem.id,
        productId: id,
        quantity: cartItem.quantity,
        title,
        price,
        thumbnail
      });
    } catch (error) {
      console.error("Error adding item to cart:", error);
      next(error);
    }
  });
  
  // Update cart item quantity
  app.put("/api/cart/items/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = (req.user as any).id;
      const itemId = parseInt(req.params.id);
      const { quantity } = req.body;
      
      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: "Valid quantity is required" });
      }
      
      // Verify the item belongs to the user's cart
      const cart = await storage.getCart(userId);
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }
      
      const [cartItem] = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.id, itemId),
            eq(cartItems.cartId, cart.id)
          )
        );
      
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      // Update the item quantity
      const updatedItem = await storage.updateCartItemQuantity(itemId, quantity);
      
      res.json(updatedItem);
    } catch (error) {
      next(error);
    }
  });
  
  // Remove item from cart
  app.delete("/api/cart/items/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = (req.user as any).id;
      const itemId = parseInt(req.params.id);
      
      // Verify the item belongs to the user's cart
      const cart = await storage.getCart(userId);
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }
      
      const [cartItem] = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.id, itemId),
            eq(cartItems.cartId, cart.id)
          )
        );
      
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      // Remove the item
      await storage.removeCartItem(itemId);
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  
  // Clear cart (remove all items)
  app.delete("/api/cart/items", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = (req.user as any).id;
      
      // Get the user's cart
      const cart = await storage.getCart(userId);
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }
      
      // Clear all items
      await storage.clearCart(cart.id);
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Stripe payment intent creation
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          message: "Stripe payment processing is unavailable. Please configure STRIPE_SECRET_KEY." 
        });
      }

      const { amount } = req.body;
      
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount provided" });
      }

      // Convert to smallest currency unit (cents for USD)
      const amountInCents = Math.round(amount * 100);

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        // Payment method types supported by your integration
        payment_method_types: ["card"],
        metadata: {
          integration_check: "e_commerce_payment"
        }
      });

      // Send the client secret to the client
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        message: "Error creating payment intent", 
        error: error.message 
      });
    }
  });

  // Validate promo codes
  app.post("/api/apply-promo", (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "No promo code provided" });
      }

      // Mock promo codes (in a real app, these would come from a database)
      const validPromoCodes: Record<string, { type: 'percentage' | 'fixed', value: number }> = {
        "SUMMER2023": { type: "fixed", value: 10 }, // $10 off
        "WELCOME15": { type: "fixed", value: 15 },  // $15 off
        "SAVE20": { type: "fixed", value: 20 }      // $20 off
      };

      if (validPromoCodes[code]) {
        res.json({
          valid: true,
          discount: validPromoCodes[code].value,
          type: validPromoCodes[code].type,
          message: `Promo code ${code} applied successfully!`
        });
      } else {
        res.json({
          valid: false,
          message: "Invalid promo code"
        });
      }
    } catch (error: any) {
      console.error("Error applying promo code:", error);
      res.status(500).json({ 
        message: "Error applying promo code", 
        error: error.message 
      });
    }
  });

  // Verify payment status
  app.get("/api/verify-payment/:paymentIntentId", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          message: "Stripe payment processing is unavailable. Please configure STRIPE_SECRET_KEY." 
        });
      }

      const { paymentIntentId } = req.params;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "No payment intent ID provided" });
      }

      // Retrieve the payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // Check if the payment was successful
      if (paymentIntent.status === "succeeded") {
        try {
          // Create a real order in the database
          if (!req.isAuthenticated()) {
            return res.status(401).json({ message: "User must be logged in to create an order" });
          }

          const userId = (req.user as any).id;
          
          // Get the user's cart
          const cart = await storage.getCart(userId);
          if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
          }
          
          // Get cart items
          const userCartItems = await db
            .select({
              id: cartItems.id,
              productId: cartItems.productId,
              quantity: cartItems.quantity,
              title: products.title,
              price: products.price
            })
            .from(cartItems)
            .innerJoin(products, eq(cartItems.productId, products.id))
            .where(eq(cartItems.cartId, cart.id));
          
          if (userCartItems.length === 0) {
            return res.status(400).json({ message: "Cannot create order with empty cart" });
          }
          
          // Calculate totals
          const total = userCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const tax = total * 0.1; // 10% tax
          const shipping = 5.99; // Fixed shipping cost
          
          // Create the order
          const order = await storage.createOrder({
            userId,
            status: "completed",
            total,
            tax,
            shipping,
            paymentIntentId,
            shippingAddress: null // No shipping address for now
          });
          
          // Create order items
          for (const item of userCartItems) {
            await storage.createOrderItem({
              orderId: order.id,
              productId: item.productId,
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              subtotal: item.price * item.quantity
            });
          }
          
          // Clear the cart
          await storage.clearCart(cart.id);
          
          // Return success with the real order ID
          res.json({
            success: true,
            orderId: order.id,
            message: "Payment successful and order created"
          });
        } catch (error: any) {
          console.error("Error creating order:", error);
          res.status(500).json({ 
            success: false, 
            message: "Payment was successful but there was an error creating your order",
            error: error.message
          });
        }
      } else {
        res.json({
          success: false,
          status: paymentIntent.status,
          message: "Payment not completed"
        });
      }
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ 
        message: "Error verifying payment", 
        error: error.message 
      });
    }
  });

  // Stripe webhook for payment events
  app.post("/api/stripe-webhook", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          message: "Stripe payment processing is unavailable. Please configure STRIPE_SECRET_KEY." 
        });
      }

      // Stripe requires the raw body to verify webhooks
      const payload = req.body;
      
      // In a production app, you would verify the webhook signature:
      // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      // const signature = req.headers['stripe-signature'];
      // let event;
      // try {
      //   event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
      // } catch (err) {
      //   return res.status(400).send(`Webhook Error: ${err.message}`);
      // }

      // Handle the event
      // Switch on event.type for different payment scenarios
      // Example: payment_intent.succeeded, payment_intent.payment_failed, etc.
      
      // For this demo, we'll just acknowledge receipt
      res.json({ received: true });
    } catch (error: any) {
      console.error("Error handling webhook:", error);
      res.status(500).json({ 
        message: "Error handling webhook", 
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
