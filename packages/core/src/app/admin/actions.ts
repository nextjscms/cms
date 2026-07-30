'use server';

import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function activateTheme(formData: FormData) {
  const slug = formData.get('themeSlug') as string;
  
  if (slug) {
    const db = getDb();
    const existing = await db.select().from(settings).where(eq(settings.key, 'activeTheme'));
    
    if (existing.length > 0) {
      await db.update(settings).set({ value: slug }).where(eq(settings.key, 'activeTheme'));
    } else {
      await db.insert(settings).values({ key: 'activeTheme', value: slug });
    }
    
    // Revalidate paths to ensure the frontend updates immediately
    revalidatePath('/');
    revalidatePath('/admin/themes');
  }
}
