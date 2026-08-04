import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Publishing Packages | NextjsCMS Docs',
  description: 'Learn how to package and publish your NextjsCMS extensions.',
};

export default function PublishingDocs() {
  return (
    <>
      <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white">Publishing</h1>
      <p className="text-xl text-gray-400 mb-8 font-light">
        Once you've built your theme or plugin, you need to package it into a standard NPM tarball and upload it to the Marketplace.
      </p>

      <hr className="border-white/[0.08] my-8" />

      <h2 className="text-2xl font-bold mt-12 mb-4 text-white">1. Packaging your code</h2>
      <p>
        NextjsCMS uses standard NPM packaging to distribute code. You do not need to publish to the public npm registry; we handle the distribution for you.
      </p>
      <p>
        When you are ready to publish, navigate to your package directory in the terminal and run:
      </p>

      <div className="bg-black border border-white/[0.08] rounded-md p-0 overflow-hidden mb-8 mt-4">
        <div className="bg-[#111] px-4 py-2 border-b border-white/[0.08] text-xs text-gray-400 font-mono">
          Terminal
        </div>
        <div className="p-4 overflow-x-auto text-sm text-emerald-300 font-mono">
          <pre className="!bg-transparent !p-0 !m-0 !border-0">
npm pack
          </pre>
        </div>
      </div>

      <p>
        This command will generate a <code>.tgz</code> file (e.g., <code>my-awesome-theme-1.0.0.tgz</code>) in the root of your folder. This single tarball contains all of your package's code.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-4 text-white">2. Uploading to the Marketplace</h2>
      <p>
        Once you have your <code>.tgz</code> tarball, head over to the NextjsCMS <a href="/upload">Upload Portal</a>.
      </p>
      
      <ol className="list-decimal list-inside space-y-3 mt-6 text-gray-300">
        <li><strong>Sign In</strong> using your GitHub account to authenticate.</li>
        <li><strong>Select Type:</strong> Choose whether you are uploading a Theme or a Plugin.</li>
        <li><strong>Upload:</strong> Drag and drop your generated <code>.tgz</code> file.</li>
      </ol>

      <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-md border border-emerald-500/20 text-sm mt-8">
        <strong>Verified Authorship:</strong> We map the package directly to the authenticated GitHub account of the user who published it. This ensures trust within the Marketplace.
      </div>
    </>
  );
}
