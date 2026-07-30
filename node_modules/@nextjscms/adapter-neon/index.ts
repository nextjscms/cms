import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { sql as dSql } from 'drizzle-orm';
import path from 'path';

export class NeonAdapter {
  async connect(connectionString: string): Promise<void> {
    // In a full implementation, we'd establish the Drizzle pool here.
    // For MVP, we just prove the concept.
    console.log("Connected to Neon using:", connectionString);
  }

  async testConnection(connectionString: string): Promise<boolean> {
    try {
      const sql = neon(connectionString);
      await sql`SELECT 1`;
      return true;
    } catch (e) {
      return false;
    }
  }

  async migrate(dbUrl: string): Promise<void> {
    const sql = neon(dbUrl);
    const db = drizzle(sql);
    const fs = require('fs');
    const migrationFile = path.join(process.cwd(), 'drizzle', '0000_many_the_santerians.sql');
    if (!fs.existsSync(migrationFile)) return;

    // Check if tables exist to avoid Drizzle migrator silent failures
    const checkTable = await (sql as any).query(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename='users'`);
    
    if (checkTable.length === 0) {
      const content = fs.readFileSync(migrationFile, 'utf8');
      const queries = content.split('--> statement-breakpoint');
      
      for (const query of queries) {
        if (!query.trim()) continue;
        await (sql as any).query(query.trim());
      }
      
      await (sql as any).query(`CREATE SCHEMA IF NOT EXISTS "drizzle"`);
      await (sql as any).query(`
        CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
          id SERIAL PRIMARY KEY,
          hash text NOT NULL,
          created_at bigint
        )
      `);
      // Ignore conflict if it was already inserted by a failed run
      await (sql as any).query(`
        INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at)
        SELECT '053e0728298665aeddc3e35e192b23ee74f929b23567b705452712523830a2f2', extract(epoch from now()) * 1000
        WHERE NOT EXISTS (
          SELECT id FROM "drizzle"."__drizzle_migrations" WHERE hash = '053e0728298665aeddc3e35e192b23ee74f929b23567b705452712523830a2f2'
        )
      `);
    }
  }

  async seedAdmin(dbUrl: string, data: { siteName: string; email: string; passwordHash: string }): Promise<void> {
    const sql = neon(dbUrl);
    const db = drizzle(sql);

    // Instead of importing the schema from core (which creates circular dependency),
    // we can execute a raw SQL insert, or we can use drizzle's raw execution.
    await db.execute(dSql`
      INSERT INTO "users" ("name", "email", "password", "role", "created_at") 
      VALUES ('Admin', ${data.email}, ${data.passwordHash}, 'admin', NOW())
      ON CONFLICT ("email") DO NOTHING
    `);

    await db.execute(dSql`
      INSERT INTO "settings" ("key", "value", "updated_at") 
      VALUES ('siteName', ${data.siteName}, NOW())
      ON CONFLICT ("key") DO UPDATE SET "value" = ${data.siteName}, "updated_at" = NOW()
    `);
  }

  async getUserByEmail(email: string): Promise<any | null> {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return null;
    
    const sql = neon(dbUrl);
    try {
      const res = await (sql as any).query(`SELECT * FROM "users" WHERE email = $1 LIMIT 1`, [email]);
      return res.length > 0 ? res[0] : null;
    } catch (e) {
      console.error("NeonAdapter getUserByEmail error:", e);
      return null;
    }
  }

  getDb(dbUrl: string): any {
    const sql = neon(dbUrl);
    return drizzle(sql);
  }
}
