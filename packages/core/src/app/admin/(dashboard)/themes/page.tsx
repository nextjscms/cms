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
    } catch (e) {
      console.warn(`Could not parse theme.json for ${folderName}`);
    }
    
    return themeInfo;
  });


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Themes</h1>
          <p className="text-slate-500 mt-1">Manage your site's appearance.</p>
        </div>
        <Button>Upload Theme (.zip)</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {availableThemes.map(theme => {
          const isActive = theme.slug === activeThemeSlug;
          
          return (
            <Card key={theme.slug} className={`overflow-hidden shadow-sm transition-all ${isActive ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className="h-40 bg-slate-50 flex items-center justify-center border-b border-slate-100">
                <Palette className={`w-12 h-12 ${isActive ? 'text-emerald-300' : 'text-slate-300'}`} />
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{theme.name}</CardTitle>
                  {isActive && (
                    <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  )}
                </div>
                <CardDescription>
                  {theme.version && `Version ${theme.version}`} 
                  {theme.author && ` by ${theme.author}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 line-clamp-2 min-h-[2.5rem]">
                  {theme.description || `The ${theme.name} theme.`}
                </p>
              </CardContent>
              <CardFooter>
                {isActive ? (
                  <Link href="/admin/themes/customizer" className="w-full">
                    <Button variant="outline" className="w-full border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
                      Customize
                    </Button>
                  </Link>
                ) : (
                  <form action={activateTheme} className="w-full">
                    <input type="hidden" name="themeSlug" value={theme.slug} />
                    <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800">
                      Activate Theme
                    </Button>
                  </form>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
