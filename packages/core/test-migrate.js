const { NeonAdapter } = require('@nextjscms/adapter-neon');
const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const { migrate } = require('drizzle-orm/neon-http/migrator');
const path = require('path');

const url = "postgresql://neondb_owner:npg_jD6NJcv9YeVa@ep-falling-dust-ayo6gi2c-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function run() {
  try {
    const sql = neon(url);
    console.log("Starting migration...");
    await sql`ALTER TABLE post_types ADD COLUMN IF NOT EXISTS icon text;`;
    console.log("Migration finished!");
  } catch (error) {
    console.error("Migration error caught:", error.message || error);
  }
}

run();
