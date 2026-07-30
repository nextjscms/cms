'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { testDatabaseConnection, saveSetupConfig, runSetupMigrations, seedSetupAdmin, finalizeSetup } from './actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { Database, Link as LinkIcon, Loader2, CheckCircle2, Circle } from 'lucide-react';

function SetupWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialStep = searchParams.get('step') === '2' ? 2 : 1;
  const initialDbUrl = searchParams.get('dbUrl') || '';
  
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbUrl, setDbUrl] = useState(initialDbUrl);
  const [installProgress, setInstallProgress] = useState<'idle' | 'saving' | 'migrating' | 'seeding' | 'done'>('idle');
  
  const [selectedProvider, setSelectedProvider] = useState<'neon' | 'supabase' | 'vercel' | 'manual' | null>(null);

  async function handleTestDb(e?: React.FormEvent<HTMLFormElement>, overrideUrl?: string) {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    
    let url = overrideUrl;
    if (!url && e) {
      const formData = new FormData(e.currentTarget);
      url = formData.get('databaseUrl') as string;
    }
    
    if (!url) {
      setError('Please provide a connection string.');
      setLoading(false);
      return;
    }
    
    const result = await testDatabaseConnection(url);
    
    if (result.success) {
      setDbUrl(url);
      setStep(2);
      window.history.pushState(null, '', `?step=2&dbUrl=${encodeURIComponent(url)}`);
    } else {
      setError(result.error || 'Failed to connect to the database.');
    }
    setLoading(false);
  }

  const handleOAuth = (provider: string) => {
    if (provider === 'neon') {
      window.location.href = '/api/oauth/neon/authorize';
    } else {
      // Mock for others until implemented
      setLoading(true);
      setError(null);
      setTimeout(async () => {
        const mockUrl = `postgresql://mockuser:mockpass@ep-mock-${provider}.mock.tech/neondb?sslmode=require`;
        await handleTestDb(undefined, mockUrl);
      }, 2000);
    }
  };

  const handleBack = () => {
    setStep(1);
    setDbUrl('');
    window.history.pushState(null, '', '?step=1');
  };

  async function handleComplete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInstallProgress('saving');
    
    const formData = new FormData(e.currentTarget);
    const url = formData.get('databaseUrl') as string;
    
    // Step 1: Save Configuration
    const saveRes = await saveSetupConfig(url);
    if (!saveRes.success) {
      setError(saveRes.error || 'Failed to save config.');
      setInstallProgress('idle');
      setLoading(false);
      return;
    }
    const authSecret = saveRes.authSecret as string;

    // Step 2: Run Database Migrations
    setInstallProgress('migrating');
    const migRes = await runSetupMigrations(url);
    if (!migRes.success) {
      setError(migRes.error || 'Failed to run database migrations.');
      setInstallProgress('idle');
      setLoading(false);
      return;
    }

    // Step 3: Seed Admin User
    setInstallProgress('seeding');
    const seedRes = await seedSetupAdmin(url, formData);
    if (!seedRes.success) {
      setError(seedRes.error || 'Failed to seed admin user.');
      setInstallProgress('idle');
      setLoading(false);
      return;
    }

    // Done! Write to .env.local (which might restart the server and kill this request)
    setInstallProgress('done');
    try {
      await finalizeSetup(url, authSecret);
    } catch (e) {
      // Ignore network errors caused by dev server restart
    }
    
    setTimeout(() => {
      window.location.href = '/admin';
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">NextjsCMS</h1>
          <p className="text-neutral-500 mt-2">The 5-minute installation</p>
        </div>

        {step === 1 && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Select Database Provider</CardTitle>
              <CardDescription>
                NextjsCMS is provider-agnostic. Choose your preferred serverless Postgres provider to begin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Neon Option */}
                <div 
                  onClick={() => setSelectedProvider('neon')}
                  className={`border rounded-lg p-4 cursor-pointer hover:border-slate-800 transition-colors ${selectedProvider === 'neon' ? 'border-slate-800 bg-slate-50' : 'border-neutral-200 bg-white'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Database className="w-6 h-6 text-emerald-500" />
                    <span className="font-semibold text-lg">Neon</span>
                  </div>
                  <p className="text-sm text-neutral-500">Fully managed serverless Postgres with branching.</p>
                </div>

                {/* Supabase Option */}
                <div 
                  onClick={() => setSelectedProvider('supabase')}
                  className={`border rounded-lg p-4 cursor-pointer hover:border-slate-800 transition-colors ${selectedProvider === 'supabase' ? 'border-slate-800 bg-slate-50' : 'border-neutral-200 bg-white'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Database className="w-6 h-6 text-green-500" />
                    <span className="font-semibold text-lg">Supabase</span>
                  </div>
                  <p className="text-sm text-neutral-500">Open source Firebase alternative with Postgres.</p>
                </div>
                
                {/* Vercel Option */}
                <div 
                  onClick={() => setSelectedProvider('vercel')}
                  className={`border rounded-lg p-4 cursor-pointer hover:border-slate-800 transition-colors ${selectedProvider === 'vercel' ? 'border-slate-800 bg-slate-50' : 'border-neutral-200 bg-white'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-white font-bold text-xs">V</div>
                    <span className="font-semibold text-lg">Vercel Postgres</span>
                  </div>
                  <p className="text-sm text-neutral-500">Native serverless Postgres integrated with Vercel.</p>
                </div>

                {/* Manual Option */}
                <div 
                  onClick={() => setSelectedProvider('manual')}
                  className={`border rounded-lg p-4 cursor-pointer hover:border-slate-800 transition-colors ${selectedProvider === 'manual' ? 'border-slate-800 bg-slate-50' : 'border-neutral-200 bg-white'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <LinkIcon className="w-6 h-6 text-neutral-500" />
                    <span className="font-semibold text-lg">Manual Connection</span>
                  </div>
                  <p className="text-sm text-neutral-500">Paste an existing Postgres connection string.</p>
                </div>

              </div>
              
              {/* Contextual Action Area based on Selection */}
              {selectedProvider && selectedProvider !== 'manual' && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex flex-col items-center text-center space-y-4">
                  <p className="text-sm text-blue-800">
                    Connect your {selectedProvider === 'neon' ? 'Neon' : selectedProvider === 'supabase' ? 'Supabase' : 'Vercel'} account to automatically provision a database.
                  </p>
                  <Button 
                    onClick={() => handleOAuth(selectedProvider)} 
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LinkIcon className="w-4 h-4 mr-2" />}
                    {loading ? 'Authorizing & Connecting...' : `Connect to ${selectedProvider === 'neon' ? 'Neon' : selectedProvider === 'supabase' ? 'Supabase' : 'Vercel Postgres'}`}
                  </Button>
                </div>
              )}

              {selectedProvider === 'manual' && (
                <form onSubmit={handleTestDb} className="pt-4 border-t border-neutral-100">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="databaseUrl">Connection String</Label>
                      <Input 
                        id="databaseUrl" 
                        name="databaseUrl" 
                        placeholder="postgresql://user:pass@localhost:5432/mydb" 
                        required 
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {loading ? 'Testing Connection...' : 'Connect to Database'}
                    </Button>
                  </div>
                </form>
              )}

              {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
            </CardContent>
          </Card>
        )}

        {step === 2 && installProgress === 'idle' && (
          <form onSubmit={handleComplete} className="w-full">
            <input type="hidden" name="databaseUrl" value={dbUrl} />
            <Card className="w-full">
              
              <CardHeader>
                <CardTitle>Site & Admin Details</CardTitle>
                <CardDescription>
                  Create your super admin account and name your new site.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input id="siteName" name="siteName" placeholder="My Awesome Blog" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Admin Email</Label>
                  <Input id="email" name="email" type="email" placeholder="admin@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Admin Password</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {loading ? 'Installing...' : 'Install NextjsCMS'}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={handleBack} disabled={loading}>
                  Back to Database Setup
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}

        {step === 2 && installProgress !== 'idle' && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Installing NextjsCMS</CardTitle>
              <CardDescription>Please wait while we set up your environment...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="flex items-center gap-4">
                {installProgress === 'saving' ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-green-500" />}
                <span className={installProgress === 'saving' ? 'text-neutral-900 font-medium' : 'text-neutral-500'}>Saving configuration...</span>
              </div>
              <div className="flex items-center gap-4">
                {installProgress === 'saving' ? <Circle className="w-5 h-5 text-neutral-300" /> : installProgress === 'migrating' ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-green-500" />}
                <span className={installProgress === 'migrating' ? 'text-neutral-900 font-medium' : 'text-neutral-500'}>Building database tables...</span>
              </div>
              <div className="flex items-center gap-4">
                {installProgress === 'seeding' ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" /> : installProgress === 'done' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-neutral-300" />}
                <span className={installProgress === 'seeding' ? 'text-neutral-900 font-medium' : 'text-neutral-500'}>Creating admin user...</span>
              </div>
              <div className="flex items-center gap-4">
                {installProgress === 'done' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-neutral-300" />}
                <span className={installProgress === 'done' ? 'text-neutral-900 font-medium' : 'text-neutral-500'}>Finishing up!</span>
              </div>
              
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">
                  <p className="mb-3">{error}</p>
                  <Button variant="outline" className="w-full bg-white hover:bg-red-50" onClick={() => setInstallProgress('idle')}>
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">Loading Setup Wizard...</div>}>
      <SetupWizard />
    </Suspense>
  );
}
