// Abstract Database Adapter Interface
export interface DatabaseAdapter {
  /**
   * Connect to the database using a connection string.
   */
  connect(connectionString: string): Promise<void>;

  /**
   * Test if the connection is valid and the schema exists.
   */
  testConnection(connectionString: string): Promise<boolean>;

  /**
   * Run migrations to initialize the database schema.
   */
  migrate(dbUrl: string): Promise<void>;

  /**
   * Seed the database with the initial admin user and site settings.
   */
  seedAdmin(dbUrl: string, data: { siteName: string; email: string; passwordHash: string }): Promise<void>;

  /**
   * Fetch a user by their email address.
   */
  getUserByEmail(email: string): Promise<any | null>;

  /**
   * Get the underlying Drizzle ORM instance for the application to use.
   */
  getDb(dbUrl: string): import('drizzle-orm/pg-core').PgDatabase<any, any, any>;
}
