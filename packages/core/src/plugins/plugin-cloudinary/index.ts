import { nextjscms } from '@/lib/hooks';
import { CloudinaryStorageAdapter, CloudinaryConfig } from './adapter';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

nextjscms.on('getStorageAdapter', async (data: any) => {
  if (data && data.driver === 'cloudinary') {
    let configMap: CloudinaryConfig = {};

    try {
      const existing = await data.db.select().from(settings).where(eq(settings.key, 'plugin:plugin-cloudinary'));
      
      if (existing.length > 0 && existing[0].value) {
        configMap = JSON.parse(existing[0].value);
      }
    } catch (e) {
      console.warn("Could not load Cloudinary plugin settings, falling back to ENV variables.");
    }

    return new CloudinaryStorageAdapter(configMap);
  }
  return data;
});
