'use client';

import { useState, useEffect } from 'react';
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getMediaSettingsAction, saveMediaSettingsAction, getStoragePluginsAction } from '@/app/admin/(dashboard)/media/actions';

export default function MediaSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({
    driver: 'local',
  });
  const [pluginOptions, setPluginOptions] = useState<{label: string, value: string}[]>([]);

  useEffect(() => {
    Promise.all([
      getMediaSettingsAction(),
      getStoragePluginsAction()
    ]).then(([data, options]) => {
      setSettings(data);
      setPluginOptions(options);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveMediaSettingsAction(settings);
      toast.success('Media settings saved successfully');
    } catch (err: any) {
      toast.error('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <Card>
      <CardHeader className="border-b bg-slate-50/50">
        <CardTitle>Media Settings</CardTitle>
        <CardDescription>Configure how files and images are stored.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 max-w-2xl">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Active Storage Driver</label>
            <select
              value={settings.driver}
              onChange={e => setSettings({ ...settings, driver: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pluginOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Select which storage adapter to use. If selecting a third-party driver, ensure its plugin is activated and configured in the Plugins section on the left.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t p-4 bg-slate-50 flex justify-end rounded-b-xl">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}
