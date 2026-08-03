import { neon } from '@neondatabase/serverless';

async function check() {
  const sql = neon(process.env.DATABASE_URL!);
  const result = await sql`SELECT * FROM settings WHERE key = 'gitops_settings'`;
  console.log(result);
}
check();
