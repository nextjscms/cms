import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black font-sans text-white selection:bg-white/30 selection:text-white">
      
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto w-full border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">
            NextjsCMS
          </span>
        </div>
        <div className="flex gap-8 text-sm font-medium text-gray-400">
          <a href="#" className="hover:text-white transition-colors">Showcase</a>
          <a href="#" className="hover:text-white transition-colors">Docs</a>
          <a href="#" className="hover:text-white transition-colors">Templates</a>
          <a href="https://github.com/nextjscms/cms" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
            GitHub
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden">
        
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Faded radial gradient to focus center */}
        <div className="absolute inset-0 bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]"></div>

        <div className="max-w-4xl w-full text-center z-10 space-y-8 mt-12 mb-32 relative">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.15] bg-black text-sm font-medium text-gray-300 mb-6 hover:bg-white/[0.02] transition-colors cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
            NextjsCMS v0.1.0 is now available
          </div>
          
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter leading-[1.05]">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
              The React CMS.
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
            Used by some of the world's largest companies, NextjsCMS enables you to create high-quality content sites with the power of React Server Components.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <a
              href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnextjscms%2Fcms&root-directory=packages%2Fcore"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-md bg-white px-8 text-base font-semibold text-black transition-all hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 22h20L12 2z" />
              </svg>
              Deploy
            </a>
            
            <a
              href="https://github.com/nextjscms/cms"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-md border border-gray-700 bg-black px-8 text-base font-medium text-white transition-all hover:bg-gray-900 hover:border-gray-500 active:scale-[0.98] w-full sm:w-auto"
            >
              Learn NextjsCMS
            </a>
          </div>
          
          <div className="pt-16 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-[15px] text-gray-500 font-medium">
            <span className="flex items-center gap-2 hover:text-gray-300 transition-colors cursor-default">
              ~ Zero Config
            </span>
            <span className="flex items-center gap-2 hover:text-gray-300 transition-colors cursor-default">
              ~ Server Components
            </span>
            <span className="flex items-center gap-2 hover:text-gray-300 transition-colors cursor-default">
              ~ Edge Runtime
            </span>
            <span className="flex items-center gap-2 hover:text-gray-300 transition-colors cursor-default">
              ~ GitOps Built-in
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-[13px] text-gray-500 border-t border-white/[0.08]">
        <p>Created by the NextjsCMS community. Open Source.</p>
      </footer>
    </div>
  );
}
