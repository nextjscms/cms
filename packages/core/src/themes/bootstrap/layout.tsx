import React from 'react';

type LayoutProps = {
  children: React.ReactNode;
  settings?: Record<string, string>;
  menu?: Array<{ label: string, url: string }>;
}

export default function Layout({ children, settings = {}, menu = [] }: LayoutProps) {
  const siteName = settings.siteName || "Bootstrap CMS";
  const navbarType = settings.navbarType || "dark";
  const navClass = navbarType === 'dark' ? 'navbar-dark bg-dark' : 'navbar-light bg-light';

  return (
    <>
      {/* OPTION 1: INJECTING BOOTSTRAP VIA CDN */}
      {/* React automatically hoists <link> tags to the document head! */}
      <link 
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" 
        rel="stylesheet" 
      />

      <div className="d-flex flex-column min-vh-100">
        <nav className={`navbar navbar-expand-lg ${navClass} mb-4`}>
          <div className="container">
            <a className="navbar-brand fw-bold" href="/">{siteName}</a>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto">
                {menu.length > 0 ? (
                  menu.map((item, idx) => (
                    <li className="nav-item" key={idx}>
                      <a className="nav-link" href={item.url}>{item.label}</a>
                    </li>
                  ))
                ) : (
                  <li className="nav-item">
                    <a className="nav-link" href="/">Home</a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </nav>
        
        <main className="flex-grow-1 container">
          {children}
        </main>

        <footer className="bg-white border-top mt-5 py-4 text-center">
          <div className="container">
            <p className="text-muted mb-0">
              &copy; {new Date().getFullYear()} {siteName}. Built with Bootstrap & NextjsCMS.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
