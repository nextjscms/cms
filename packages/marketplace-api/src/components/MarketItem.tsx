import Link from 'next/link';

export interface MarketItemProps {
  item: {
    slug: string;
    type: 'theme' | 'plugin';
    image_url?: string;
    name: string;
    version: string;
    stars_count?: number;
    installs_count?: number;
    description: string;
    author: string;
  };
}

export function MarketItem({ item }: MarketItemProps) {
  return (
    <Link href={`/marketplace/${item.type}/${item.slug}`} className={`group rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all overflow-hidden flex flex-col ${item.type === 'theme' ? 'hover:border-emerald-500/30' : 'hover:border-blue-500/30'}`}>
      <div className="h-44 w-full bg-[#0d1117] border-b border-white/[0.08] relative flex-shrink-0">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">{item.type === 'theme' ? '🎨' : '⚡'}</div>
        )}
        <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm text-xs font-mono px-2 py-1 rounded-md border border-white/10 text-gray-300">
          v{item.version}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h4 className={`text-lg font-bold truncate transition-colors ${item.type === 'theme' ? 'group-hover:text-emerald-400' : 'group-hover:text-blue-400'}`}>{item.name}</h4>
          <span className={`${item.type === 'theme' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'} border text-xs font-bold px-2 py-0.5 rounded flex-shrink-0`}>
            Free
          </span>
        </div>
        
        {/* Rating and Installs */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1 hover:text-amber-400 transition-colors">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            {item.stars_count?.toLocaleString() || 0}
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-700"></span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            {item.installs_count?.toLocaleString() || 0}
          </span>
        </div>

        <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-1">{item.description}</p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.08]">
          <div className="flex items-center gap-2">
            <img src={`https://github.com/${item.author}.png`} alt={item.author} className="w-6 h-6 rounded-full" />
            <span className="text-sm text-gray-300">@{item.author}</span>
          </div>
          <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">{item.type}</span>
        </div>
      </div>
    </Link>
  );
}
