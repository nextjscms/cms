'use client';

import { useState } from 'react';
import { toggleSidebarVisibility } from '@/app/admin/actions';
import { Loader2, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

export default function SidebarVisibilityToggle({
  slug,
  initialHidden,
}: {
  slug: string;
  initialHidden: boolean;
}) {
  const [isHidden, setIsHidden] = useState(initialHidden);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      await toggleSidebarVisibility(slug, !checked);
      setIsHidden(!checked);
      toast.success(checked ? 'Plugin added to sidebar!' : 'Plugin hidden from sidebar.');
    } catch (err: any) {
      toast.error('Failed to update visibility: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm text-slate-500 font-medium">Show in Sidebar</span>
      {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      <Switch
        disabled={loading}
        checked={!isHidden}
        onCheckedChange={(checked) => handleToggle(checked)}
      />
    </div>
  );
}
