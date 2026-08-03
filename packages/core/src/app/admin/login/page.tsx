'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Lock } from 'lucide-react';
import { hasExistingUsers } from '@/app/admin/setup/setup-actions';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    hasExistingUsers().then(exists => {
      if (!exists) router.replace('/admin/setup');
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/admin');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 overflow-hidden pt-0">
        <CardHeader className="space-y-3 text-center pt-8 pb-6 bg-slate-900 text-white rounded-t-xl">
          <div className="mx-auto bg-slate-800 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-2">
            <Lock className="w-7 h-7 text-emerald-400" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">NextjsCMS Admin</CardTitle>
          <CardDescription className="text-slate-300">Sign in to manage your site</CardDescription>
        </CardHeader>
        <CardContent className="pt-8 pb-6 px-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address or Username</Label>
              <Input
                id="email"
                name="email"
                type="text"
                placeholder="admin@example.com or admin"
                required
                autoCapitalize="none"
                autoCorrect="off"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="h-11"
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium text-center">
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Authenticating...</>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-neutral-100 py-6 bg-neutral-50/50 rounded-b-xl">
          <p className="text-sm text-neutral-500">
            &larr; <a href="/" className="hover:text-neutral-900 transition-colors">Return to live site</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
