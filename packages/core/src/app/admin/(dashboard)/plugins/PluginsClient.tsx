'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, CheckCircle, ExternalLink, Loader2, Package, Puzzle, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { installPlugin, togglePlugin } from '@/app/admin/actions';

type PluginInfo = {
  slug: string;
  name: string;
  version?: string;
  author?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
};

type MarketplacePlugin = {
  id: number;
  name: string;
  slug: string;
  description: string;
  version?: string;
  author?: string;
  category?: string;
  imageUrl?: string;
  totalDownloads?: number;
  url: string;
  updatedAt: string;
};

interface PluginsClientProps {
  localPlugins: PluginInfo[];
  activePluginSlugs: string[];
}

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

export default function PluginsClient({ localPlugins, activePluginSlugs }: PluginsClientProps) {
  const [marketplacePlugins, setMarketplacePlugins] = useState<MarketplacePlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [error, setError] = useState('');

  const [isPending, startTransition] = useTransition();
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);

  const handleInstall = (slug: string, url: string, version?: string) => {
    setInstallingSlug(slug);
    startTransition(async () => {
      try {
        await installPlugin(slug, url, version);
        toast.success(`Plugin installed successfully!`);
      } catch (err: any) {
        toast.error(`Failed to install plugin: ${err.message}`);
      } finally {
        setInstallingSlug(null);
      }
    });
  };

  const handleToggle = (slug: string, activate: boolean) => {
    startTransition(async () => {
      try {
        await togglePlugin(slug, activate);
        toast.success(activate ? 'Plugin activated' : 'Plugin deactivated');
      } catch (err: any) {
        toast.error(`Failed to toggle plugin: ${err.message}`);
      }
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchPlugins = async () => {
      setLoading(true);
      setError('');
      try {
        const apiUrl = process.env.NEXT_PUBLIC_MARKETPLACE_API_URL || 'https://nextjscms-api.vercel.app';
        const url = `${apiUrl}/api/plugins${debouncedQuery ? `?q=${encodeURIComponent(debouncedQuery)}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch marketplace plugins');
        const data = await res.json();
        setMarketplacePlugins(data.plugins || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlugins();
  }, [debouncedQuery]);

  // Filter marketplace plugins: remove ones that are already installed locally
  const filteredMarketplace = marketplacePlugins.filter(mp => {
    return !localPlugins.some(lp => lp.slug === mp.slug);
  });

  // Sort local plugins so active ones are first
  const sortedLocalPlugins = [...localPlugins].sort((a, b) => {
    const aActive = activePluginSlugs.includes(a.slug);
    const bActive = activePluginSlugs.includes(b.slug);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Plugins</h1>
          <p className="text-slate-500 mt-1">Extend the functionality of your CMS.</p>
        </div>
        <div className="relative w-full md:w-72">
          {loading ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          )}
          <Input
            placeholder="Search plugins..."
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium border border-red-100 mb-6">
          {error}
        </div>
      )}

      {localPlugins.length === 0 && filteredMarketplace.length === 0 && !loading && !error ? (
        <div className="bg-slate-50 text-slate-500 p-8 rounded-lg text-center border border-slate-100">
          <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="font-medium text-slate-900">No plugins found</h3>
          <p className="text-sm mt-1">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="relative border border-slate-200 rounded-xl p-6 bg-white min-h-[400px] flex-1">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 rounded-xl transition-all duration-200">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500 mb-2" />
              <span className="text-sm font-medium text-slate-600">Searching marketplace...</span>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Render Local Plugins First */}
            {sortedLocalPlugins.map(plugin => {
              const isActive = activePluginSlugs.includes(plugin.slug);

              // Check for updates
              const remoteCounterpart = marketplacePlugins.find(mp => mp.slug === plugin.slug);
              const hasUpdate = remoteCounterpart && remoteCounterpart.version && plugin.version && isVersionGreater(remoteCounterpart.version, plugin.version);

              return (
                <Card key={plugin.slug} size="sm" className={`pt-0 h-full overflow-hidden transition-all border-transparent ${isActive ? 'shadow-lg shadow-blue-500/20' : 'hover:shadow-md'}`}>
                  <div className="h-32 shrink-0 bg-slate-50 flex items-center justify-center border-b border-slate-100 overflow-hidden relative">
                    {plugin.imageUrl ? (
                      <img src={plugin.imageUrl} alt={plugin.name} className="object-cover w-full h-full" />
                    ) : (
                      <Puzzle className={`w-12 h-12 ${isActive ? 'text-blue-300' : 'text-slate-300'}`} />
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{plugin.name}</CardTitle>
                      {isActive && (
                        <span className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      )}
                    </div>
                    <CardDescription>
                      {hasUpdate ? (
                        <div className="flex flex-col gap-1 text-sm">
                          <span className="font-medium text-amber-600">Update Available!</span>
                          <span className="text-slate-500">Installed: v{plugin.version} &rarr; Latest: v{remoteCounterpart!.version}</span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <div>
                            {plugin.version && <span className="font-medium text-slate-700">v{plugin.version}</span>}
                            {plugin.author && ` by ${plugin.author}`}
                          </div>
                          {plugin.category && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                              {plugin.category}
                            </span>
                          )}
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-slate-600 line-clamp-2 min-h-[2.5rem]" title={plugin.description}>
                      {plugin.description}
                    </p>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    {isActive ? (
                      <Button onClick={() => handleToggle(plugin.slug, false)} variant="outline" className="w-full text-slate-700 hover:text-red-700 hover:bg-red-50 hover:border-red-200">
                        Deactivate
                      </Button>
                    ) : (
                      <Button onClick={() => handleToggle(plugin.slug, true)} className="w-full bg-slate-900 hover:bg-slate-800">
                        Activate Plugin
                      </Button>
                    )}

                    {hasUpdate && remoteCounterpart?.url && (
                      <Button
                        variant="outline"
                        className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                        disabled={installingSlug === plugin.slug}
                        onClick={() => handleInstall(plugin.slug, remoteCounterpart.url, remoteCounterpart.version)}
                      >
                        {installingSlug === plugin.slug ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
                        ) : (
                          <><Download className="w-4 h-4 mr-2" /> Update</>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}

            {/* Render Marketplace Plugins */}
            {filteredMarketplace.map(plugin => {
              return (
                <Card key={plugin.id} size="sm" className="pt-0 h-full overflow-hidden transition-all border-transparent hover:shadow-md">
                  <div className="h-32 shrink-0 bg-slate-900 flex items-center justify-center border-b border-slate-800 overflow-hidden relative">
                    {plugin.imageUrl ? (
                      <img src={plugin.imageUrl} alt={plugin.name} className="object-cover w-full h-full" />
                    ) : (
                      <Package className="w-12 h-12 text-slate-700" />
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="truncate" title={plugin.name}>{plugin.name}</CardTitle>
                    </div>
                    <CardDescription className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <div>
                          {plugin.version && <span className="font-medium text-slate-700">v{plugin.version}</span>}
                          {plugin.author && ` by ${plugin.author}`}
                        </div>
                        {plugin.category && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                            {plugin.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1" title="Total Downloads">
                          <Download className="w-3 h-3" />
                          {plugin.totalDownloads || 0}
                        </span>
                        <span className="flex items-center gap-1" title="Last Updated">
                          <Clock className="w-3 h-3" />
                          {new Date(plugin.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-slate-600 line-clamp-2 min-h-[2.5rem]" title={plugin.description}>
                      {plugin.description || 'No description provided.'}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={installingSlug === plugin.slug}
                      onClick={() => handleInstall(plugin.slug, plugin.url, plugin.version)}
                    >
                      {installingSlug === plugin.slug ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Installing...</>
                      ) : (
                        <><Download className="w-4 h-4 mr-2" /> Install Plugin</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
