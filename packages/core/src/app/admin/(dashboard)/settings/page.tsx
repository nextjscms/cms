import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AutoInstallerSettings from './AutoInstallerSettings';
import { getGitOpsSettings } from '@/lib/gitops';

export default async function SettingsPage() {
  const gitOpsSettings = await getGitOpsSettings();
  const hasToken = !!(gitOpsSettings && gitOpsSettings.githubToken);
  
  // Default from env if missing
  const initialOwner = gitOpsSettings?.githubOwner || process.env.VERCEL_GIT_REPO_OWNER || '';
  const initialRepo = gitOpsSettings?.githubRepo || process.env.VERCEL_GIT_REPO_SLUG || '';
  const initialRootDir = gitOpsSettings?.rootDir !== undefined ? gitOpsSettings.rootDir : 'packages/core';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your site configuration.</p>
      </div>

      <AutoInstallerSettings 
        initialOwner={initialOwner} 
        initialRepo={initialRepo} 
        initialRootDir={initialRootDir}
        hasToken={hasToken} 
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Basic settings for your website.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site-title">Site Title</Label>
              <Input id="site-title" defaultValue="NextjsCMS" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-description">Tagline</Label>
              <Input id="site-description" defaultValue="Just another CMS site" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Administration Email Address</Label>
              <Input id="admin-email" type="email" defaultValue="admin@example.com" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reading Settings</CardTitle>
            <CardDescription>Configure how content is displayed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="posts-per-page">Blog pages show at most</Label>
              <Input id="posts-per-page" type="number" defaultValue="10" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
