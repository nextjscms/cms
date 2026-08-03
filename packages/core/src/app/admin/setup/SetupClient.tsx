'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, GitBranch, CheckCircle2 } from 'lucide-react';
import { createFirstAdmin, saveGitOpsToken } from './setup-actions';

export default function SetupClient({ 
  defaultOwner, 
  defaultRepo, 
  initialStep 
}: { 
  defaultOwner: string, 
  defaultRepo: string, 
  initialStep: number 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 2 specific states
  const [githubOwner, setGithubOwner] = useState(defaultOwner);
  const [githubRepo, setGithubRepo] = useState(defaultRepo);

  useEffect(() => {
    const token = searchParams.get('github_token');
    if (token && step === 2) {
      setLoading(true);
      // Auto-save the token if we have repo/owner
      if (githubOwner && githubRepo) {
        saveGitOpsToken(token, githubOwner, githubRepo).then(() => {
          setStep(3);
          setLoading(false);
        }).catch(e => {
          setError(e.message);
          setLoading(false);
        });
      } else {
        // If they don't have defaults, they need to fill them in before saving
        setLoading(false);
      }
    }
  }, [searchParams, step, githubOwner, githubRepo]);

  const handleCreateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    try {
      await createFirstAdmin(formData);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGithub = () => {
    if (!githubOwner || !githubRepo) {
      setError('Please enter your GitHub username/org and repository name');
      return;
    }
    const returnUrl = window.location.origin + '/admin/setup';
    const proxyUrl = process.env.NEXT_PUBLIC_MARKETPLACE_API_URL || 'https://nextjscms-api.vercel.app';
    window.location.href = `${proxyUrl}/api/auth/github/authorize?return_url=${encodeURIComponent(returnUrl)}`;
  };

  const handleSaveGithubSettings = async () => {
    const token = searchParams.get('github_token');
    if (!token) return;
    
    setLoading(true);
    setError('');
    try {
      await saveGitOpsToken(token, githubOwner, githubRepo);
      setStep(3);
    } catch(e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-0 overflow-hidden pt-0 shadow-lg">
        <CardHeader className="space-y-3 text-center pt-8 pb-6 bg-slate-900 text-white rounded-t-xl">
          <div className="mx-auto bg-slate-800 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-2">
            <Settings className="w-7 h-7 text-emerald-400" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">NextjsCMS Setup</CardTitle>
          <CardDescription className="text-slate-300">
            {step === 1 && 'Step 1 of 2: Create Admin Account'}
            {step === 2 && 'Step 2 of 2: Configure Auto-Installer'}
            {step === 3 && 'Setup Complete!'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-8 pb-6 px-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium text-center">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleCreateAdmin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" required className="h-11" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" required className="h-11" placeholder="admin@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required className="h-11" />
              </div>
              <Button type="submit" className="w-full h-11 text-base mt-2" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create Account
              </Button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-lg text-sm">
                <strong>Almost done!</strong> To install themes and plugins, NextjsCMS needs to link to your GitHub repository to securely push code updates.
              </div>
              
              <div className="space-y-4">
                {defaultOwner && defaultRepo ? (
                  <div className="bg-slate-50 border border-slate-200 text-slate-800 p-4 rounded-lg text-sm">
                    <strong>Vercel Detected:</strong> We've automatically linked your setup to the GitHub repository <strong>{defaultOwner}/{defaultRepo}</strong>.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>GitHub Owner / Org</Label>
                      <Input 
                        value={githubOwner} 
                        onChange={e => setGithubOwner(e.target.value)} 
                        placeholder="e.g. your-username" 
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Repository Name</Label>
                      <Input 
                        value={githubRepo} 
                        onChange={e => setGithubRepo(e.target.value)} 
                        placeholder="e.g. nextjscms-site" 
                        required
                      />
                    </div>
                  </div>
                )}

                {searchParams.get('github_token') ? (
                  <Button onClick={handleSaveGithubSettings} className="w-full h-11 bg-green-600 hover:bg-green-700" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Save Configuration
                  </Button>
                ) : (
                  <Button onClick={handleConnectGithub} className="w-full h-11 bg-slate-900 hover:bg-slate-800" disabled={loading}>
                    <GitBranch className="w-4 h-4 mr-2" /> Connect to GitHub
                  </Button>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6 py-4">
              <div className="mx-auto bg-green-100 p-4 rounded-full w-20 h-20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">You're all set!</h3>
                <p className="text-slate-500">Your CMS is configured and ready to use.</p>
              </div>
              <Button onClick={() => router.push('/admin/login')} className="w-full h-11 text-base">
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
