import { neon } from '@neondatabase/serverless';
import Link from 'next/link';

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
      SELECT slug, name, description, image_url, version, author, updated_at, 'theme' as type
      FROM marketplace_themes
      WHERE name ILIKE ${searchPattern} OR description ILIKE ${searchPattern} OR slug ILIKE ${searchPattern}
    `;
  }
  
  if (category === 'all' || category === 'plugins') {
    plugins = await sql`
      SELECT slug, name, description, image_url, version, author, updated_at, 'plugin' as type
      FROM marketplace_plugins
      WHERE name ILIKE ${searchPattern} OR description ILIKE ${searchPattern} OR slug ILIKE ${searchPattern}
    `;
  }

  const allItems = [...themes, ...plugins];

  if (sort === 'updated') {
    allItems.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  } else {
    // Default alphabetical for relevance
    allItems.sort((a, b) => a.name.localeCompare(b.name));
  }

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
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-8 py-8 gap-10">
        
        {/* Left Sidebar (Filters) */}
        <aside className="w-56 flex-shrink-0">
          <div className="space-y-8 sticky top-24">
            
            {/* Categories */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Categories</h3>
              <ul className="space-y-2">
                {[
                  { id: 'all', label: 'All categories' },
                  { id: 'themes', label: 'Themes' },
                  { id: 'plugins', label: 'Plugins' }
                ].map(cat => (
                  <li key={cat.id}>
                    <Link 
                      href={`/marketplace?q=${encodeURIComponent(q)}&category=${cat.id}&sort=${sort}`}
                      className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                        category === cat.id 
                          ? 'bg-emerald-500/10 text-emerald-400 font-medium' 
                          : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sort By */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Sort By</h3>
              <ul className="space-y-2">
                {[
                  { id: 'relevance', label: 'Relevance' },
                  { id: 'updated', label: 'Recently Updated' }
                ].map(s => (
                  <li key={s.id}>
                    <Link 
                      href={`/marketplace?q=${encodeURIComponent(q)}&category=${category}&sort=${s.id}`}
                      className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                        sort === s.id 
                          ? 'bg-emerald-500/10 text-emerald-400 font-medium' 
                          : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'
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

          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No results found. Try adjusting your search or filters.
              </div>
            ) : (
              items.map((item) => (
                <div key={item.slug} className="flex gap-4 p-4 rounded-lg bg-[#161b22] border border-white/[0.05] hover:border-emerald-500/30 transition-colors group">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-[#0d1117] border border-white/[0.05] flex-shrink-0 flex items-center justify-center">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{item.type === 'theme' ? '🎨' : '⚡'}</span>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
                          <Link href={`/marketplace/${item.type}/${item.slug}`} className="hover:underline">{item.name}</Link>
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <span>{item.author}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                          <span>v{item.version}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                          <span className="capitalize">{item.type}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <button className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white rounded text-xs font-medium transition-all">
                          Install
                        </button>
                      </div>
                    </div>
                    
                    <p className="mt-2 text-sm text-gray-300 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

      </div>
    </div>
  );
}
