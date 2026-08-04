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
          <section className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold border-b border-white/[0.08] pb-2 text-gray-200 mb-4">1. Anatomy of a Package</h2>
              <p className="text-gray-400">
                NextjsCMS packages are distributed as standard NPM packages. You can build two types of packages: <strong>Themes</strong> and <strong>Plugins</strong>. Each type has slightly different requirements.
              </p>
            </div>

            {/* Themes */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-emerald-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Themes
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Themes control the visual presentation of the CMS. A theme should contain standard Next.js React components (e.g., <code>layout.tsx</code>, <code>page.tsx</code>) and any necessary CSS.
              </p>
              
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Folder Structure</h4>
              <div className="bg-black border border-white/[0.08] rounded-md p-4 overflow-x-auto text-sm text-gray-400 font-mono mb-6">
                <pre>
{`my-awesome-theme/
├── package.json
├── theme.json
├── layout.tsx
├── page.tsx
└── styles.css`}
                </pre>
              </div>

              <h4 className="text-sm font-semibold text-gray-300 mb-2">package.json</h4>
              <p className="text-gray-400 text-sm mb-2">
                Your <code>package.json</code> must define a <code>main</code> entry pointing to your theme configuration file (often <code>theme.json</code>), and standard publishing fields:
              </p>
              <div className="bg-black border border-white/[0.08] rounded-md p-4 overflow-x-auto text-sm text-gray-300 mb-4">
                <pre>
{`{
  "name": "@nextjscms/theme-mytheme",
  "version": "1.0.0",
  "description": "A beautiful dark mode theme",
  "main": "theme.json",
  "publishConfig": {
    "access": "public"
  }
}`}
                </pre>
              </div>
            </div>

            {/* Plugins */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-blue-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Plugins
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Plugins extend the core functionality of the CMS (e.g., SEO managers, AI content generators, Analytics integrations). They interact with the internal CMS APIs and can inject UI into the Admin Dashboard.
              </p>

              <h4 className="text-sm font-semibold text-gray-300 mb-2">Folder Structure</h4>
              <div className="bg-black border border-white/[0.08] rounded-md p-4 overflow-x-auto text-sm text-gray-400 font-mono mb-6">
                <pre>
{`my-awesome-plugin/
├── package.json
├── index.ts
├── api/
│   └── route.ts
└── components/
    └── settings.tsx`}
                </pre>
              </div>

              <h4 className="text-sm font-semibold text-gray-300 mb-2">package.json</h4>
              <p className="text-gray-400 text-sm mb-2">
                Your <code>package.json</code> should point <code>main</code> to your plugin's entry point (e.g., <code>index.ts</code> or <code>plugin.js</code>):
              </p>
              <div className="bg-black border border-white/[0.08] rounded-md p-4 overflow-x-auto text-sm text-gray-300 mb-4">
                <pre>
{`{
  "name": "@nextjscms/plugin-analytics",
  "version": "1.0.0",
  "description": "Google Analytics integration for NextjsCMS",
  "main": "index.ts",
  "publishConfig": {
    "access": "public"
  }
}`}
                </pre>
              </div>
            </div>

            <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-md border border-emerald-500/20 text-sm">
              <strong>Important:</strong> Regardless of type, we automatically map packages directly to the verified GitHub account of the user who published it.
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
