import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Palette, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { activateTheme } from '@/app/admin/actions';
import MarketplaceClient from './MarketplaceClient';

// Define the type for parsed theme metadata
type ThemeInfo = {
  slug: string;
  name: string;
  version?: string;
  author?: string;
  description?: string;
};

export default async function ThemesPage() {
  const db = getDb();

  // 1. Fetch currently active theme from DB
  const [activeThemeSetting] = await db.select().from(settings).where(eq(settings.key, 'activeTheme'));
  const activeThemeSlug = activeThemeSetting?.value || 'default';

  // 2. Scan the file system for themes
  const themesDir = path.join(process.cwd(), 'src/themes');
  const themeFolders = fs.readdirSync(themesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  // 3. Read theme.json for each discovered folder
  const availableThemes: ThemeInfo[] = themeFolders.map(folderName => {
    const themeJsonPath = path.join(themesDir, folderName, 'theme.json');
    let themeInfo: ThemeInfo = {
      slug: folderName,
      name: folderName.charAt(0).toUpperCase() + folderName.slice(1) // Fallback name
    };

    try {
      if (fs.existsSync(themeJsonPath)) {
        const rawJson = fs.readFileSync(themeJsonPath, 'utf-8');
        const parsed = JSON.parse(rawJson);
        themeInfo = { ...themeInfo, ...parsed, slug: folderName };
      }
      
      const packageJsonPath = path.join(themesDir, folderName, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const pkgRaw = fs.readFileSync(packageJsonPath, 'utf-8');
        const pkgParsed = JSON.parse(pkgRaw);
        if (pkgParsed.version) {
          themeInfo.version = pkgParsed.version;
        }
      }
    } catch (e) {
      console.warn(`Could not parse theme files for ${folderName}`);
    }

    return themeInfo;
  });


  return (
    <div className="h-full flex flex-col">
      <MarketplaceClient localThemes={availableThemes} activeThemeSlug={activeThemeSlug} />
    </div>
  );
}
