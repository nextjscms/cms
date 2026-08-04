'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
  login: string;
  avatar_url: string;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  isCheckingAuth: boolean;
  isLoggingIn: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Check URL for token (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('github_token');
    
    let activeToken = urlToken || localStorage.getItem('github_token');

    if (urlToken) {
      localStorage.setItem('github_token', urlToken);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (activeToken) {
      setToken(activeToken);
      // Verify token with GitHub
      fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${activeToken}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then(data => {
        setUser(data);
      })
      .catch(() => {
        localStorage.removeItem('github_token');
        setToken(null);
      })
      .finally(() => setIsCheckingAuth(false));
    } else {
      setIsCheckingAuth(false);
    }
  }, []);

  const login = () => {
    setIsLoggingIn(true);
    // Redirect to the API oauth authorize route with current page as the return URL
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `/api/auth/github/authorize?return_url=${returnUrl}`;
  };

  const logout = () => {
    localStorage.removeItem('github_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, isCheckingAuth, isLoggingIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
