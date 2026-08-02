import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { BasePostgresAdapter } from './base-postgres';

export class NeonAdapter extends BasePostgresAdapter {
  async connect(connectionString: string): Promise<void> {
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

  getDb(dbUrl: string): any {
    const sql = neon(dbUrl);
    return drizzle(sql);
  }

  protected async query(dbUrl: string, sqlString: string, params?: any[]): Promise<any[]> {
    const sql = neon(dbUrl);
    // Neon HTTP driver returns the rows directly or nested differently based on usage,
    // but typically `sql(string, params)` returns the rows array.
    const result = await (sql as any)(sqlString, params || []);
    return result;
  }
}
