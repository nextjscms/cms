import fs from 'fs';
import path from 'path';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import PluginSettingsForm from './PluginSettingsForm';
import SidebarVisibilityToggle from './SidebarVisibilityToggle';
import { getHiddenSidebarPlugins } from '@/app/admin/actions';
import { getPluginSettings } from '@/app/admin/settings-actions';
import { PluginUIs } from '@/plugins/registry';

export default async function PluginSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pluginJsonPath = path.join(process.cwd(), 'src/plugins', slug, 'plugin.json');

  if (!fs.existsSync(pluginJsonPath)) {
    return (
      <div className="p-8 text-center text-slate-500">
        Plugin configuration not found.
      </div>
    );
  }

  const rawJson = fs.readFileSync(pluginJsonPath, 'utf-8');
  const parsed = JSON.parse(rawJson);

  const hiddenPlugins = await getHiddenSidebarPlugins();
  const isHidden = hiddenPlugins.includes(slug);
  const hasAdminUI = !!PluginUIs[slug]?.AdminUI;

  if (!parsed.settingsSchema || parsed.settingsSchema.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>{parsed.name || slug}</CardTitle>
            <CardDescription>{parsed.description || 'Plugin Details'}</CardDescription>
          </div>
          {hasAdminUI && <SidebarVisibilityToggle slug={slug} initialHidden={isHidden} />}
        </CardHeader>
        <div className="p-12 text-center text-slate-500">
          This plugin does not have any configurable settings.
        </div>
      </Card>
    );
  }

  // Load existing settings
  const existingSettings = await getPluginSettings(slug);
  const SettingsUI = PluginUIs[slug]?.SettingsUI;

  return (
    <Card>
      <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle>{parsed.name || slug} Settings</CardTitle>
          <CardDescription>{parsed.description || 'Configure plugin parameters.'}</CardDescription>
        </div>
        {hasAdminUI && <SidebarVisibilityToggle slug={slug} initialHidden={isHidden} />}
      </CardHeader>

      {SettingsUI && (
        <div className="p-6 border-b">
          <SettingsUI />
        </div>
      )}

      {parsed.settingsSchema && parsed.settingsSchema.length > 0 && (
        <PluginSettingsForm
          slug={slug}
          schema={parsed.settingsSchema}
          initialData={existingSettings}
        />
      )}
    </Card>
  );
}
