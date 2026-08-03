'use server';

import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

export async function getPluginSettings(slug: string) {
  const db = getDb();
  const existing = await db.select().from(settings).where(eq(settings.key, `plugin:${slug}`));
  
  if (existing.length > 0 && existing[0].value) {
    try {
      const parsed = JSON.parse(existing[0].value);
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string' && v.length > 0 && (k.toLowerCase().includes('secret') || k.toLowerCase().includes('password'))) {
          parsed[k] = '••••••••••••';
        }
      }
      return parsed;
    } catch (e) {
      return {};
    }
  }
  return {};
}

export async function savePluginSettings(slug: string, data: Record<string, any>) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  const db = getDb();
  const key = `plugin:${slug}`;

  const existingRows = await db.select().from(settings).where(eq(settings.key, key));
  let existingObj: Record<string, any> = {};
  if (existingRows.length > 0 && existingRows[0].value) {
    try { existingObj = JSON.parse(existingRows[0].value); } catch(e) {}
  }

  const newObj = { ...existingObj };
  
  for (const [k, v] of Object.entries(data)) {
    if (v === '••••••••••••') {
      continue;
    }
    newObj[k] = v;
  }

  const newValue = JSON.stringify(newObj);

  if (existingRows.length > 0) {
    await db.update(settings).set({ value: newValue }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value: newValue });
  }
}
