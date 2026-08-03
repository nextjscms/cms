'use server';

import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import fs from 'fs';
import path from 'path';

export async function getMediaSettingsAction() {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  const db = getDb();
  
  const results = await db.select().from(settings).where(eq(settings.key, 'media.storage.driver'));
  
  const map: Record<string, string> = {
    driver: 'local',
  };

  if (results.length > 0 && results[0].value) {
    map.driver = results[0].value;
  }

  return map;
}

export async function saveMediaSettingsAction(data: Record<string, string>) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  const db = getDb();

  const toSave = [
    { key: 'media.storage.driver', value: data.driver || 'local' },
  ];

  for (const item of toSave) {
    const existing = await db.select().from(settings).where(eq(settings.key, item.key));
    if (existing.length > 0) {
      await db.update(settings).set({ value: item.value, updatedAt: new Date() }).where(eq(settings.key, item.key));
    } else {
      await db.insert(settings).values({ key: item.key, value: item.value });
    }
  }

  return { success: true };
}

export async function getStoragePluginsAction() {
  const pluginsDir = path.join(process.cwd(), 'src/plugins');
  const storagePlugins: { label: string; value: string }[] = [];
  
  // Always include the default local storage
  storagePlugins.push({ label: 'Local Storage (Default)', value: 'local' });

  if (!fs.existsSync(pluginsDir)) {
    return storagePlugins;
  }

  const pluginFolders = fs.readdirSync(pluginsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const folder of pluginFolders) {
    const pluginJsonPath = path.join(pluginsDir, folder, 'plugin.json');
    if (fs.existsSync(pluginJsonPath)) {
      try {
        const rawJson = fs.readFileSync(pluginJsonPath, 'utf-8');
        const parsed = JSON.parse(rawJson);
        if (parsed.category === 'Storage') {
          if (parsed.providesDrivers && Array.isArray(parsed.providesDrivers)) {
            parsed.providesDrivers.forEach((driver: {label: string, value: string}) => {
              storagePlugins.push(driver);
            });
          } else {
            let label = parsed.name || folder;
            storagePlugins.push({
              label: label,
              value: folder.replace('plugin-', '')
            });
          }
        }
      } catch (e) {
        console.warn(`Could not parse plugin.json for ${folder}`);
      }
    }
  }

  return storagePlugins;
}
