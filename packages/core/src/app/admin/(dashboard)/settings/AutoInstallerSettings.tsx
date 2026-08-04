'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, GitBranch, CheckCircle2 } from 'lucide-react';
import { saveGitOpsToken } from '@/app/admin/setup/setup-actions';
import { useSearchParams } from 'next/navigation';

export default function AutoInstallerSettings({ initialOwner, initialRepo, initialRootDir, hasToken }: { initialOwner: string, initialRepo: string, initialRootDir: string, hasToken: boolean }) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [githubOwner, setGithubOwner] = useState(initialOwner);
  const [githubRepo, setGithubRepo] = useState(initialRepo);
  const [rootDir, setRootDir] = useState(initialRootDir);

  useEffect(() => {
    const token = searchParams.get('github_token');
    if (token) {
      setLoading(true);
      const savedOwner = sessionStorage.getItem('nextjscms_github_owner') || githubOwner;
      const savedRepo = sessionStorage.getItem('nextjscms_github_repo') || githubRepo;
      const savedRootDir = sessionStorage.getItem('nextjscms_github_rootdir') || rootDir;
      
      saveGitOpsToken(token, savedOwner, savedRepo, savedRootDir).then(() => {
        setSuccess('Successfully re-connected to GitHub!');
        setLoading(false);
        setGithubOwner(savedOwner);
        setGithubRepo(savedRepo);
        setRootDir(savedRootDir);
        sessionStorage.removeItem('nextjscms_github_owner');
        sessionStorage.removeItem('nextjscms_github_repo');
        sessionStorage.removeItem('nextjscms_github_rootdir');
        // Clear url bar
        window.history.replaceState(null, '', '/admin/settings');
      }).catch(e => {
        setError(e.message);
        setLoading(false);
      });
    }
  }, [searchParams, githubOwner, githubRepo]);

  const handleConnectGithub = () => {
    if (!githubOwner || !githubRepo) {
      setError('Please enter your GitHub username/org and repository name');
      return;
    }
    // Save to sessionStorage so we don't lose them after the OAuth redirect
    sessionStorage.setItem('nextjscms_github_owner', githubOwner);
    sessionStorage.setItem('nextjscms_github_repo', githubRepo);
    sessionStorage.setItem('nextjscms_github_rootdir', rootDir);

    const returnUrl = window.location.origin + '/admin/settings';
    const proxyUrl = process.env.NEXT_PUBLIC_MARKETPLACE_API_URL || 'https://nextjscms-api.vercel.app';
    window.location.href = `${proxyUrl}/api/auth/github/authorize?return_url=${encodeURIComponent(returnUrl)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-Installer (GitOps)</CardTitle>
        <CardDescription>
          {hasToken ? 'Connected to GitHub.' : 'Connect to GitHub to enable 1-click plugin and theme installations.'}
          <div className="mt-2 text-xs text-slate-500">
            Note: You must <a href="https://github.com/apps/nextjscms-auto-pilot/installations/new" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">install the NextjsCMS Auto-Pilot App</a> on your repository before connecting.
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && <div className="text-green-500 text-sm">{success}</div>}
        
        {githubOwner && githubRepo ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-900">Linked Repository</p>
              <a 
                href={`https://github.com/${githubOwner}/${githubRepo}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                github.com/{githubOwner}/{githubRepo}
              </a>
            </div>
            {hasToken && (
              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                Active
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>GitHub Owner / Org</Label>
              <Input 
                value={githubOwner} 
                onChange={e => setGithubOwner(e.target.value)} 
                placeholder="e.g. your-username" 
              />
            </div>
            <div className="space-y-2">
              <Label>Repository Name</Label>
              <Input 
                value={githubRepo} 
                onChange={e => setGithubRepo(e.target.value)} 
                placeholder="e.g. nextjscms-site" 
              />
            </div>
          </div>
          <div className="pt-2">
            <div className="space-y-2 max-w-[50%]">
              <Label>Subdirectory (Optional)</Label>
              <Input 
                value={rootDir} 
                onChange={e => setRootDir(e.target.value)} 
                placeholder="e.g. packages/core (if using a monorepo)" 
              />
              <p className="text-xs text-slate-500">Leave empty if the CMS is at the root of the repository.</p>
            </div>
          </div>
        </>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleConnectGithub} className={hasToken ? "bg-green-600 hover:bg-green-700 text-white" : "bg-slate-900 hover:bg-slate-800"} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (hasToken ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <GitBranch className="w-4 h-4 mr-2" />)}
          {hasToken ? 'Connected to GitHub' : 'Connect to GitHub'}
        </Button>
      </CardFooter>
    </Card>
  );
}
