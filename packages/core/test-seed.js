const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const { sql: dSql } = require('drizzle-orm');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
const url = process.env.DATABASE_URL;

async function run() {
  try {
    const sql = neon(url);
    const db = drizzle(sql);
    
    await db.execute(dSql.raw(`INSERT INTO users (name, email, password, role, created_at) VALUES ('Admin', 'test@example.com', 'testhash', 'admin', NOW()) ON CONFLICT (email) DO NOTHING;`));
    
    console.log('Seed OK');
  } catch (e) {
    console.error('Seed Error:', e);
  }
}
run();
