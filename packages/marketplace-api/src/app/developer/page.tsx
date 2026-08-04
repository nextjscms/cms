'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function DeveloperPage() {
  const { user, login, isCheckingAuth, token } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setMessage('');
    setError('');

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload package');
      }

      setMessage(`Success! Version ${data.version} published and listed by @${user?.login}.`);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse">Loading secure environment...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col font-sans pb-24">
      <main className="max-w-2xl mx-auto w-full pt-16 px-6">
        
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Developer Portal</h1>
          <p className="text-gray-400 font-light text-lg">
            Upload your compiled <code>.tar.gz</code> to the NextjsCMS Marketplace.
          </p>
        </div>

        {!user ? (
          <div className="border border-white/[0.08] bg-white/[0.02] rounded-xl p-12 text-center shadow-[0_0_30px_rgba(255,255,255,0.02)]">
            <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
              You must be logged in with GitHub to publish themes and plugins. Your GitHub handle will be publicly listed as the author.
            </p>
            <button 
              onClick={login}
              className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded-md font-medium transition-all"
            >
              Sign in with GitHub
            </button>
          </div>
        ) : (
          <div className="border border-white/[0.08] bg-white/[0.02] rounded-xl p-8 shadow-[0_0_30px_rgba(255,255,255,0.02)]">
            
            {message && (
              <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-md mb-8 border border-emerald-500/20 text-sm">
                {message}
              </div>
            )}
            
            {error && (
              <div className="bg-red-500/10 text-red-400 p-4 rounded-md mb-8 border border-red-500/20 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Package Type</label>
                <select name="type" required className="w-full bg-black border border-white/[0.1] rounded-md p-3 text-white focus:outline-none focus:border-white/[0.3] transition-colors">
                  <option value="theme">Theme</option>
                  <option value="plugin">Plugin</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Package Tarball (.tar.gz)</label>
                <input 
                  type="file" 
                  name="file" 
                  accept=".tgz,.tar.gz" 
                  required 
                  className="w-full bg-black border border-white/[0.1] rounded-md p-2 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-white/[0.05] file:text-white hover:file:bg-white/[0.1] cursor-pointer"
                />
                <p className="text-xs text-gray-500 pt-1">
                  Run <code>npm pack</code> in your theme folder to generate this file. Max 4MB.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Thumbnail URL (Optional)</label>
                <input 
                  type="url" 
                  name="imageUrl" 
                  placeholder="https://example.com/thumbnail.png"
                  className="w-full bg-black border border-white/[0.1] rounded-md p-3 text-white placeholder-gray-600 focus:outline-none focus:border-white/[0.3] transition-colors text-sm"
                />
              </div>

              <div className="pt-4 border-t border-white/[0.08]">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-3 px-4 rounded-md disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="flex h-2 w-2 rounded-full bg-black animate-ping" />
                      Publishing...
                    </>
                  ) : (
                    'Publish to Marketplace'
                  )}
                </button>
              </div>
              
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
