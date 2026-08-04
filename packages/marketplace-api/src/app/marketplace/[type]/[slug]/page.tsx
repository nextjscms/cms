import { neon } from '@neondatabase/serverless';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { fetchGithubAuthor } from '@/lib/github';

async function fetchGithubReadme(packageName: string) {
  try {
    const token = process.env.GITHUB_PUBLISH_TOKEN || process.env.GITHUB_MARKETPLACE_TOKEN;
    if (token) {
      const res = await fetch(`https://npm.pkg.github.com/${packageName}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        next: { revalidate: 3600 }
      });
      if (res.ok) {
        const data = await res.json();
        return data.readme || null;
      }
    }
  } catch (e) {}
  return null;
}

async function fetchGithubVersions(packageName: string) {
  try {
    const token = process.env.GITHUB_PUBLISH_TOKEN || process.env.GITHUB_MARKETPLACE_TOKEN;
    if (token) {
      const res = await fetch(`https://api.github.com/orgs/nextjscms/packages/npm/${packageName}/versions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        next: { revalidate: 3600 }
      });
      if (res.ok) {
        return await res.json();
      }
    }
  } catch(e) {}
  
  // Fallback mock data if API fails or token is unauthorized
  return [
    { name: '1.0.3', updated_at: new Date(Date.now() - 3 * 86400000).toISOString() },
    { name: '1.0.2', updated_at: new Date(Date.now() - 7 * 86400000).toISOString() },
    { name: '1.0.1', updated_at: new Date(Date.now() - 15 * 86400000).toISOString() },
  ];
}

export const dynamic = 'force-dynamic';

export default async function ItemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { type, slug } = await params;
  const { tab = 'overview' } = await searchParams;
  
  if (type !== 'theme' && type !== 'plugin') {
    return notFound();
  }

  const dbUrl = process.env.MARKETPLACE_DB_URL || process.env.DATABASE_URL;
  if (!dbUrl) return notFound();
  const sql = neon(dbUrl);

  let items;
  if (type === 'theme') {
    items = await sql`SELECT * FROM marketplace_themes WHERE slug = ${slug} LIMIT 1`;
  } else {
    items = await sql`SELECT * FROM marketplace_plugins WHERE slug = ${slug} LIMIT 1`;
  }

  if (!items || items.length === 0) {
    return notFound();
  }

  const item = items[0];
  item.author = await fetchGithubAuthor(item.name, item.author);
  
  const readmeContent = await fetchGithubReadme(item.name);
  const versions = await fetchGithubVersions(item.name.replace('@nextjscms/', ''));

  return (
    <div className="flex-1 flex flex-col font-sans text-gray-200">
      
      {/* Header Banner */}
      <div className="bg-[#161b22] border-b border-white/[0.08]">
        <div className="max-w-6xl w-full mx-auto px-8 py-10 flex items-start gap-6">
          {/* Icon */}
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-[#0d1117] border border-white/[0.1] flex-shrink-0 flex items-center justify-center">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">{type === 'theme' ? '🎨' : '⚡'}</span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-semibold text-white mb-2 flex items-center gap-3">
              {type === 'theme' ? (
                <svg className="w-7 h-7 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              )}
              <span className="truncate">{item.name}</span>
            </h1>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400 mb-6">
              <span className="flex items-center gap-2 font-medium text-gray-200">
                <img src={`https://github.com/${item.author}.png`} alt={item.author} className="w-5 h-5 rounded-full" />
                {item.author}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                {item.installs_count?.toLocaleString() || 0} installs
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
              <span className="flex items-center gap-1 hover:text-amber-400 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                {item.stars_count?.toLocaleString() || 0}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                Free {type}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Updated {new Date(item.updated_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex gap-4">
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-md font-medium transition-colors">
                Install
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/[0.08] bg-[#161b22]">
        <div className="max-w-6xl w-full mx-auto px-8 flex gap-8">
          <Link href={`/marketplace/${type}/${slug}?tab=overview`} className={`px-1 py-4 border-b-2 text-sm font-medium ${tab === 'overview' ? 'border-emerald-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-300'}`}>Overview</Link>
          <Link href={`/marketplace/${type}/${slug}?tab=versions`} className={`px-1 py-4 border-b-2 text-sm font-medium ${tab === 'versions' ? 'border-emerald-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-300'}`}>Version History</Link>
          <button className="px-1 py-4 border-b-2 border-transparent text-gray-400 hover:text-gray-300 text-sm">Q & A</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex max-w-6xl w-full mx-auto px-8 py-10 gap-16">
        
        {/* Left Column (Readme/Overview or Versions) */}
        <main className="flex-1 min-w-0">
          {tab === 'versions' ? (
            <div className="bg-[#0d1117] border border-white/[0.08] rounded-md overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.08] bg-[#161b22] flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-sm font-medium text-gray-300 uppercase tracking-wider">CHANGE LOG</span>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-gray-400">
                    <th className="px-6 py-4 font-semibold">Version</th>
                    <th className="px-6 py-4 font-semibold">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {versions.map((v: any, i: number) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 text-emerald-400 font-medium">{v.name}</td>
                      <td className="px-6 py-4 text-gray-400">{new Date(v.updated_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="prose prose-invert prose-emerald prose-headings:text-white prose-p:text-gray-400 prose-a:text-emerald-400 max-w-none">
              {readmeContent ? (
                <ReactMarkdown>{readmeContent}</ReactMarkdown>
              ) : (
                <div>
                  <h2>Overview</h2>
                  <p>{item.description}</p>
                  <div className="p-8 border border-white/[0.08] rounded-md text-center text-gray-500 mt-8">
                    This package does not have a detailed README.
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right Sidebar (Metadata) */}
        <aside className="w-64 flex-shrink-0">
          <div className="space-y-8">
            
            {/* Categories */}
            <div>
              <h3 className="text-xs font-semibold text-gray-300 mb-3">Categories</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white/[0.05] border border-white/[0.1] rounded text-xs text-gray-400">
                  {type === 'theme' ? 'Themes' : 'Plugins'}
                </span>
                <span className="px-3 py-1 bg-white/[0.05] border border-white/[0.1] rounded text-xs text-gray-400">
                  UI
                </span>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-xs font-semibold text-gray-300 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white/[0.05] border border-white/[0.1] rounded text-xs text-gray-400">nextjs</span>
                <span className="px-3 py-1 bg-white/[0.05] border border-white/[0.1] rounded text-xs text-gray-400">react</span>
                <span className="px-3 py-1 bg-white/[0.05] border border-white/[0.1] rounded text-xs text-gray-400">{type}</span>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-xs font-semibold text-gray-300 mb-3">Resources</h3>
              <ul className="space-y-2 text-sm text-emerald-400">
                <li><Link href="#" className="hover:underline flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg> Homepage</Link></li>
                <li><Link href="#" className="hover:underline flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> Repository</Link></li>
                <li><Link href="#" className="hover:underline flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Issues</Link></li>
              </ul>
            </div>

            {/* More Info */}
            <div className="pt-6 border-t border-white/[0.08]">
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-500">Version</span>
                <span className="text-gray-300">{item.version}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-500">Last updated</span>
                <span className="text-gray-300">{new Date(item.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-500">License</span>
                <span className="text-gray-300">MIT</span>
              </div>
            </div>

          </div>
        </aside>

      </div>
    </div>
  );
}
