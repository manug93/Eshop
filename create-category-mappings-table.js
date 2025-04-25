// Script to create category_mappings table

import * as dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import ws from 'ws';

// Set WebSocket constructor for Neon
neonConfig.webSocketConstructor = ws;

dotenv.config();

// Create a new pool using the DATABASE_URL from environment variables
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createTable() {
  try {
    const result = await pool.query(`
      CREATE TABLE IF NOT EXISTS category_mappings (
        id SERIAL PRIMARY KEY,
        external_category TEXT NOT NULL UNIQUE,
        internal_category_id INTEGER NOT NULL REFERENCES categories(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('Table category_mappings created successfully');
    return result;
  } catch (err) {
    console.error('Error creating table:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

// Execute the function
createTable().then(() => {
  console.log('Script completed');
}).catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});