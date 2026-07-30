'use server';

import { getDb } from '@/db';
import { postTypes } from '@/db/schema';
import { hasPermission } from '@/lib/auth-utils';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function savePostTypeAction(data: {
  id?: number;
  name: string;
  slug: string;
  icon?: string;
  schema: any[];
}) {
  const isAdmin = await hasPermission('admin');
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  const db = getDb();

  try {
    if (data.id) {
      // Update
      const [updated] = await db.update(postTypes).set({
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        schema: data.schema,
      }).where(eq(postTypes.id, data.id)).returning();
      
      revalidatePath('/admin', 'layout');
      return { success: true, postType: updated };
    } else {
      // Create
      const [created] = await db.insert(postTypes).values({
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        schema: data.schema,
      }).returning();

      revalidatePath('/admin', 'layout');
      return { success: true, postType: created };
    }
  } catch (error: any) {
    console.error('Failed to save post type:', error);
    return { success: false, error: error.message || 'Failed to save post type.' };
  }
}
