import { db, pool } from "./db";
import { sql } from "drizzle-orm";

async function addActiveColumn() {
  try {
    console.log("Adding 'active' column to products table...");
    
    // Check if column exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'active';
    `);
    
    // If column doesn't exist, add it
    if (result.length === 0) {
      await db.execute(sql`
        ALTER TABLE products 
        ADD COLUMN active BOOLEAN DEFAULT TRUE;
      `);
      console.log("Column 'active' added successfully!");
    } else {
      console.log("Column 'active' already exists.");
    }
    
    // Update existing inactive products (with stock = 0)
    console.log("Updating existing inactive products...");
    await db.execute(sql`
      UPDATE products 
      SET active = FALSE 
      WHERE stock = 0 AND active = TRUE;
    `);
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

// Run the migration
addActiveColumn();