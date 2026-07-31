import { redirect } from 'next/navigation';
import { getDb } from '@/db';
import { settings, menus, menuItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getThemeComponent, loadThemeCSS } from '@/themes/registry';
import CustomizerPreviewSync from '@/components/CustomizerPreviewSync';
import fs from 'fs';
import path from 'path';
import "../frontend.css";

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const db = getDb();

  // 1. Fetch active theme from settings
  let activeTheme = 'default';
  try {
    const [activeThemeSetting] = await db.select().from(settings).where(eq(settings.key, 'activeTheme'));
    activeTheme = activeThemeSetting?.value || 'default';
  } catch (error: any) {
    if (error.message?.includes('relation "settings" does not exist') || error.message?.includes('does not exist')) {
      console.error("Database tables missing on frontend. Redirecting to setup.");
      redirect('/setup');
    }
    throw error;
  }

  // 2. Load Theme CSS
  await loadThemeCSS(activeTheme);

  // 3. Load theme.json for defaults
  let defaultSettings: Record<string, string> = {};
  try {
    const themeJsonPath = path.join(process.cwd(), `src/themes/${activeTheme}/theme.json`);
    const themeData = JSON.parse(fs.readFileSync(themeJsonPath, 'utf-8'));
    (themeData.settingsSchema || []).forEach((field: any) => {
      if (field.default !== undefined) {
        defaultSettings[field.id] = String(field.default);
      }
    });
  } catch (e) {
    // Ignore errors if theme.json doesn't exist
  }

  // 4. Fetch Theme Settings from DB
  const allSettings = await db.select().from(settings);
  const dbSettings: Record<string, string> = {};
  allSettings.forEach((s: typeof settings.$inferSelect) => {
    if (s.key === 'siteName') dbSettings.siteName = s.value || 'NextjsCMS';
    const prefix = `theme_${activeTheme}_`;
    if (s.key.startsWith(prefix)) {
      const key = s.key.replace(prefix, '');
      dbSettings[key] = s.value || '';
    }
  });

  // Merge defaults with DB settings (DB wins)
  const themeSettings = { ...defaultSettings, ...dbSettings };

  // 5. Fetch All Menus
  const allMenus = await db.select().from(menus);
  const allMenuItems = await db.select().from(menuItems).orderBy(menuItems.order);

  const themeMenus: Record<string, any[]> = {};
  allMenus.forEach((m) => {
    themeMenus[m.slug] = allMenuItems.filter((item) => item.menuId === m.id);
  });

  // 6. Dynamically load the layout component for the active theme
  const ThemeLayout = await getThemeComponent(activeTheme, 'layout');

  const cssVarsString = Object.entries(themeSettings).map(([key, value]) => {
    return `--${key}: ${value};`;
  }).join(' ');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `:root { ${cssVarsString} }` }} />
      <ThemeLayout settings={themeSettings} menus={themeMenus}>
        <CustomizerPreviewSync />
        {children}
      </ThemeLayout>
    </>
  );
}
