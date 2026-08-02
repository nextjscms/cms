// The Theme Registry dynamically loads theme components using Next.js async imports.
// This allows developers to drop a new theme folder in `src/themes/` and have it 
// picked up automatically at runtime based on the database setting!
import React from 'react';
const globalForRegistry = globalThis as unknown as {
  themeCache: Map<string, any>;
};

if (!globalForRegistry.themeCache) {
  globalForRegistry.themeCache = new Map<string, any>();
}
const themeCache = globalForRegistry.themeCache;

export type ThemeComponentType = 'layout' | 'post' | 'page' | 'archive' | '404' | string;

export async function getThemeComponent(themeName: string, component: ThemeComponentType) {
  const cacheKey = `${themeName}:${component}`;
  if (themeCache.has(cacheKey)) {
    return themeCache.get(cacheKey);
  }

  try {
    const module = await import(`@/themes/${themeName}/${component}`);
    themeCache.set(cacheKey, module.default);
    return module.default;
  } catch (error) {
    try {
      const fallback = await import(`@/themes/default/${component}`);
      themeCache.set(cacheKey, fallback.default);
      return fallback.default;
    } catch (fallbackError) {
      // If it's a custom post type that doesn't have a template, fallback to generic post
      if (component !== 'post' && component !== 'page' && component !== '404' && component !== 'layout' && component !== 'archive') {
        try {
          const genericFallback = await import(`@/themes/default/post`);
          themeCache.set(cacheKey, genericFallback.default);
          return genericFallback.default;
        } catch (e) {}
      }
      console.error(`Theme Engine CRITICAL Error: Missing default theme fallback for ${component}.`);
      return () => <div>CRITICAL ERROR: Missing default theme fallback for {component}.tsx</div>;
    }
  }
}

