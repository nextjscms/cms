'use client';

import { useState } from 'react';

export default function UploadThemePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload theme');
      }

      setMessage(`Success! Version ${data.version} published to GitHub Packages and listed in the Marketplace.`);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Publish to Marketplace</h1>
      <p className="text-slate-600 mb-8">
        Upload your .tar.gz file here. This will automatically publish it to GitHub Packages and list it in the NextjsCMS Marketplace.
      </p>

      {message && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-md mb-6 border border-emerald-200">
          {message}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Type</label>
          <select name="type" required className="w-full border border-slate-300 rounded-md p-2">
            <option value="theme">Theme</option>
            <option value="plugin">Plugin</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Package Tarball (.tar.gz)</label>
          <input 
            type="file" 
            name="file" 
            accept=".tgz,.tar.gz" 
            required 
            className="w-full border border-slate-300 rounded-md p-2"
          />
          <p className="text-xs text-slate-500">
            Generate this file by running <code>npm pack</code> inside your theme folder. Must be under 4MB.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Image URL (Optional Thumbnail)</label>
          <input 
            type="url" 
            name="imageUrl" 
            placeholder="https://example.com/thumbnail.png"
            className="w-full border border-slate-300 rounded-md p-2"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 transition-colors"
        >
          {loading ? 'Publishing...' : 'Publish Package'}
        </button>
      </form>
    </div>
  );
}
