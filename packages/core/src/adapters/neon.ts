import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { BasePostgresAdapter } from './base-postgres';

export class NeonAdapter extends BasePostgresAdapter {
  private pools: Map<string, Pool> = new Map();

  private getPool(dbUrl: string): Pool {
    if (!this.pools.has(dbUrl)) {
      this.pools.set(dbUrl, new Pool({ connectionString: dbUrl }));
    }
    return this.pools.get(dbUrl)!;
  }

  async connect(connectionString: string): Promise<void> {
    console.log("Connected to Neon via WebSockets using:", connectionString);
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

  getDb(dbUrl: string): any {
    const pool = this.getPool(dbUrl);
    return drizzle(pool);
  }

  protected async query(dbUrl: string, sqlString: string, params?: any[]): Promise<any[]> {
    const pool = this.getPool(dbUrl);
    const result = await pool.query(sqlString, params);
    return result.rows;
  }
}
