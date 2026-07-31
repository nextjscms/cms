import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import CustomizerClient from "@/app/admin/themes/customizer/CustomizerClient";

export default async function ThemeCustomizerPage() {
  const db = getDb();

  // 1. Get active theme
  const [activeThemeSetting] = await db.select().from(settings).where(eq(settings.key, 'activeTheme'));
  const activeTheme = activeThemeSetting?.value || 'default';

  // 2. Load theme.json
  const themeJsonPath = path.join(process.cwd(), `src/themes/${activeTheme}/theme.json`);
  let themeData: any = {};
  try {
    themeData = JSON.parse(fs.readFileSync(themeJsonPath, 'utf-8'));
  } catch (e) {
    return <div>Error loading theme settings for {activeTheme}.</div>;
  }

  const schema = themeData.settingsSchema || [];

  // 3. Fetch existing settings for this theme
  const allSettings = await db.select().from(settings);
  const initialSettings: Record<string, string> = {};
  allSettings.forEach(s => {
    initialSettings[s.key] = s.value || '';
  });

  return (
    <CustomizerClient
      activeTheme={activeTheme}
      themeData={themeData}
      schema={schema}
      initialSettings={initialSettings}
    />
  );
}
