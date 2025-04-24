import { db } from "./db";
import { users } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  try {
    console.log("Checking for admin user...");
    
    // Check if admin user exists
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, "admin"));
    
    if (!adminUser) {
      console.log("Admin user not found, creating default admin...");
      
      // Create the admin user with specified credentials
      const hashedPassword = await hashPassword("eshop2025");
      
      await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        isAdmin: true,
        preferredLanguage: "en",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log("Default admin user created successfully!");
    } else {
      console.log("Admin user already exists, skipping creation.");
    }
  } catch (error) {
    console.error("Error seeding the database:", error);
  }
}