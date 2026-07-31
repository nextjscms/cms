'use server';
import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function saveThemeSettings(activeTheme: string, draftSettings: Record<string, string>) {
  const db = getDb();

  for (const [key, val] of Object.entries(draftSettings)) {
    // Only save keys that belong to this theme (or global siteName)
    if (key.startsWith(`theme_${activeTheme}_`) || key === 'siteName') {
      const existing = await db.select().from(settings).where(eq(settings.key, key));
      if (existing.length > 0) {
        await db.update(settings).set({ value: val }).where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({ key, value: val });
      }
    }
  }

  // Settings are saved. Return success or redirect.
  // Note: We might just want to return success so the user can keep editing, 
  // but a typical "Save & Exit" works too.
  redirect('/admin/themes');
}
