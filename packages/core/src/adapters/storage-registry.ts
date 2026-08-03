import { StorageAdapter } from './storage';
import { LocalStorageAdapter } from './local';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nextjscms } from '@/lib/hooks';

export async function getActiveStorageDriver(db: any): Promise<string> {
  let activeDriver = 'local';
  try {
    const activeSetting = await db.select().from(settings).where(eq(settings.key, 'media.storage.driver'));
    if (activeSetting.length > 0 && activeSetting[0].value) {
      activeDriver = activeSetting[0].value;
    }
  } catch (error) {
    console.warn("Could not load storage settings from DB, falling back to local.");
  }
  return activeDriver;
}

/**
 * Factory function to retrieve the configured Storage Adapter.
 * It reads the `settings` table to determine the active storage driver.
 * It then asks registered plugins to provide the adapter.
 * 
 * @param db The database instance
 * @param overrideDriver If provided, use this driver instead of the global active setting
 * @returns An initialized StorageAdapter
 */
export async function getStorageAdapter(db: any, overrideDriver?: string): Promise<StorageAdapter> {
  let activeDriver = overrideDriver;
  
  if (!activeDriver) {
    activeDriver = await getActiveStorageDriver(db);
  }

  // Allow plugins to intercept and provide the StorageAdapter based on the active driver
  const pluginAdapter = await nextjscms.emit('getStorageAdapter', { driver: activeDriver, db });
  
  // If a plugin returned a valid adapter, use it!
  if (pluginAdapter && pluginAdapter.upload) {
    return pluginAdapter as StorageAdapter;
  }

  // Fallback to local storage
  return new LocalStorageAdapter();
}
