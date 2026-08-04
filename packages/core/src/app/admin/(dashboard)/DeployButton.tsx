'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Rocket, Loader2, List, Info, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { triggerVercelBuild, getLatestDeploymentStatus } from '@/app/admin/actions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function DeployButton({ gitOpsEnabled, pendingDeployments = [] }: { gitOpsEnabled: boolean; pendingDeployments?: { message: string; timestamp: string }[] }) {
  const [isPending, startTransition] = useTransition();
  const [deployStatus, setDeployStatus] = useState<any>(null);

  useEffect(() => {
    if (!gitOpsEnabled) return;
    
    const checkStatus = async () => {
      try {
        const status = await getLatestDeploymentStatus();
        setDeployStatus(status);
      } catch (e) {}
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [gitOpsEnabled]);

  if (!gitOpsEnabled) {
    return null;
  }

  const handleDeploy = () => {
    startTransition(async () => {
      try {
        await triggerVercelBuild();
        toast.success('Deployment triggered successfully! Vercel is now building your site.');
        setTimeout(async () => {
          const status = await getLatestDeploymentStatus();
          if (status) setDeployStatus(status);
        }, 2000);
      } catch (err: any) {
        toast.error(`Failed to trigger deployment: ${err.message}`);
      }
    });
  };

  const hasPending = pendingDeployments.length > 0;
  const isBuilding = deployStatus?.state === 'in_progress' || deployStatus?.state === 'queued' || deployStatus?.state === 'pending';

  return (
    <div className="flex items-center gap-2">
      {hasPending && (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="relative text-amber-600 hover:bg-amber-50 hover:text-amber-700" />}>
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
              {pendingDeployments.length}
            </span>
            <Info className="w-4 h-4 mr-2" />
            Pending
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Unpublished Changes</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {pendingDeployments.map((deployment, idx) => (
              <DropdownMenuItem key={idx} className="flex flex-col items-start gap-1 p-3 cursor-default">
                <span className="text-sm font-medium">{deployment.message}</span>
                <span className="text-xs text-neutral-400">
                  {new Date(deployment.timestamp).toLocaleString()}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Button 
        onClick={handleDeploy} 
        disabled={isPending || isBuilding}
        variant="outline"
        size="sm"
        className={`gap-2 ${isBuilding ? 'border-indigo-400 text-indigo-700 hover:bg-indigo-50 bg-indigo-50' : hasPending ? 'border-amber-400 text-amber-700 hover:bg-amber-50 bg-amber-50' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}`}
      >
        {isPending || isBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
        {isBuilding ? 'Vercel Building...' : 'Publish ' + (hasPending ? `(${pendingDeployments.length})` : 'Changes')}
      </Button>
    </div>
  );
}
