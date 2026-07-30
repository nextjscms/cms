import { getDb } from '@/db';
import { menus, menuItems } from '@/db/schema';
import MenuEditorClient from './MenuEditorClient';

export default async function MenusAdminPage() {
  const db = getDb();
  
  const allMenus = await db.select().from(menus);
  const allItems = await db.select().from(menuItems).orderBy(menuItems.order);
  
  const groupedMenus: Record<string, any[]> = {};
  allMenus.forEach(m => {
    groupedMenus[m.slug] = allItems.filter(i => i.menuId === m.id);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Menus</h1>
        <p className="text-slate-500 mt-1">Configure the navigation menus for your theme.</p>
      </div>

      <MenuEditorClient allMenus={groupedMenus} />
    </div>
  );
}
