import { db } from './db';
import { sql } from 'drizzle-orm';
import { log } from './vite';

async function main() {
  log('Migrating database schema...', 'migrate');
  
  try {
    // Run the migrations
    await db.execute(sql`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
      ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT,
      ADD COLUMN IF NOT EXISTS stripe_ref_number TEXT,
      ADD COLUMN IF NOT EXISTS payment_method TEXT,
      ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'
    `);
    
    log('Database migration completed successfully', 'migrate');
  } catch (error) {
    log(`Migration failed: ${error}`, 'migrate');
    console.error(error);
    process.exit(1);
  }
}

main();