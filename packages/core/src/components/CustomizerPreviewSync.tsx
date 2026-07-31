'use client';
import { useEffect } from 'react';

/**
 * Listens for 'THEME_UPDATE' messages from the Admin Theme Customizer iframe parent
 * and dynamically injects CSS variables to preview settings without a page reload.
 */
export default function CustomizerPreviewSync() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // In production, verify event.origin
      if (event.data?.type === 'THEME_UPDATE') {
        const { settings, activeTheme } = event.data;
        
        // Convert settings back to local keys and apply as CSS variables on :root
        // E.g., `theme_default_primaryColor` -> `--primaryColor`
        const prefix = `theme_${activeTheme}_`;
        
        for (const [key, value] of Object.entries(settings)) {
          let shortKey = key;
          if (key.startsWith(prefix)) {
            shortKey = key.replace(prefix, '');
          }
            
            // 1. Update CSS Variables (for colors, spacing, etc.)
            const cssVar = `--${shortKey}`;
            document.documentElement.style.setProperty(cssVar, value as string);

            // 2. Update Text Content (for site titles, descriptions, etc.)
            const textElements = document.querySelectorAll(`[data-theme-editable="${shortKey}"]`);
            textElements.forEach((el) => {
              el.textContent = value as string;
            });

            // 3. Update Conditional Visibility (for boolean toggles)
            const ifElements = document.querySelectorAll(`[data-theme-if="${shortKey}"]`);
            ifElements.forEach((el) => {
              (el as HTMLElement).style.display = (value === 'true' || value === true) ? '' : 'none';
            });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return null;
}
