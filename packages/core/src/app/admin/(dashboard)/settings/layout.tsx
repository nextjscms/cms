import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Settings, Image as ImageIcon, Mail, Puzzle } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const db = getDb();

  // Fetch active plugins
  const [activePluginsSetting] = await db.select().from(settings).where(eq(settings.key, 'activePlugins'));
  let activePlugins: string[] = [];
  if (activePluginsSetting?.value) {
    try {
      activePlugins = JSON.parse(activePluginsSetting.value);
    } catch (e) { }
  }

  const pluginsDir = path.join(process.cwd(), 'src/plugins');

  // Get all active plugins that have a settingsSchema
  const pluginSettingsLinks: { slug: string; name: string }[] = [];

  for (const slug of activePlugins) {
    const pluginJsonPath = path.join(pluginsDir, slug, 'plugin.json');
    if (fs.existsSync(pluginJsonPath)) {
      try {
        const rawJson = fs.readFileSync(pluginJsonPath, 'utf-8');
        const parsed = JSON.parse(rawJson);
        pluginSettingsLinks.push({
          slug,
          name: parsed.name || slug,
        });
      } catch (e) { }
    }
  }

  return (
    <div className="flex h-full flex-col md:flex-row gap-6">
      <aside className="w-full md:w-64 shrink-0">
        <h2 className="font-semibold text-lg mb-4">Settings</h2>

        <div className="space-y-6">
          {/* Core Settings */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Core</h3>
            <nav className="space-y-1">
              <Link href="/admin/settings" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-slate-700 hover:bg-slate-100 font-medium">
                <Settings className="w-4 h-4 text-slate-500" />
                General
              </Link>
              <Link href="/admin/settings/media" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-slate-700 hover:bg-slate-100 font-medium">
                <ImageIcon className="w-4 h-4 text-slate-500" />
                Media
              </Link>
              <Link href="#" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-slate-400 font-medium cursor-not-allowed">
                <Mail className="w-4 h-4 text-slate-400" />
                Email (Coming Soon)
              </Link>
            </nav>
          </div>

          {/* Plugin Settings */}
          {pluginSettingsLinks.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Plugins</h3>
              <nav className="space-y-1">
                {pluginSettingsLinks.map(plugin => (
                  <Link
                    key={plugin.slug}
                    href={`/admin/settings/plugins/${plugin.slug}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-slate-700 hover:bg-slate-100 font-medium"
                  >
                    <Puzzle className="w-4 h-4 text-slate-500" />
                    <span className="truncate">{plugin.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
