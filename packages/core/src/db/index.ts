import { getDatabaseAdapter } from '../lib/registry';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// The application uses the registry to resolve the database adapter at runtime.
// No direct imports to Neon or Drizzle happen here anymore, ensuring the core CMS
// is strictly provider-agnostic.
export const dbAdapter = getDatabaseAdapter();

// Helper to get the underlying query builder
export function getDb() {
  // Reading cookies automatically opts the route into dynamic rendering,
  // preventing Next.js from statically generating DB pages at build time.
  cookies();
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    redirect('/setup');
  }
  return dbAdapter.getDb(dbUrl);
}
