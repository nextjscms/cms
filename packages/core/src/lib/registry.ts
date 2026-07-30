import { DatabaseAdapter } from '../adapters/database';
import { StorageAdapter } from '../adapters/storage';
import { NeonAdapter } from '@nextjscms/adapter-neon';
import { LocalStorageAdapter } from '@nextjscms/adapter-local';

/**
 * The core factory that dynamically resolves the correct adapter based on the environment configuration.
 * This completely isolates the core CMS from any specific third-party provider dependencies.
 */
export function getDatabaseAdapter(): DatabaseAdapter {
  // In a full implementation, we'd read process.env.DATABASE_PROVIDER
  // For the MVP, we instantiate the Neon Adapter as the default provider.
  return new NeonAdapter();
}

/**
 * Resolves the correct Storage Adapter based on the environment configuration.
 */
export function getStorageAdapter(): StorageAdapter {
  // In a full implementation, we'd read process.env.STORAGE_PROVIDER to choose S3 or Local
  // For now, we instantiate Local Storage for development testing.
  return new LocalStorageAdapter();
}
