'use server';

import { getDb } from '@/db';
import { menus, menuItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

type SaveMenuParams = {
  menuSlug: string;
  items: Array<{ label: string; url: string; order: number }>;
};

export async function saveMenuAction(data: SaveMenuParams) {
  const db = getDb();
  
  try {
    // 1. Ensure the menu exists
    let [menu] = await db.select().from(menus).where(eq(menus.slug, data.menuSlug));
    
    if (!menu) {
      const [newMenu] = await db.insert(menus).values({
        name: data.menuSlug.charAt(0).toUpperCase() + data.menuSlug.slice(1),
        slug: data.menuSlug,
      }).returning();
      menu = newMenu;
    }

    // 2. Delete all existing items for this menu
    await db.delete(menuItems).where(eq(menuItems.menuId, menu.id));

    // 3. Insert new items
    if (data.items && data.items.length > 0) {
      const insertData = data.items.map((item, index) => ({
        menuId: menu.id,
        label: item.label,
        url: item.url,
        order: index, // Ensure order matches array index
      }));
      
      await db.insert(menuItems).values(insertData);
    }
    
    // 4. Revalidate frontend cache
    revalidatePath('/');
    
    return { success: true };
  } catch (error: any) {
    console.error('Save Menu Error:', error);
    return { success: false, error: 'Failed to save menu.' };
  }
}
