import fs from 'fs';
import path from 'path';
import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import PluginsClient from './PluginsClient';

type PluginInfo = {
  slug: string;
  name: string;
  version?: string;
  author?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  settingsSchema?: { key: string; label: string; type: string }[];
};

export default async function PluginsPage() {
  const db = getDb();

  // 1. Fetch currently active plugins from DB
  const [activePluginsSetting] = await db.select().from(settings).where(eq(settings.key, 'activePlugins'));
  let activePlugins: string[] = [];
  if (activePluginsSetting?.value) {
    try {
      activePlugins = JSON.parse(activePluginsSetting.value);
    } catch (e) {}
  }

  // 2. Scan the file system for plugins
  const pluginsDir = path.join(process.cwd(), 'src/plugins');
  
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
  }

  const pluginFolders = fs.readdirSync(pluginsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  // 3. Read plugin.json for each discovered folder
  const availablePlugins: PluginInfo[] = pluginFolders.map(folderName => {
    const pluginJsonPath = path.join(pluginsDir, folderName, 'plugin.json');
    let pluginInfo: PluginInfo = {
      slug: folderName,
      name: folderName.charAt(0).toUpperCase() + folderName.slice(1) // Fallback name
    };

    try {
      if (fs.existsSync(pluginJsonPath)) {
        const rawJson = fs.readFileSync(pluginJsonPath, 'utf-8');
        const parsed = JSON.parse(rawJson);
        pluginInfo = { ...pluginInfo, ...parsed, slug: folderName };
      }
    } catch (e) {
      console.warn(`Could not parse plugin.json for ${folderName}`);
    }

    return pluginInfo;
  });

  return (
    <div className="h-full flex flex-col">
      <PluginsClient localPlugins={availablePlugins} activePluginSlugs={activePlugins} />
    </div>
  );
}
