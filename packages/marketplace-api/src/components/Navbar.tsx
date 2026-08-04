'use client';

import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function Navbar() {
  const { user, login, logout, isLoggingIn } = useAuth();

  return (
    <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto w-full border-b border-white/[0.08]">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">NextjsCMS</span>
        </Link>
      </div>
      <div className="flex gap-8 text-sm font-medium text-gray-400 items-center">
        <Link href="#" className="hover:text-white transition-colors">Showcase</Link>
        <Link href="#" className="hover:text-white transition-colors">Docs</Link>
        <Link href="/developer" className="hover:text-white transition-colors text-white font-bold">Developer</Link>
        
        {/* Always visible GitHub link */}
        <a href="https://github.com/nextjscms/cms" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
          GitHub
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
        </a>

        {user ? (
          <div className="flex items-center gap-3 border-l border-white/[0.1] pl-6 ml-2">
            <img src={user.avatar_url} alt="Avatar" className="w-6 h-6 rounded-full" />
            <span className="text-white">{user.login}</span>
            <button onClick={logout} className="text-xs hover:text-white ml-2 text-gray-500">Log out</button>
          </div>
        ) : (
          <div className="flex items-center border-l border-white/[0.1] pl-6 ml-2">
            <button onClick={login} disabled={isLoggingIn} className="text-sm font-semibold hover:text-white transition-all bg-white/[0.05] hover:bg-white/[0.1] px-4 py-1.5 rounded-full flex items-center gap-2 disabled:opacity-50">
              {isLoggingIn && <span className="flex h-2.5 w-2.5 rounded-full bg-white animate-ping" />}
              {isLoggingIn ? 'Redirecting...' : 'Sign in'}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
