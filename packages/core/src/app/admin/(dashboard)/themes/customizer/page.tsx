import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const themeSettingsMap = new Map();
  allSettings.forEach(s => themeSettingsMap.set(s.key, s.value));

  // Server Action to save settings
  async function saveSettings(formData: FormData) {
    'use server';
    const db = getDb();
    
    // Iterate over schema to get submitted values
    for (const field of schema) {
      const val = formData.get(field.id) as string;
      const key = `theme_${activeTheme}_${field.id}`;
      
      const existing = await db.select().from(settings).where(eq(settings.key, key));
      if (existing.length > 0) {
        await db.update(settings).set({ value: val }).where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({ key, value: val });
      }
    }
    
    redirect('/admin/themes');
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Theme Customizer</h1>
        <p className="text-slate-500 mt-1">Customizing: <strong className="text-slate-900">{themeData.name}</strong></p>
      </div>

      <form action={saveSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        {schema.length === 0 ? (
          <p className="text-slate-500 text-sm">This theme has no customizable settings.</p>
        ) : (
          schema.map((field: any) => {
            const key = `theme_${activeTheme}_${field.id}`;
            const currentValue = themeSettingsMap.get(key) ?? field.default ?? '';

            return (
              <div key={field.id} className="grid gap-2">
                <Label htmlFor={field.id}>{field.label}</Label>
                {field.type === 'color' ? (
                  <div className="flex items-center gap-3">
                    <Input 
                      type="color" 
                      id={field.id} 
                      name={field.id} 
                      defaultValue={currentValue} 
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <span className="text-sm text-slate-500 uppercase font-mono">{currentValue}</span>
                  </div>
                ) : field.type === 'boolean' ? (
                  <select 
                    id={field.id} 
                    name={field.id} 
                    defaultValue={currentValue === 'true' || currentValue === true ? 'true' : 'false'}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : (
                  <Input 
                    type="text" 
                    id={field.id} 
                    name={field.id} 
                    defaultValue={currentValue} 
                    placeholder={field.default}
                  />
                )}
              </div>
            );
          })
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <Button variant="outline" type="button" asChild>
            <a href="/admin/themes">Cancel</a>
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
