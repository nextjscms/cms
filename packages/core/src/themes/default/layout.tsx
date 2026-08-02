import React from 'react';
import Link from 'next/link';
import './theme.css';

type LayoutProps = {
  children: React.ReactNode;
  settings?: Record<string, string>;
  menus?: Record<string, Array<{ label: string, url: string }>>;
}

export default function Layout({ children, settings = {}, menus = {} }: LayoutProps) {
  const siteName = settings.siteName || "NextjsCMS";
  const showFooterCredits = settings.showFooterCredits === 'true' || settings.showFooterCredits === undefined;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-primary" data-theme-editable="siteName">
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

      <footer className="bg-secondary border-t border-border mt-20">
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
          <p 
            className="text-xs text-neutral-400 font-medium tracking-wide uppercase"
            data-theme-if="showFooterCredits"
            style={{ display: showFooterCredits ? '' : 'none' }}
          >
            Powered by Next.js & Neon Serverless Postgres
          </p>
        </div>
      </footer>
    </div>
  );
}
