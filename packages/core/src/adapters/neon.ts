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
    const fs = (await import('fs')).default;
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    
    if (!fs.existsSync(migrationsFolder)) {
      console.warn("Migrations folder not found at:", migrationsFolder);
      return;
    }

    const files = fs.readdirSync(migrationsFolder).filter(f => f.endsWith('.sql')).sort();
    if (files.length === 0) return;

    // Check if migrations table exists
    const checkTable = await (sql as any).query(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename='__drizzle_migrations'`);
    
    let appliedMigrations: string[] = [];
    if (checkTable.length > 0) {
      const res = await (sql as any).query(`SELECT hash FROM "drizzle"."__drizzle_migrations"`);
      appliedMigrations = res.map((r: any) => r.hash);
    } else {
      // First run, setup drizzle schema
      await (sql as any).query(`CREATE SCHEMA IF NOT EXISTS "drizzle"`);
      await (sql as any).query(`
        CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
          id SERIAL PRIMARY KEY,
          hash text NOT NULL,
          created_at bigint
        )
      `);
    }

    for (const file of files) {
      // Simple hash to track if applied (just use filename as hash for simplicity in this manual migrator)
      const migrationHash = file;
      if (appliedMigrations.includes(migrationHash)) continue;

      const migrationFile = path.join(migrationsFolder, file);
      const content = fs.readFileSync(migrationFile, 'utf8');
      const queries = content.split('--> statement-breakpoint');
      
      for (const query of queries) {
        if (!query.trim()) continue;
        try {
          await (sql as any).query(query.trim());
        } catch (e: any) {
          console.error(`Migration error in ${file}:`, e.message);
          throw new Error(`Failed to apply migration ${file}: ${e.message}`);
        }
      }
      
      // Record successful migration
      await (sql as any).query(`
        INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at)
        VALUES ($1, extract(epoch from now()) * 1000)
      `, [migrationHash]);
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

    let repoUrl = null;
    if (process.env.VERCEL_GIT_PROVIDER === 'github' && process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG) {
      repoUrl = `https://github.com/${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`;
    } else if (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG) {
      // Fallback for gitlab/bitbucket if ever supported, though urls might differ. Default to github format or generic.
      repoUrl = `https://${process.env.VERCEL_GIT_PROVIDER || 'github'}.com/${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`;
    }

    if (repoUrl) {
      await db.execute(dSql`
        INSERT INTO "settings" ("key", "value", "updated_at") 
        VALUES ('gitRepositoryUrl', ${repoUrl}, NOW())
        ON CONFLICT ("key") DO UPDATE SET "value" = ${repoUrl}, "updated_at" = NOW()
      `);
    }
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
