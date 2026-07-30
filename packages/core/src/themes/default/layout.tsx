import React from 'react';
import Link from 'next/link';

type LayoutProps = {
  children: React.ReactNode;
  settings?: Record<string, string>;
  menus?: Record<string, Array<{ label: string, url: string }>>;
}

export default function Layout({ children, settings = {}, menus = {} }: LayoutProps) {
  const siteName = settings.siteName || "NextjsCMS";
  const primaryColor = settings.primaryColor || "#2563eb";
  const showFooterCredits = settings.showFooterCredits === 'true' || settings.showFooterCredits === undefined;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-white border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: primaryColor }}>
            {siteName}
          </h1>
          <nav className="space-x-6 text-sm font-medium">
            {menus.primary && menus.primary.length > 0 ? (
              menus.primary.map((item, idx) => (
                <Link key={idx} href={item.url} className="text-neutral-600 hover:text-neutral-900 transition-colors">
                  {item.label}
                </Link>
              ))
            ) : (
              <Link href="/" className="text-neutral-600 hover:text-neutral-900 transition-colors">Home</Link>
            )}
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-neutral-50 border-t border-neutral-200 mt-20">
        <div className="max-w-5xl mx-auto px-6 py-12 text-center flex flex-col items-center">
          {menus.footer && menus.footer.length > 0 && (
            <div className="flex gap-6 mb-6">
              {menus.footer.map((item, idx) => (
                <Link key={idx} href={item.url} className="text-neutral-500 hover:text-neutral-800 text-sm font-medium transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          )}
          <p className="text-neutral-500 text-sm mb-4">
            &copy; {new Date().getFullYear()} {siteName}.
          </p>
          {showFooterCredits && (
            <p className="text-xs text-neutral-400 font-medium tracking-wide uppercase">
              Powered by Next.js & Neon Serverless Postgres
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
