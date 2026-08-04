export const metadata = {
  title: 'Documentation | NextjsCMS',
  description: 'Learn how to build and publish themes and plugins for NextjsCMS.',
};

export default function DocsPage() {
  return (
    <div className="flex-1 flex flex-col font-sans pb-24 text-white">
      <main className="max-w-3xl mx-auto w-full pt-16 px-6">
        
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">Developer Documentation</h1>
          <p className="text-gray-400 font-light text-lg">
            Welcome to the NextjsCMS developer docs! Here you'll learn how to build, package, and publish themes and plugins to the marketplace.
          </p>
        </div>

        <div className="space-y-12">
          {/* Anatomy of a Package */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold border-b border-white/[0.08] pb-2 text-gray-200">1. Anatomy of a Package</h2>
            <p className="text-gray-400">
              NextjsCMS packages (themes or plugins) are simply folders with a <code>package.json</code> file. Since NextjsCMS is built entirely on React Server Components, your themes are just regular React components, and your plugins can leverage standard Node/React APIs.
            </p>
            <p className="text-gray-400">
              Your <code>package.json</code> <strong>must</strong> include the following structure:
            </p>
            <div className="bg-black border border-white/[0.08] rounded-md p-4 overflow-x-auto text-sm text-gray-300">
              <pre>
{`{
  "name": "my-awesome-theme",
  "version": "1.0.0",
  "description": "A beautiful dark mode theme",
  "nextjscms": {
    "type": "theme" // or "plugin"
  }
}`}
              </pre>
            </div>
            <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-md border border-emerald-500/20 text-sm">
              <strong>Important:</strong> We map packages directly to the verified GitHub account of the user who published it.
            </div>
          </section>

          {/* Packaging */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold border-b border-white/[0.08] pb-2 text-gray-200">2. Packaging your code</h2>
            <p className="text-gray-400">
              We rely on standard NPM tools for packaging. When you are ready to publish, navigate to your package directory in the terminal and run:
            </p>
            <div className="bg-black border border-white/[0.08] rounded-md p-4 text-sm text-gray-300">
              <pre>npm pack</pre>
            </div>
            <p className="text-gray-400">
              This will generate a <code>.tgz</code> file (e.g., <code>my-awesome-theme-1.0.0.tgz</code>) in that folder. This single tarball contains all of your package's code.
            </p>
          </section>

          {/* Publishing */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold border-b border-white/[0.08] pb-2 text-gray-200">3. Publishing to the Marketplace</h2>
            <p className="text-gray-400">
              Once you have your <code>.tgz</code> tarball, head over to the <a href="/upload" className="text-blue-400 hover:underline">Upload Portal</a>.
            </p>
            <ol className="list-decimal list-inside text-gray-400 space-y-2">
              <li><strong>Sign In</strong> using your GitHub account.</li>
              <li>Select whether you are publishing a <strong>Theme</strong> or a <strong>Plugin</strong>.</li>
              <li>Upload your generated <code>.tgz</code> file.</li>
              <li>(Optional) Provide an image URL for a thumbnail to make your package pop on the marketplace!</li>
              <li>Click <strong>Publish to Marketplace</strong>.</li>
            </ol>
            <p className="text-gray-400 pt-2">
              Our API will automatically decompress your package, read your <code>package.json</code>, verify your identity, and list your new version globally on the NextjsCMS Marketplace!
            </p>
          </section>

          {/* Installation */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold border-b border-white/[0.08] pb-2 text-gray-200">4. Installing from the Marketplace</h2>
            <p className="text-gray-400">
              CMS site owners can install your package by visiting their CMS Admin Dashboard, navigating to the Themes or Plugins tab, and browsing the global directory.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}
