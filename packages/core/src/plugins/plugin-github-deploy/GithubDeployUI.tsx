'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { savePluginSettings, getPluginSettings } from '@/app/admin/settings-actions';

export default function GithubDeployUI() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Loading...');

  useEffect(() => {
    // Check if we just returned from OAuth proxy
    const incomingToken = searchParams.get('github_token');
    
    if (incomingToken) {
      setStatus('Saving token...');
      // Save it
      getPluginSettings('plugin-github-deploy').then(existingSettings => {
        savePluginSettings('plugin-github-deploy', {
          ...existingSettings,
          githubToken: incomingToken
        }).then(() => {
          setToken(incomingToken);
          setStatus('Connected successfully!');
          // Remove token from URL
          router.replace('/admin/settings/plugins/plugin-github-deploy');
        });
      });
    } else {
      // Load existing
      getPluginSettings('plugin-github-deploy').then(settings => {
        if (settings.githubToken) {
          setToken(settings.githubToken);
          setStatus('Connected');
        } else {
          setStatus('Not connected');
        }
      });
    }
  }, [searchParams, router]);

  const handleConnect = () => {
    const returnUrl = window.location.origin + '/admin/settings/plugins/plugin-github-deploy';
    // Use marketplace API as proxy
    const proxyUrl = process.env.NEXT_PUBLIC_MARKETPLACE_API_URL || 'https://nextjscms-api.vercel.app';
    window.location.href = `${proxyUrl}/api/auth/github/authorize?return_url=${encodeURIComponent(returnUrl)}`;
  };

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg">
      <h3 className="text-lg font-semibold text-slate-900 mb-2">GitHub OAuth Connection</h3>
      <p className="text-sm text-slate-600 mb-4">
        {status === 'Connected' || status === 'Connected successfully!' ? 
          'Your account is successfully connected to GitHub. Plugin actions will be committed to your repository.' : 
          'Connect your GitHub account to enable GitOps deployments for plugins.'}
      </p>
      
      {token ? (
        <button disabled className="px-4 py-2 bg-green-500 text-white font-medium rounded-md opacity-80 cursor-not-allowed">
          Connected to GitHub
        </button>
      ) : (
        <button 
          onClick={handleConnect}
          className="px-4 py-2 bg-slate-900 text-white font-medium rounded-md hover:bg-slate-800 transition"
        >
          Connect to GitHub
        </button>
      )}
    </div>
  );
}
