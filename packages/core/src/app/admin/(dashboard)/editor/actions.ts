'use server';

import { getDb } from '@/db';
import { posts, pages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { nextjscms } from '@/lib/hooks';

type SavePostParams = {
  id?: number;
  type?: 'post' | 'page';
  postTypeId?: number | null;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  meta?: any;
  status: 'draft' | 'published';
};

export async function savePostAction(data: SavePostParams) {
  const db = getDb();
  
  // Basic validation
  if (!data.title) {
    return { success: false, error: 'Title is required' };
  }
  
  const type = data.type || 'post';
  const table = type === 'page' ? pages : posts;
  
  // Format slug if empty
  const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  let finalData: any = {
    title: data.title,
    slug,
    content: data.content,
    status: data.status,
    authorId: 1, // Mocked to Admin user for now
  };
  
  if (type === 'post') {
    finalData.postTypeId = data.postTypeId || null;
    finalData.meta = data.meta || null;
  }

  // 1. Fire beforeSave hook
  finalData = await nextjscms.emit('beforeSave', finalData);

  let savedItem;
  try {
    if (data.id) {
      // Update existing
      [savedItem] = await db.update(table)
        .set(finalData)
        .where(eq(table.id, data.id))
        .returning();
    } else {
      // Insert new
      [savedItem] = await db.insert(table)
        .values(finalData)
        .returning();
    }
    
    // 2. Fire afterSave hook
    await nextjscms.emit('afterSave', savedItem);
    
    if (type === 'page') {
      revalidatePath('/admin/pages');
    } else {
      revalidatePath('/admin/posts');
    }
    revalidatePath(`/${savedItem.slug}`);
    
    return { success: true, post: savedItem };
  } catch (error: any) {
    console.error('Save Post Error:', error);
    // Usually a unique constraint violation on the slug
    if (error.code === '23505') {
      return { success: false, error: `A ${type} with that slug already exists. Please choose another.` };
    }
    return { success: false, error: `Failed to save ${type}.` };
  }
}
