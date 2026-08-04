import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Building Themes | NextjsCMS Docs',
  description: 'Learn how to build themes for NextjsCMS.',
};

export default function ThemesDocs() {
  return (
    <>
      <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white">Building Themes</h1>
      <p className="text-xl text-gray-400 mb-8 font-light">
        Themes control the visual presentation of a NextjsCMS site. They are standard React components that define layouts, pages, and styling.
      </p>

      <hr className="border-white/[0.08] my-8" />

      <h2 className="text-2xl font-bold mt-12 mb-4 text-white">Folder Structure</h2>
      <p>
        A NextjsCMS theme is simply a folder containing a <code>package.json</code> and standard Next.js components.
      </p>

      <div className="bg-black border border-white/[0.08] rounded-md p-0 overflow-hidden mb-8">
        <div className="bg-[#111] px-4 py-2 border-b border-white/[0.08] text-xs text-gray-400 font-mono flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
          my-awesome-theme
        </div>
        <div className="p-4 overflow-x-auto text-sm text-gray-300 font-mono">
          <pre className="!bg-transparent !p-0 !m-0 !border-0">
{`├── package.json
├── theme.json
├── layout.tsx
├── page.tsx
└── styles.css`}
          </pre>
        </div>
      </div>

      <h2 className="text-2xl font-bold mt-12 mb-4 text-white">The package.json</h2>
      <p>
        Your <code>package.json</code> acts as the manifest for your theme. It must define a <code>main</code> entry pointing to your theme configuration file (usually <code>theme.json</code>), and standard publishing fields:
      </p>

      <div className="bg-black border border-white/[0.08] rounded-md p-0 overflow-hidden mb-8">
        <div className="bg-[#111] px-4 py-2 border-b border-white/[0.08] text-xs text-gray-400 font-mono">
          package.json
        </div>
        <div className="p-4 overflow-x-auto text-sm text-gray-300 font-mono">
          <pre className="!bg-transparent !p-0 !m-0 !border-0">
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

      <h2 className="text-2xl font-bold mt-12 mb-4 text-white">Styling</h2>
      <p>
        You can use standard CSS, CSS Modules, or Tailwind CSS to style your theme. Because NextjsCMS is highly dynamic, it is recommended to expose CSS variables that allow end-users to customize the theme from the Admin Dashboard.
      </p>

      <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-md border border-emerald-500/20 text-sm my-8">
        <strong>Important:</strong> When building themes for NextjsCMS, developers must bridge dynamic database styling and hardcoded CSS using CSS Variables in the Tailwind configuration or standard CSS variables.
      </div>
    </>
  );
}
