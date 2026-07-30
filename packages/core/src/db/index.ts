import { getDatabaseAdapter } from '../lib/registry';

// The application uses the registry to resolve the database adapter at runtime.
// No direct imports to Neon or Drizzle happen here anymore, ensuring the core CMS
// is strictly provider-agnostic.
export const dbAdapter = getDatabaseAdapter();

// Helper to get the underlying query builder
export function getDb() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("Database URL is not configured. CMS is not installed.");
  return dbAdapter.getDb(dbUrl);
}
