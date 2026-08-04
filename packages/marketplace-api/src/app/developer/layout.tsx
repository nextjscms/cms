'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sidebarLinks = [
  {
    title: 'Getting Started',
    links: [
      { name: 'Introduction', href: '/developer' }
    ]
  },
  {
    title: 'Building',
    links: [
      { name: 'Themes', href: '/developer/themes' },
      { name: 'Plugins', href: '/developer/plugins' }
    ]
  },
  {
    title: 'Distribution',
    links: [
      { name: 'Publishing', href: '/developer/publishing' }
    ]
  }
];

export default function DeveloperDocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex-1 flex max-w-[1400px] w-full mx-auto font-sans text-gray-200">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 hidden md:block border-r border-white/[0.08] min-h-[calc(100vh-80px)] py-10 pl-8 pr-6 sticky top-0 overflow-y-auto">
        <div className="space-y-8">
          {sidebarLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-white mb-3 tracking-tight">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className={`block text-sm transition-colors ${
                          isActive 
                            ? 'text-emerald-400 font-medium' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {link.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 py-12 px-8 md:px-16 lg:px-24 xl:px-32">
        <div className="max-w-3xl prose prose-invert prose-emerald prose-headings:text-white prose-p:text-gray-400 prose-a:text-emerald-400 hover:prose-a:text-emerald-300 prose-code:text-emerald-300 prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-white/[0.08] prose-hr:border-white/[0.08]">
          {children}
        </div>
      </main>
    </div>
  );
}
