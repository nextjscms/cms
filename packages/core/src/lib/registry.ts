import { DatabaseAdapter } from '../adapters/database';
import { StorageAdapter } from '../adapters/storage';
import { NeonAdapter } from '../adapters/neon';
import { PostgresAdapter } from '../adapters/postgres';
import { LocalStorageAdapter } from '../adapters/local';

/**
 * The core factory that dynamically resolves the correct adapter based on the environment configuration.
 * This completely isolates the core CMS from any specific third-party provider dependencies.
 */
export function getDatabaseAdapter(providerArg?: string): DatabaseAdapter {
  const provider = providerArg || process.env.DATABASE_PROVIDER || 'neon';
  
  if (provider === 'neon') {
    return new NeonAdapter();
  }
  
  // For supabase, vercel postgres, manual postgres connections
  return new PostgresAdapter();
}

/**
 * Resolves the correct Storage Adapter based on the environment configuration.
 */
export function getStorageAdapter(): StorageAdapter {
  // In a full implementation, we'd read process.env.STORAGE_PROVIDER to choose S3 or Local
  // For now, we instantiate Local Storage for development testing.
  return new LocalStorageAdapter();
}
