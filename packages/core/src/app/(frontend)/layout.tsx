import { getDb } from '@/db';
import { settings, menus, menuItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getThemeComponent, loadThemeCSS } from '@/themes/registry';
import "../frontend.css";

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const db = getDb();
  
  // 1. Fetch active theme from settings
  const [activeThemeSetting] = await db.select().from(settings).where(eq(settings.key, 'activeTheme'));
  const activeTheme = activeThemeSetting?.value || 'default';
  
  // 2. Load Theme CSS
  await loadThemeCSS(activeTheme);

  // 3. Fetch Theme Settings
  const allSettings = await db.select().from(settings);
  const themeSettings: Record<string, string> = {};
  allSettings.forEach((s: typeof settings.$inferSelect) => {
    if (s.key === 'siteName') themeSettings.siteName = s.value || 'NextjsCMS';
    const prefix = `theme_${activeTheme}_`;
    if (s.key.startsWith(prefix)) {
      const key = s.key.replace(prefix, '');
      themeSettings[key] = s.value || '';
    }
  });
  
  // 4. Fetch All Menus
  const allMenus = await db.select().from(menus);
  const allMenuItems = await db.select().from(menuItems).orderBy(menuItems.order);
  
  const themeMenus: Record<string, any[]> = {};
  allMenus.forEach((m: typeof menus.$inferSelect) => {
    themeMenus[m.slug] = allMenuItems.filter((item: typeof menuItems.$inferSelect) => item.menuId === m.id);
  });

  // 5. Dynamically load the layout component for the active theme
  const ThemeLayout = await getThemeComponent(activeTheme, 'layout');

  return (
    <ThemeLayout settings={themeSettings} menus={themeMenus}>
      {children}
    </ThemeLayout>
  );
}
