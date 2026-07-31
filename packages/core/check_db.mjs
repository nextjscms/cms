import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: 'c:\\Users\\sopro\\.gemini\\antigravity-ide\\scratch\\nextjscms\\packages\\core\\.env.local' });

async function run() {
  const sql = neon(process.env.MARKETPLACE_DB_URL);
  const rows = await sql`SELECT slug, version, download_url FROM marketplace_themes`;
  console.log(rows);
}
run();
