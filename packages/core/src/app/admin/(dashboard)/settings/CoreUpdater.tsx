'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { updateCore } from '@/app/admin/actions';

interface CoreUpdaterProps {
  currentVersion: string;
}

export default function CoreUpdater({ currentVersion }: CoreUpdaterProps) {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_MARKETPLACE_API_URL || 'https://nextjscms-api.vercel.app';
        const res = await fetch(`${apiUrl}/api/core/version`);
        if (res.ok) {
          const data = await res.json();
          setLatestVersion(data.version);
          setDownloadUrl(data.url);
        }
      } catch (err) {
        console.error("Failed to check for core updates", err);
      } finally {
        setLoading(false);
      }
    };
    checkUpdate();
  }, []);

  const handleUpdate = () => {
    if (!latestVersion || !downloadUrl) return;

    toast('Are you sure you want to update the CMS Core?', {
      description: 'This will overwrite core files. Your themes and plugins will remain intact, but if you modified core files directly, your changes will be lost.',
      action: {
        label: 'Update Now',
        onClick: () => {
          startTransition(async () => {
            try {
              toast.info('Downloading and applying update...');
              await updateCore(downloadUrl, latestVersion);
              toast.success(`Successfully updated to v${latestVersion}! Remember to Publish Changes to apply it to Vercel.`);
            } catch (err: any) {
              toast.error(`Update failed: ${err.message}`);
            }
          });
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {}
      },
      duration: 10000,
    });
  };

  const isUpdateAvailable = latestVersion && isVersionGreater(latestVersion, currentVersion);

  function isVersionGreater(v1: string, v2: string) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return true;
      if (p1 < p2) return false;
    }
    return false;
  }

  return (
    <Card className={isUpdateAvailable ? 'border-amber-200' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isUpdateAvailable ? <AlertTriangle className="w-5 h-5 text-amber-500" /> : <ShieldCheck className="w-5 h-5 text-green-500" />}
          System Update
        </CardTitle>
        <CardDescription>
          Keep NextjsCMS up to date to get the latest features and security patches.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 font-medium">Current Version</span>
          <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">v{currentVersion}</span>
        </div>
        
        {loading ? (
          <div className="flex items-center text-sm text-slate-500">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking for updates...
          </div>
        ) : latestVersion ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 font-medium">Latest Version</span>
            <span className={`font-mono px-2 py-1 rounded ${isUpdateAvailable ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-slate-100 text-slate-700'}`}>
              v{latestVersion}
            </span>
          </div>
        ) : (
          <div className="text-sm text-red-500">Could not check for updates.</div>
        )}

      </CardContent>
      <CardFooter>
        <Button 
          disabled={!isUpdateAvailable || isPending} 
          onClick={handleUpdate}
          className={isUpdateAvailable ? 'bg-amber-500 hover:bg-amber-600 text-white w-full' : 'w-full'}
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
          ) : isUpdateAvailable ? (
            <><Download className="w-4 h-4 mr-2" /> Update to v{latestVersion}</>
          ) : (
            'Up to date'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
