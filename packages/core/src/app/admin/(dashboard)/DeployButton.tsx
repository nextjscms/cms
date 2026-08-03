'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Rocket, Loader2, List, Info } from 'lucide-react';
import { toast } from 'sonner';
import { triggerVercelBuild } from '@/app/admin/actions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function DeployButton({ gitOpsEnabled, pendingDeployments = [] }: { gitOpsEnabled: boolean; pendingDeployments?: { message: string; timestamp: string }[] }) {
  const [isPending, startTransition] = useTransition();

  if (!gitOpsEnabled) {
    return null;
  }

  const handleDeploy = () => {
    startTransition(async () => {
      try {
        await triggerVercelBuild();
        toast.success('Deployment triggered successfully! Vercel is now building your site.');
      } catch (err: any) {
        toast.error(`Failed to trigger deployment: ${err.message}`);
      }
    });
  };

  const hasPending = pendingDeployments.length > 0;

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
        disabled={isPending}
        variant="outline"
        size="sm"
        className={`gap-2 ${hasPending ? 'border-amber-400 text-amber-700 hover:bg-amber-50 bg-amber-50' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}`}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
        Publish {hasPending ? `(${pendingDeployments.length})` : 'Changes'}
      </Button>
    </div>
  );
}
