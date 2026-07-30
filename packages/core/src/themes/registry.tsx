// The Theme Registry dynamically loads theme components using Next.js async imports.
// This allows developers to drop a new theme folder in `src/themes/` and have it 
// picked up automatically at runtime based on the database setting!
import React from 'react';

export type ThemeComponentType = 'layout' | 'post' | 'page' | 'archive' | '404' | string;

export async function getThemeComponent(themeName: string, component: ThemeComponentType) {
  try {
    const module = await import(`@/themes/${themeName}/${component}`);
    return module.default;
  } catch (error) {
    try {
      const fallback = await import(`@/themes/default/${component}`);
      return fallback.default;
    } catch (fallbackError) {
      // If it's a custom post type that doesn't have a template, fallback to generic post
      if (component !== 'post' && component !== 'page' && component !== '404' && component !== 'layout' && component !== 'archive') {
        try {
          const genericFallback = await import(`@/themes/default/post`);
          return genericFallback.default;
        } catch (e) {}
      }
      console.error(`Theme Engine CRITICAL Error: Missing default theme fallback for ${component}.`);
      return () => <div>CRITICAL ERROR: Missing default theme fallback for {component}.tsx</div>;
    }
  }
}

// Dynamically import the theme's CSS file if it exists
export async function loadThemeCSS(themeName: string) {
  try {
    // Import CSS dynamically. Next.js handles this during SSR and injects the stylesheet!
    await import(`@/themes/${themeName}/theme.css`);
  } catch (e) {
    // It's perfectly fine if a theme doesn't have a theme.css file (e.g. they just use Tailwind)
    // We swallow the error silently.
  }
}
