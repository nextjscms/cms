import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { BasePostgresAdapter } from './base-postgres';

export class PostgresAdapter extends BasePostgresAdapter {
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
