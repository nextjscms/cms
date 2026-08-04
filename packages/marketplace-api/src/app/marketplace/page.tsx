import { neon } from '@neondatabase/serverless';
import Link from 'next/link';
import { MarketItem } from '@/components/MarketItem';
import { fetchGithubAuthor } from '@/lib/github';

export const dynamic = 'force-dynamic';

async function fetchMarketplaceData(query: string, category: string, sort: string) {
  const dbUrl = process.env.MARKETPLACE_DB_URL || process.env.DATABASE_URL;
  if (!dbUrl) return [];
  const sql = neon(dbUrl);

  const searchPattern = `%${query}%`;
  
  let themes: any[] = [];
  let plugins: any[] = [];

  if (category === 'all' || category === 'themes') {
    themes = await sql`
      SELECT slug, name, description, image_url, version, author, updated_at, stars_count, installs_count, 'theme' as type
      FROM marketplace_themes
      WHERE name ILIKE ${searchPattern} OR description ILIKE ${searchPattern} OR slug ILIKE ${searchPattern}
    `;
  }
  
  if (category === 'all' || category === 'plugins') {
    plugins = await sql`
      SELECT slug, name, description, image_url, version, author, updated_at, stars_count, installs_count, 'plugin' as type
      FROM marketplace_plugins
      WHERE name ILIKE ${searchPattern} OR description ILIKE ${searchPattern} OR slug ILIKE ${searchPattern}
    `;
  }

  let allItems = [...themes, ...plugins];

  if (sort === 'updated') {
    allItems.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  } else {
    // Default alphabetical for relevance
    allItems.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  // Fetch real authors from GitHub Packages
  allItems = await Promise.all(allItems.map(async item => ({
    ...item,
    author: await fetchGithubAuthor(item.name, item.author)
  })));

  return allItems;
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>
}) {
  const params = await searchParams;
  const q = params.q || '';
  const category = params.category || 'all';
  const sort = params.sort || 'relevance';

  const items = await fetchMarketplaceData(q, category, sort);

  return (
    <div className="flex-1 flex flex-col font-sans text-gray-200">
      
      {/* Search Header Banner (VS Code Style) */}
      <div className="bg-[#161b22] border-b border-white/[0.08] px-8 py-10 flex flex-col items-center">
        <h1 className="text-3xl font-semibold text-white mb-6 tracking-tight">Marketplace</h1>
        <form action="/marketplace" method="GET" className="w-full max-w-3xl relative flex items-center">
          <svg className="w-5 h-5 absolute left-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text"
            name="q" 
            defaultValue={q} 
            placeholder="Search themes and plugins..." 
            className="w-full bg-[#0d1117] border border-white/[0.1] rounded-md py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="sort" value={sort} />
          <button type="submit" className="absolute right-3 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors">
            Search
          </button>
        </form>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex max-w-6xl w-full mx-auto px-8 py-8 gap-10">
        
        {/* Left Sidebar (Filters) */}
        <aside className="w-56 flex-shrink-0">
          <div className="space-y-8 sticky top-24">
            
            {/* Categories */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                Categories
              </h3>
              <ul className="space-y-1">
                {[
                  { id: 'all', label: 'All categories' },
                  { id: 'themes', label: 'Themes' },
                  { id: 'plugins', label: 'Plugins' }
                ].map(cat => (
                  <li key={cat.id}>
                    <Link 
                      href={`/marketplace?q=${encodeURIComponent(q)}&category=${cat.id}&sort=${sort}`}
                      className={`block px-3 py-2 -ml-3 rounded-md text-sm transition-colors ${
                        category === cat.id 
                          ? 'bg-emerald-500/10 text-emerald-400 font-medium' 
                          : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'
                      }`}
                    >
                      {cat.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sort By */}
            <div className="pt-6 border-t border-white/[0.05]">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                Sort By
              </h3>
              <ul className="space-y-1">
                {[
                  { id: 'relevance', label: 'Relevance' },
                  { id: 'updated', label: 'Recently Updated' }
                ].map(s => (
                  <li key={s.id}>
                    <Link 
                      href={`/marketplace?q=${encodeURIComponent(q)}&category=${category}&sort=${s.id}`}
                      className={`block px-3 py-2 -ml-3 rounded-md text-sm transition-colors ${
                        sort === s.id 
                          ? 'bg-emerald-500/10 text-emerald-400 font-medium' 
                          : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'
                      }`}
                    >
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
          </div>
        </aside>

        {/* Results List */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.08]">
            <h2 className="text-lg font-semibold text-white">
              {q ? `Results for "${q}"` : 'All items'} <span className="text-gray-500 font-normal text-sm ml-2">({items.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                No results found. Try adjusting your search or filters.
              </div>
            ) : (
              items.map((item) => (
                <MarketItem key={item.slug} item={item} />
              ))
            )}
          </div>
        </main>

      </div>
    </div>
  );
}
