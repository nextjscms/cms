import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql as dSql } from 'drizzle-orm';
import path from 'path';

export class PostgresAdapter {
  private pools: Map<string, Pool> = new Map();

  private getPool(connectionString: string): Pool {
    if (!this.pools.has(connectionString)) {
      this.pools.set(connectionString, new Pool({ connectionString }));
    }
    return this.pools.get(connectionString)!;
  }

  async connect(connectionString: string): Promise<void> {
    this.getPool(connectionString);
    console.log("Connected to Postgres using:", connectionString);
  }

  async testConnection(connectionString: string): Promise<boolean> {
    try {
      const pool = this.getPool(connectionString);
      await pool.query('SELECT 1');
      return true;
    } catch (e) {
      return false;
    }
  }

  async migrate(dbUrl: string): Promise<void> {
    const pool = this.getPool(dbUrl);
    const db = drizzle(pool);
    const fs = (await import('fs')).default;
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    
    if (!fs.existsSync(migrationsFolder)) {
      console.warn("Migrations folder not found at:", migrationsFolder);
      return;
    }

    const files = fs.readdirSync(migrationsFolder).filter(f => f.endsWith('.sql')).sort();
    if (files.length === 0) return;

    // Check if migrations table exists
    const checkTable = await pool.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename='__drizzle_migrations'`);
    
    let appliedMigrations: string[] = [];
    if (checkTable.rows.length > 0) {
      const res = await pool.query(`SELECT hash FROM "drizzle"."__drizzle_migrations"`);
      appliedMigrations = res.rows.map((r: any) => r.hash);
    } else {
      // First run, setup drizzle schema
      await pool.query(`CREATE SCHEMA IF NOT EXISTS "drizzle"`);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
          id SERIAL PRIMARY KEY,
          hash text NOT NULL,
          created_at bigint
        )
      `);
    }

    for (const file of files) {
      const migrationHash = file;
      if (appliedMigrations.includes(migrationHash)) continue;

      const migrationFile = path.join(migrationsFolder, file);
      const content = fs.readFileSync(migrationFile, 'utf8');
      const queries = content.split('--> statement-breakpoint');
      
      for (const query of queries) {
        if (!query.trim()) continue;
        try {
          await pool.query(query.trim());
        } catch (e: any) {
          if (e.message && e.message.includes('already exists')) {
            console.warn(`Skipping existing relation in ${file}:`, e.message);
          } else {
            console.error(`Migration error in ${file}:`, e.message);
            throw new Error(`Failed to apply migration ${file}: ${e.message}`);
          }
        }
      }
      
      // Record successful migration
      await pool.query(`
        INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at)
        VALUES ($1, extract(epoch from now()) * 1000)
      `, [migrationHash]);
    }
  }

  async seedAdmin(dbUrl: string, data: { siteName: string; email: string; passwordHash: string }): Promise<void> {
    const pool = this.getPool(dbUrl);
    const db = drizzle(pool);

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
    
    const pool = this.getPool(dbUrl);
    try {
      const res = await pool.query(`SELECT * FROM "users" WHERE email = $1 LIMIT 1`, [email]);
      return res.rows.length > 0 ? res.rows[0] : null;
    } catch (e) {
      console.error("PostgresAdapter getUserByEmail error:", e);
      return null;
    }
  }

  getDb(dbUrl: string): any {
    const pool = this.getPool(dbUrl);
    return drizzle(pool);
  }
}
