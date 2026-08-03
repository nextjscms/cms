import Link from 'next/link';
import { redirect } from 'next/navigation';
import * as LucideIcons from 'lucide-react';
const { FileText, Home, Image, Settings, Users, LayoutTemplate, Puzzle, Tags, FolderTree, Database, LogOut } = LucideIcons;

function DynamicIcon({ name, fallback = 'Database', className }: { name?: string | null, fallback?: string, className?: string }) {
  // Try to find the exact name, or fallback. It must be capitalized.
  const iconName = name ? name.charAt(0).toUpperCase() + name.slice(1) : fallback;
  const IconComponent = (LucideIcons as any)[iconName] || (LucideIcons as any)[fallback] || Database;
  return <IconComponent className={className} />;
}
import { hasPermission } from '@/lib/auth-utils';
import { signOut } from '@/auth';
import { SidebarLink } from './SidebarLink';
import { Toaster } from '@/components/ui/sonner';

export const dynamic = 'force-dynamic';

import { getDb } from '@/db';
import fs from 'fs';
import path from 'path';
import { eq } from 'drizzle-orm';
import { settings, postTypes } from '@/db/schema';
import { PluginUIs } from '@/plugins/registry';

import { hasExistingUsers } from '@/app/admin/setup/setup-actions';
import { getGitOpsSettings } from '@/lib/gitops';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const usersExist = await hasExistingUsers();
  if (!usersExist) {
    redirect('/admin/setup');
  }

  const gitOps = await getGitOpsSettings();
  if (!gitOps || !gitOps.githubToken) {
    redirect('/admin/setup');
  }

  const isAdmin = await hasPermission('admin');
  const db = getDb();
  let customPostTypes = [];
  
  // Load active plugins for Admin Menus
  let pluginMenus: { label: string, icon: string, route: string, slug: string }[] = [];
  try {
    const [activePluginsSetting] = await db.select().from(settings).where(eq(settings.key, 'activePlugins'));
    const [hiddenPluginsSetting] = await db.select().from(settings).where(eq(settings.key, 'hiddenSidebarPlugins'));
    let hiddenPlugins: string[] = [];
    if (hiddenPluginsSetting?.value) {
      try { hiddenPlugins = JSON.parse(hiddenPluginsSetting.value); } catch(e) {}
    }

    if (activePluginsSetting?.value) {
      const activePlugins: string[] = JSON.parse(activePluginsSetting.value);
      const pluginsDir = path.join(process.cwd(), 'src/plugins');
      
      for (const slug of activePlugins) {
        if (hiddenPlugins.includes(slug)) continue;
        const pluginJsonPath = path.join(pluginsDir, slug, 'plugin.json');
        if (fs.existsSync(pluginJsonPath)) {
          try {
            const rawJson = fs.readFileSync(pluginJsonPath, 'utf-8');
            const parsed = JSON.parse(rawJson);
            const hasAdminUI = !!PluginUIs[slug]?.AdminUI;
            if (hasAdminUI) {
              pluginMenus.push({
                label: parsed.adminMenu?.label || parsed.name || slug,
                icon: parsed.adminMenu?.icon || 'Puzzle',
                route: `/admin/p/${slug}`,
                slug,
              });
            }
          } catch (e) {
            console.error(`Failed to parse plugin.json for ${slug}`, e);
          }
        }
      }
    }
  } catch (e) {
    console.error("Failed to load plugin admin menus", e);
  }

  try {
    customPostTypes = await db.select().from(postTypes);
  } catch (error: any) {
    // If the tables don't exist (e.g. user manually set DATABASE_URL but didn't run migrations)
    if (error.message?.includes('relation "post_types" does not exist') || error.message?.includes('does not exist')) {
      console.error("Database tables missing. Redirecting to setup.");
      redirect('/setup');
    }
    throw error;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 text-neutral-900">
      {/* Sidebar */}
      <aside className="w-64 bg-black text-neutral-400 flex flex-col border-r border-neutral-200/20">
        <div className="h-16 flex items-center px-6 border-b border-neutral-800">
          <span className="text-white font-bold text-lg tracking-wide">NextjsCMS</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <SidebarLink href="/admin" exact className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-800 hover:text-white transition-colors">
            <Home className="w-5 h-5" />
            Dashboard
          </SidebarLink>
          <SidebarLink href="/admin/posts" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-800 hover:text-white transition-colors">
            <FileText className="w-5 h-5" />
            Posts
          </SidebarLink>
          <div className="pl-8 space-y-1">
            <SidebarLink href="/admin/categories" className="flex items-center gap-3 px-3 py-1.5 text-sm rounded-md hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors">
              <FolderTree className="w-4 h-4" />
              Categories
            </SidebarLink>
            <SidebarLink href="/admin/tags" className="flex items-center gap-3 px-3 py-1.5 text-sm rounded-md hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors">
              <Tags className="w-4 h-4" />
              Tags
            </SidebarLink>
          </div>
          <SidebarLink href="/admin/pages" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-800 hover:text-white transition-colors">
            <LayoutTemplate className="w-5 h-5" />
            Pages
          </SidebarLink>
          {customPostTypes.map((pt: any) => (
            <SidebarLink key={pt.id} href={`/admin/posts?type=${pt.slug}`} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-800 hover:text-white transition-colors">
              <DynamicIcon name={pt.icon} className="w-5 h-5" />
              {pt.name}
            </SidebarLink>
          ))}
          <SidebarLink href="/admin/media" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-800 hover:text-white transition-colors">
            <Image className="w-5 h-5" />
            Media
          </SidebarLink>
          {isAdmin && (
            <>
              <div className="pt-6 pb-2">
                <p className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Appearance</p>
              </div>
              <SidebarLink href="/admin/themes" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-800 hover:text-white transition-colors">
                <LayoutTemplate className="w-5 h-5" />
                Themes
              </SidebarLink>
              <SidebarLink href="/admin/menus" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-800 hover:text-white transition-colors">
                <LayoutTemplate className="w-5 h-5" />
                Menus
              </SidebarLink>
              <SidebarLink href="/admin/plugins" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-800 hover:text-white transition-colors">
                <Puzzle className="w-5 h-5" />
                Plugins
              </SidebarLink>

              {pluginMenus.length > 0 && (
                <>
                  <div className="pt-6 pb-2">
                    <p className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Installed Plugins</p>
                  </div>
                  {pluginMenus.map(menu => (
                    <SidebarLink key={menu.slug} href={menu.route} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-800 hover:text-white transition-colors">
                      <DynamicIcon name={menu.icon} className="w-5 h-5" />
                      {menu.label}
                    </SidebarLink>
                  ))}
                </>
              )}

              <div className="pt-6 pb-2">
                <p className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">System</p>
              </div>
              <SidebarLink href="/admin/post-types" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-800 hover:text-white transition-colors">
                <Database className="w-5 h-5" />
                Post Types
              </SidebarLink>
              <SidebarLink href="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-800 hover:text-white transition-colors">
                <Users className="w-5 h-5" />
                Users
              </SidebarLink>
              <SidebarLink href="/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-800 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
                Settings
              </SidebarLink>
            </>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-medium text-neutral-800">Welcome back, Admin</h2>
          <div className="flex items-center gap-6">
            <Link href="/" target="_blank" className="text-sm font-medium text-blue-600 hover:underline">
              View Live Site &rarr;
            </Link>
            <form action={async () => {
              'use server';
              await signOut({ redirectTo: '/admin/login' });
            }}>
              <button type="submit" className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </form>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
      <Toaster position="top-center" theme="system" />
    </div>
  );
}
