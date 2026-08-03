import { notFound } from 'next/navigation';
import { PluginUIs } from '@/plugins/registry';

export default async function CustomPluginPage({ params }: { params: Promise<{ plugin: string }> }) {
  const { plugin } = await params;
  const PluginModule = PluginUIs[plugin];
  const PluginUI = PluginModule?.AdminUI;

  if (!PluginUI) {
    return (
      <div className="p-12 text-center">
        <h1 className="text-2xl font-semibold mb-2">No UI Found</h1>
        <p className="text-slate-500">
          The plugin <strong>{plugin}</strong> does not provide a custom Admin UI.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 min-h-[500px]">
      <PluginUI />
    </div>
  );
}
