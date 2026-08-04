import { neon } from '@neondatabase/serverless';
import Link from 'next/link';
import { MarketItem } from '@/components/MarketItem';
import { fetchGithubAuthor } from '@/lib/github';

export default async function Home() {
  let stars = 0;
  let latestRelease = 'v0.1.0'; // Fallback
  
  let themes: any[] = [];
  let plugins: any[] = [];

  try {
    // Fetch stars and latest release in parallel
    const [repoRes, releaseRes] = await Promise.all([
      fetch('https://api.github.com/repos/nextjscms/cms', { next: { revalidate: 3600 } }),
      fetch('https://api.github.com/repos/nextjscms/cms/releases/latest', { next: { revalidate: 3600 } })
    ]);

    if (repoRes.ok) {
      const data = await repoRes.json();
      stars = data.stargazers_count || 0;
    }

    if (releaseRes.ok) {
      const releaseData = await releaseRes.json();
      if (releaseData.tag_name) {
        latestRelease = releaseData.tag_name;
      }
    }
  } catch (e) {
    // gracefully degrade if fetch fails
  }

  try {
    const dbUrl = process.env.MARKETPLACE_DB_URL || process.env.DATABASE_URL;
    if (dbUrl) {
      const sql = neon(dbUrl);
      themes = await sql`SELECT *, 'theme' as type FROM marketplace_themes ORDER BY updated_at DESC LIMIT 6`;
      plugins = await sql`SELECT *, 'plugin' as type FROM marketplace_plugins ORDER BY updated_at DESC LIMIT 6`;
      
      // Fetch real authors from GitHub Packages
      themes = await Promise.all(themes.map(async t => ({
        ...t,
        author: await fetchGithubAuthor(t.name, t.author)
      })));
      plugins = await Promise.all(plugins.map(async p => ({
        ...p,
        author: await fetchGithubAuthor(p.name, p.author)
      })));
    }
  } catch(e) {
    console.error('Failed to fetch from db:', e);
  }

  return (
    <div className="flex flex-col flex-1 font-sans text-white selection:bg-white/30 selection:text-white">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden py-32">
        
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Faded radial gradient to focus center */}
        <div className="absolute inset-0 bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]"></div>

        <div className="max-w-4xl w-full text-center z-10 space-y-8 relative">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-sm font-medium text-emerald-300 mb-6 hover:bg-emerald-500/20 transition-colors cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            NextjsCMS {latestRelease} is now available
          </div>
          
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter leading-[1.05]">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
              The GitOps CMS.
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
            The modern WordPress alternative. Create lightning-fast content sites powered by React Server Components, an open-source Marketplace, and powerful AI assistance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <a
              href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnextjscms%2Fcms&root-directory=packages%2Fcore&stores=%5B%7B%22type%22%3A%22postgres%22%7D%5D&env=WEBSITE_NAME,ADMIN_EMAIL,ADMIN_PASSWORD&envDescription=Provide%20your%20site%20name%20and%20admin%20credentials%20for%20initial%20setup&project-name=nextjscms-site&demo-title=NextjsCMS&demo-description=The+React+CMS&demo-image=https%3A%2F%2Fog-image.vercel.app%2FNextjsCMS.png%3Ftheme%3Ddark%26md%3D1%26fontSize%3D125px"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-md bg-white px-8 text-base font-semibold text-black transition-all hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 22h20L12 2z" />
              </svg>
              Deploy One-Click
            </a>
            
            <a
              href="https://github.com/nextjscms/cms"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-md border border-gray-700 bg-black px-8 text-base font-medium text-white transition-all hover:bg-gray-900 hover:border-gray-500 active:scale-[0.98] w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
              Star on GitHub
              {stars > 0 && <span className="ml-2 bg-gray-800 text-gray-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-gray-700">{stars.toLocaleString()}</span>}
            </a>
          </div>
        </div>
      </main>

      {/* Showcase Section */}
      <section id="showcase" className="max-w-6xl mx-auto w-full px-6 py-24 z-10 border-t border-white/[0.08]">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Marketplace Showcase</h2>
          <p className="text-gray-400 text-lg">Browse themes and plugins created by the open-source community.</p>
        </div>

        <div className="space-y-24">
          {/* Themes */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Popular Themes
              </h3>
            </div>
            {themes.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/[0.1] rounded-xl text-gray-500">
                No themes published yet. Be the first!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {themes.map((theme) => (
                  <MarketItem key={theme.slug} item={theme} />
                ))}
              </div>
            )}
          </div>

          {/* Plugins */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Popular Plugins
              </h3>
            </div>
            {plugins.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/[0.1] rounded-xl text-gray-500">
                No plugins published yet. Be the first!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plugins.map((plugin) => (
                  <MarketItem key={plugin.slug} item={plugin} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-[13px] text-gray-500 border-t border-white/[0.08]">
        <p>Created by the NextjsCMS community. Open Source.</p>
      </footer>
    </div>
  );
}
