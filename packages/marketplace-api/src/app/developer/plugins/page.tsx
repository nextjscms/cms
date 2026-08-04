import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Building Plugins | NextjsCMS Docs',
  description: 'Learn how to build plugins for NextjsCMS.',
};

export default function PluginsDocs() {
  return (
    <>
      <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white">Building Plugins</h1>
      <p className="text-xl text-gray-400 mb-8 font-light">
        Plugins extend the core functionality of the CMS. They can interact with the internal APIs, define new data models, and inject UI into the Admin Dashboard.
      </p>

      <hr className="border-white/[0.08] my-8" />

      <h2 className="text-2xl font-bold mt-12 mb-4 text-white">Folder Structure</h2>
      <p>
        A plugin is a standard NPM package that exports functionality. It can contain API routes, React components, and background workers.
      </p>

      <div className="bg-black border border-white/[0.08] rounded-md p-0 overflow-hidden mb-8">
        <div className="bg-[#111] px-4 py-2 border-b border-white/[0.08] text-xs text-gray-400 font-mono flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          my-awesome-plugin
        </div>
        <div className="p-4 overflow-x-auto text-sm text-gray-300 font-mono">
          <pre className="!bg-transparent !p-0 !m-0 !border-0">
{`├── package.json
├── index.ts
├── api/
│   └── route.ts
└── components/
    └── settings.tsx`}
          </pre>
        </div>
      </div>

      <h2 className="text-2xl font-bold mt-12 mb-4 text-white">The package.json</h2>
      <p>
        Your <code>package.json</code> should point <code>main</code> to your plugin's entry point (e.g., <code>index.ts</code> or <code>plugin.js</code>):
      </p>

      <div className="bg-black border border-white/[0.08] rounded-md p-0 overflow-hidden mb-8">
        <div className="bg-[#111] px-4 py-2 border-b border-white/[0.08] text-xs text-gray-400 font-mono">
          package.json
        </div>
        <div className="p-4 overflow-x-auto text-sm text-gray-300 font-mono">
          <pre className="!bg-transparent !p-0 !m-0 !border-0">
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

      <h2 className="text-2xl font-bold mt-12 mb-4 text-white">Injecting UI</h2>
      <p>
        Because NextjsCMS is built with React Server Components, plugins can easily inject rich UI elements directly into the NextjsCMS Admin Dashboard by exporting React components from the plugin entry point.
      </p>
    </>
  );
}
