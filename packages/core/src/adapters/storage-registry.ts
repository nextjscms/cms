import { StorageAdapter } from './storage';
import { LocalStorageAdapter } from './local';
import { S3StorageAdapter, S3Config } from './s3';
import { settings } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * Factory function to retrieve the configured Storage Adapter.
 * It reads the `settings` table to determine the active storage driver and its configuration.
 * 
 * @param db The database instance
 * @returns An initialized StorageAdapter
 */
export async function getStorageAdapter(db: any): Promise<StorageAdapter> {
  let activeDriver = 's3';
  let s3Config: S3Config = {};

  try {
    const activeSetting = await db.select().from(settings).where(eq(settings.key, 'media.storage.driver'));
    if (activeSetting.length > 0 && activeSetting[0].value) {
      activeDriver = activeSetting[0].value;
    }

    if (activeDriver === 's3' || activeDriver === 'r2') {
      const configKeys = [
        'media.s3.bucketName',
        'media.s3.publicUrl',
        'media.s3.region',
        'media.s3.endpoint',
        'media.s3.accessKeyId',
        'media.s3.secretAccessKey'
      ];
      
      const configRows = await db.select().from(settings).where(inArray(settings.key, configKeys));
      
      const configMap: Record<string, string> = {};
      configRows.forEach((row: any) => {
        configMap[row.key] = row.value || '';
      });

      s3Config = {
        bucketName: configMap['media.s3.bucketName'],
        publicUrl: configMap['media.s3.publicUrl'],
        region: configMap['media.s3.region'],
        endpoint: configMap['media.s3.endpoint'],
        accessKeyId: configMap['media.s3.accessKeyId'],
        secretAccessKey: configMap['media.s3.secretAccessKey'],
      };
    }
  } catch (error) {
    console.warn("Could not load storage settings from DB, falling back to process.env defaults.");
  }

  if (activeDriver === 's3' || activeDriver === 'r2') {
    return new S3StorageAdapter(s3Config);
  }

  return new LocalStorageAdapter();
}
