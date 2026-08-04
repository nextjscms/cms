import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developer Documentation | NextjsCMS',
  description: 'Learn how to build themes and plugins for NextjsCMS.',
};

export default function DeveloperDocsIntro() {
  return (
    <>
      <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white">Introduction</h1>
      <p className="text-xl text-gray-400 mb-8 font-light">
        Welcome to the NextjsCMS Developer Documentation. Learn how to extend the CMS by building powerful themes and plugins using React Server Components.
      </p>

      <hr className="border-white/[0.08] my-8" />

      <h2 className="text-2xl font-bold mt-12 mb-4 text-white">Architecture</h2>
      <p>
        NextjsCMS is built exclusively on the latest App Router features in Next.js 15. Because of this, it is entirely React Server Components (RSC) native.
      </p>
      <p>
        When you build a theme or plugin for NextjsCMS, you are not writing legacy template code (like PHP or Liquid). You are writing standard React components that run securely on the server.
      </p>

      <h3 className="text-xl font-semibold mt-8 mb-4 text-white">The Marketplace Ecosystem</h3>
      <p>
        We use the standard NPM ecosystem to distribute extensions. Every theme or plugin you create is simply an NPM package that gets published to the GitHub Container Registry. NextjsCMS then dynamically downloads, extracts, and mounts these React components into the user's running application.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
        <a href="/developer/themes" className="block p-6 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-all no-underline">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 m-0 mb-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
            Building Themes
          </h3>
          <p className="text-sm text-gray-400 m-0">Learn how to control the visual presentation of a NextjsCMS site.</p>
        </a>

        <a href="/developer/plugins" className="block p-6 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-all no-underline">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 m-0 mb-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            Building Plugins
          </h3>
          <p className="text-sm text-gray-400 m-0">Learn how to extend core functionality and inject UI into the Admin Dashboard.</p>
        </a>
      </div>
    </>
  );
}
