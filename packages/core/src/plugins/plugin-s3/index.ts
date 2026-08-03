import { nextjscms } from '@/lib/hooks';
import { S3StorageAdapter, S3Config } from './adapter';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

nextjscms.on('getStorageAdapter', async (data: any) => {
  if (data && (data.driver === 's3' || data.driver === 'r2')) {
    const existing = await data.db.select().from(settings).where(eq(settings.key, 'plugin:plugin-s3'));
    
    let configMap: Record<string, string> = {};
    if (existing.length > 0 && existing[0].value) {
      try {
        configMap = JSON.parse(existing[0].value);
      } catch (e) {}
    }

    const s3Config: S3Config = {
      bucketName: configMap['bucketName'],
      publicUrl: configMap['publicUrl'],
      region: configMap['region'],
      endpoint: configMap['endpoint'],
      accessKeyId: configMap['accessKeyId'],
      secretAccessKey: configMap['secretAccessKey'],
    };

    console.log(`[Plugin: S3] Intercepting getStorageAdapter. Returning S3StorageAdapter for driver ${data.driver}.`);
    return new S3StorageAdapter(s3Config);
  }
  return data;
});
