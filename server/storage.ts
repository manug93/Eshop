import { 
  users, 
  products, 
  categories, 
  orders, 
  orderItems, 
  carts, 
  cartItems, 
  wishlists, 
  promotions, 
  translations,
  addresses,
  type User, 
  type InsertUser,
  type Product,
  type InsertProduct,
  type Category,
  type InsertCategory,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Cart,
  type InsertCart,
  type CartItem,
  type InsertCartItem,
  type Wishlist,
  type InsertWishlist,
  type Promotion,
  type InsertPromotion,
  type Translation,
  type InsertTranslation,
  type Address,
  type InsertAddress
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc, or, like } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: number, data: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User>;
  
  // Product methods
  getProducts(limit?: number, offset?: number): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductsByCategory(categoryId: number, limit?: number, offset?: number): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Order methods
  getOrders(userId?: number): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // OrderItem methods
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  
  // Cart methods
  getCart(userId: number): Promise<Cart | undefined>;
  createCart(cart: InsertCart): Promise<Cart>;
  
  // CartItem methods
  getCartItems(cartId: number): Promise<CartItem[]>;
  addCartItem(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined>;
  removeCartItem(id: number): Promise<boolean>;
  clearCart(cartId: number): Promise<boolean>;
  
  // Wishlist methods
  getWishlist(userId: number): Promise<Wishlist[]>;
  addToWishlist(wishlistItem: InsertWishlist): Promise<Wishlist>;
  removeFromWishlist(userId: number, productId: number): Promise<boolean>;
  
  // Promotion methods
  getActivePromotions(): Promise<Promotion[]>;
  getPromotionByCode(code: string): Promise<Promotion | undefined>;
  
  // Address methods
  getUserAddresses(userId: number): Promise<Address[]>;
  getUserDefaultAddress(userId: number): Promise<Address | undefined>;
  getAddressById(id: number): Promise<Address | undefined>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(id: number, addressData: Partial<InsertAddress>): Promise<Address | undefined>;
  deleteAddress(id: number): Promise<boolean>;
  setDefaultAddress(userId: number, addressId: number): Promise<boolean>;

  // Translation methods
  getTranslations(entityType: string, entityId: number, language: string): Promise<Translation[]>;
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Create the session table using the provided SQL from the connect-pg-simple documentation
    this.sessionStore = new PostgresSessionStore({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
      // Explicitly enable table creation
      createTableSql: `
        CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL,
          CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
        )
      `
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
  
  async updateUserStripeInfo(userId: number, data: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Product methods
  async getProducts(limit: number = 50, offset: number = 0): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .limit(limit)
      .offset(offset);
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async getProductsByCategory(categoryId: number, limit: number = 50, offset: number = 0): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(eq(products.categoryId, categoryId))
      .limit(limit)
      .offset(offset);
  }

  async searchProducts(query: string): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(
        or(
          like(products.title, `%${query}%`),
          like(products.description, `%${query}%`),
          like(products.brand, `%${query}%`)
        )
      );
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(productData)
      .returning();
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      console.log(`[Server] Starting deletion process for product ID: ${id}`);
      
      // First check if this product is referenced in any order items
      const orderItemsWithProduct = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.productId, id));
      
      console.log(`[Server] Product ID ${id} is referenced in ${orderItemsWithProduct.length} order items`);
      
      if (orderItemsWithProduct.length > 0) {
        // If product is referenced in orders, we should not delete it
        // Instead, mark it as out of stock and make it inactive
        console.log(`[Server] Cannot fully delete product ID ${id}, marking as inactive`);
        
        await db
          .update(products)
          .set({ 
            stock: 0,
            featured: false,
            // We could add a status field to products table in the future
          })
          .where(eq(products.id, id));
        
        console.log(`[Server] Product ID ${id} marked as inactive`);
        return true;
      }
      
      // If not referenced, we can safely delete it
      console.log(`[Server] Executing deletion of product ID ${id}`);
      const result = await db
        .delete(products)
        .where(eq(products.id, id));
      
      console.log(`[Server] Product ID ${id} successfully deleted`);  
      return true; // If no error was thrown, deletion was successful
    } catch (error) {
      console.error(`[Server] Error deleting product ID ${id}:`, error);
      throw error;
    }
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(categoryData)
      .returning();
    return category;
  }

  // Order methods
  async getOrders(userId?: number): Promise<Order[]> {
    if (userId) {
      return db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt));
    }
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return order;
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(orderData)
      .returning();
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // OrderItem methods
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(orderItemData: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db
      .insert(orderItems)
      .values(orderItemData)
      .returning();
    return orderItem;
  }

  // Cart methods
  async getCart(userId: number): Promise<Cart | undefined> {
    const [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId));
    return cart;
  }

  async createCart(cartData: InsertCart): Promise<Cart> {
    const [cart] = await db
      .insert(carts)
      .values(cartData)
      .returning();
    return cart;
  }

  // CartItem methods
  async getCartItems(cartId: number): Promise<CartItem[]> {
    return db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cartId));
  }

  async addCartItem(cartItemData: InsertCartItem): Promise<CartItem> {
    // Check if this product already exists in the cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cartItemData.cartId),
          eq(cartItems.productId, cartItemData.productId)
        )
      );

    if (existingItem) {
      // If it exists, update the quantity
      const [updatedItem] = await db
        .update(cartItems)
        .set({ 
          quantity: existingItem.quantity + (cartItemData.quantity || 1) 
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    }

    // Otherwise add a new item
    const [cartItem] = await db
      .insert(cartItems)
      .values(cartItemData)
      .returning();
    return cartItem;
  }

  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem;
  }

  async removeCartItem(id: number): Promise<boolean> {
    await db
      .delete(cartItems)
      .where(eq(cartItems.id, id));
    return true;
  }

  async clearCart(cartId: number): Promise<boolean> {
    await db
      .delete(cartItems)
      .where(eq(cartItems.cartId, cartId));
    return true;
  }

  // Wishlist methods
  async getWishlist(userId: number): Promise<Wishlist[]> {
    return db
      .select()
      .from(wishlists)
      .where(eq(wishlists.userId, userId));
  }

  async addToWishlist(wishlistData: InsertWishlist): Promise<Wishlist> {
    // Check if already exists
    const [existing] = await db
      .select()
      .from(wishlists)
      .where(
        and(
          eq(wishlists.userId, wishlistData.userId),
          eq(wishlists.productId, wishlistData.productId)
        )
      );

    if (existing) {
      return existing;
    }

    const [wishlistItem] = await db
      .insert(wishlists)
      .values(wishlistData)
      .returning();
    return wishlistItem;
  }

  async removeFromWishlist(userId: number, productId: number): Promise<boolean> {
    await db
      .delete(wishlists)
      .where(
        and(
          eq(wishlists.userId, userId),
          eq(wishlists.productId, productId)
        )
      );
    return true;
  }

  // Promotion methods
  async getActivePromotions(): Promise<Promotion[]> {
    const now = new Date();
    return db
      .select()
      .from(promotions)
      .where(
        and(
          eq(promotions.active, true),
          sql`${promotions.startDate} <= ${now}`,
          sql`${promotions.endDate} >= ${now}`
        )
      );
  }

  async getPromotionByCode(code: string): Promise<Promotion | undefined> {
    const [promotion] = await db
      .select()
      .from(promotions)
      .where(eq(promotions.code, code));
    return promotion;
  }

  // Address methods
  async getUserAddresses(userId: number): Promise<Address[]> {
    return db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.isDefault));
  }

  async getUserDefaultAddress(userId: number): Promise<Address | undefined> {
    const [address] = await db
      .select()
      .from(addresses)
      .where(
        and(
          eq(addresses.userId, userId),
          eq(addresses.isDefault, true)
        )
      );
    return address;
  }

  async getAddressById(id: number): Promise<Address | undefined> {
    const [address] = await db
      .select()
      .from(addresses)
      .where(eq(addresses.id, id));
    return address;
  }

  async createAddress(addressData: InsertAddress): Promise<Address> {
    // If this is the first address for the user or set as default, make sure any existing default is updated
    if (addressData.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(
          and(
            eq(addresses.userId, addressData.userId),
            eq(addresses.isDefault, true)
          )
        );
    }
    
    const [address] = await db
      .insert(addresses)
      .values(addressData)
      .returning();
    return address;
  }

  async updateAddress(id: number, addressData: Partial<InsertAddress>): Promise<Address | undefined> {
    // If setting as default, make sure any existing default is updated
    if (addressData.isDefault) {
      const [existingAddress] = await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, id));
        
      if (existingAddress) {
        await db
          .update(addresses)
          .set({ isDefault: false })
          .where(
            and(
              eq(addresses.userId, existingAddress.userId),
              eq(addresses.isDefault, true),
              sql`${addresses.id} != ${id}`
            )
          );
      }
    }
    
    const [updatedAddress] = await db
      .update(addresses)
      .set(addressData)
      .where(eq(addresses.id, id))
      .returning();
    return updatedAddress;
  }

  async deleteAddress(id: number): Promise<boolean> {
    // Check if this is a default address
    const [address] = await db
      .select()
      .from(addresses)
      .where(eq(addresses.id, id));
      
    if (address && address.isDefault) {
      // If deleting a default address, try to set another one as default
      const [anotherAddress] = await db
        .select()
        .from(addresses)
        .where(
          and(
            eq(addresses.userId, address.userId),
            sql`${addresses.id} != ${id}`
          )
        )
        .limit(1);
        
      if (anotherAddress) {
        await db
          .update(addresses)
          .set({ isDefault: true })
          .where(eq(addresses.id, anotherAddress.id));
      }
    }
    
    await db
      .delete(addresses)
      .where(eq(addresses.id, id));
    return true;
  }

  async setDefaultAddress(userId: number, addressId: number): Promise<boolean> {
    // First, set all addresses for this user to non-default
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.userId, userId));
      
    // Then set the specified address as default
    await db
      .update(addresses)
      .set({ isDefault: true })
      .where(
        and(
          eq(addresses.id, addressId),
          eq(addresses.userId, userId)
        )
      );
    return true;
  }

  // Translation methods
  async getTranslations(entityType: string, entityId: number, language: string): Promise<Translation[]> {
    return db
      .select()
      .from(translations)
      .where(
        and(
          eq(translations.entityType, entityType),
          eq(translations.entityId, entityId),
          eq(translations.language, language)
        )
      );
  }

  async createTranslation(translationData: InsertTranslation): Promise<Translation> {
    // Check if translation already exists
    const [existing] = await db
      .select()
      .from(translations)
      .where(
        and(
          eq(translations.entityType, translationData.entityType),
          eq(translations.entityId, translationData.entityId),
          eq(translations.language, translationData.language),
          eq(translations.field, translationData.field)
        )
      );

    if (existing) {
      // Update existing translation
      const [updated] = await db
        .update(translations)
        .set({ value: translationData.value })
        .where(eq(translations.id, existing.id))
        .returning();
      return updated;
    }

    // Create new translation
    const [translation] = await db
      .insert(translations)
      .values(translationData)
      .returning();
    return translation;
  }
}

export const storage = new DatabaseStorage();
