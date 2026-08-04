'use server';

import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import * as tar from 'tar';
import { Readable } from 'stream';
import { auth } from '@/auth';
import { getGitOpsSettings, extractTarballToMemoryAndCommit, createGithubCommit } from '@/lib/gitops';
import { nextjscms } from '@/lib/hooks';

export async function getPendingDeployments(): Promise<{ message: string; timestamp: string }[]> {
  const db = getDb();
  const existing = await db.select().from(settings).where(eq(settings.key, 'pending_deployments'));
  if (existing.length > 0 && existing[0].value) {
    try { return JSON.parse(existing[0].value); } catch (e) {}
  }
  return [];
}

async function addPendingDeployment(message: string) {
  const db = getDb();
  const existing = await db.select().from(settings).where(eq(settings.key, 'pending_deployments'));
  let pending = [];
  if (existing.length > 0 && existing[0].value) {
    try { pending = JSON.parse(existing[0].value); } catch (e) {}
  }
  pending.push({ message, timestamp: new Date().toISOString() });
  
  if (existing.length > 0) {
    await db.update(settings).set({ value: JSON.stringify(pending) }).where(eq(settings.key, 'pending_deployments'));
  } else {
    await db.insert(settings).values({ key: 'pending_deployments', value: JSON.stringify(pending) });
  }
}

export async function activateTheme(formData: FormData) {
  const slug = formData.get('themeSlug') as string;
  
  if (slug) {
    const db = getDb();
    const existing = await db.select().from(settings).where(eq(settings.key, 'activeTheme'));
    
    if (existing.length > 0) {
      await db.update(settings).set({ value: slug }).where(eq(settings.key, 'activeTheme'));
    } else {
      await db.insert(settings).values({ key: 'activeTheme', value: slug });
    }
    
    // Revalidate paths to ensure the frontend updates immediately
    revalidatePath('/');
    revalidatePath('/admin/themes');
  }
}

export async function installTheme(slug: string, downloadUrl: string, version?: string) {
  const apiUrl = process.env.NEXT_PUBLIC_MARKETPLACE_API_URL || 'https://nextjscms-api.vercel.app';
  
  // Call the Central API Proxy to securely resolve and proxy the tarball
  const proxyUrl = `${apiUrl}/api/themes/download?url=${encodeURIComponent(downloadUrl)}&version=${version || ''}`;
  console.log(`Downloading theme via proxy: ${proxyUrl}`);
  
  const finalResponse = await fetch(proxyUrl);

  if (!finalResponse.ok) {
    throw new Error(`Failed to download theme tarball from API (${finalResponse.status}): ${finalResponse.statusText}`);
  }

  const gitOpsSettings = await getGitOpsSettings();
  if (gitOpsSettings && gitOpsSettings.githubToken) {
    if (!gitOpsSettings.githubOwner || !gitOpsSettings.githubRepo) {
      throw new Error('GitHub Owner or Repository is not configured. Please reconnect GitHub in the Auto-Installer settings.');
    }
    console.log('GitOps enabled, pushing theme to GitHub');
    
    // Support monorepo root directory prefix
    const rootDirStr = gitOpsSettings.rootDir !== undefined ? gitOpsSettings.rootDir : 'packages/core';
    const rootDirPrefix = rootDirStr ? `${rootDirStr}/` : '';
    const targetPrefix = `${rootDirPrefix}src/themes/${slug}`;
    
    await extractTarballToMemoryAndCommit(finalResponse.body, targetPrefix, `Install NextjsCMS Theme: ${slug} [skip vercel]`, gitOpsSettings);
    await addPendingDeployment(`Installed Theme: ${slug}`);
    revalidatePath('/admin/themes');
    return { success: true };
  }

  // Create the target directory
  const themesDir = path.join(process.cwd(), 'src/themes', slug);
  if (!fs.existsSync(themesDir)) {
    fs.mkdirSync(themesDir, { recursive: true });
  }

  if (finalResponse.body) {
    const stream = Readable.fromWeb(finalResponse.body as any);
    
    // Pipe the download directly into tar extraction
    await new Promise((resolve, reject) => {
      stream
        .pipe(tar.x({
          cwd: themesDir,
          strip: 1, // NPM packs everything inside a `package/` folder, strip it
        }))
        .on('finish', resolve)
        .on('error', reject);
    });

    revalidatePath('/admin/themes');
    return { success: true };
  }
  
  throw new Error('Empty response body');
}

export async function togglePlugin(slug: string, activate: boolean) {
  const db = getDb();
  const existing = await db.select().from(settings).where(eq(settings.key, 'activePlugins'));
  
  let activePlugins: string[] = [];
  if (existing.length > 0 && existing[0].value) {
    try {
      activePlugins = JSON.parse(existing[0].value);
    } catch (e) {}
  }

  if (activate) {
    if (!activePlugins.includes(slug)) activePlugins.push(slug);
  } else {
    activePlugins = activePlugins.filter(p => p !== slug);
  }

  const newValue = JSON.stringify(activePlugins);

  if (existing.length > 0) {
    await db.update(settings).set({ value: newValue }).where(eq(settings.key, 'activePlugins'));
  } else {
    await db.insert(settings).values({ key: 'activePlugins', value: newValue });
  }

  // Regenerate plugin registry
  const registryContent = `// @ts-nocheck
// Auto-generated Plugin Registry
// This file is dynamically overwritten when plugins are toggled in the admin dashboard.
${activePlugins.map((s, i) => `import * as plugin${i} from './${s}';`).join('\n')}

export const PluginUIs: Record<string, any> = {
${activePlugins.map((s, i) => `  '${s}': plugin${i},`).join('\n')}
};
`;

  const gitOpsSettings = await getGitOpsSettings();
  if (gitOpsSettings && gitOpsSettings.githubToken) {
    console.log('GitOps enabled, pushing registry update to GitHub');
    const files = [{
      path: 'src/plugins/registry.ts',
      content: Buffer.from(registryContent, 'utf-8')
    }];
    await createGithubCommit(files, `Toggle NextjsCMS Plugin: ${slug} (${activate ? 'Activate' : 'Deactivate'}) [skip vercel]`, gitOpsSettings);
    await addPendingDeployment(`${activate ? 'Activated' : 'Deactivated'} Plugin: ${slug}`);
    revalidatePath('/admin/plugins');
    return;
  }

  try {
    fs.writeFileSync(path.join(process.cwd(), 'src/plugins/registry.ts'), registryContent);
  } catch (e: any) {
    console.warn('Could not write registry.ts (likely read-only filesystem). Proceeding anyway.', e.message);
  }

  revalidatePath('/admin/plugins');
}

export async function installPlugin(slug: string, downloadUrl: string, version?: string) {
  const apiUrl = process.env.NEXT_PUBLIC_MARKETPLACE_API_URL || 'https://nextjscms-api.vercel.app';
  
  const proxyUrl = `${apiUrl}/api/plugins/download?url=${encodeURIComponent(downloadUrl)}&version=${version || ''}`;
  console.log(`Downloading plugin via proxy: ${proxyUrl}`);
  
  const finalResponse = await fetch(proxyUrl);

  if (!finalResponse.ok) {
    throw new Error(`Failed to download plugin tarball from API (${finalResponse.status}): ${finalResponse.statusText}`);
  }

  const gitOpsSettings = await getGitOpsSettings();
  if (gitOpsSettings && gitOpsSettings.githubToken) {
    console.log('GitOps enabled, pushing plugin to GitHub');
    await extractTarballToMemoryAndCommit(finalResponse.body, `src/plugins/${slug}`, `Install NextjsCMS Plugin: ${slug} [skip vercel]`, gitOpsSettings);
    await addPendingDeployment(`Installed Plugin: ${slug}`);
    revalidatePath('/admin/plugins');
    return { success: true };
  }

  const pluginsDir = path.join(process.cwd(), 'src/plugins', slug);
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
  }

  if (finalResponse.body) {
    const stream = Readable.fromWeb(finalResponse.body as any);
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(tar.x({
          cwd: pluginsDir,
          strip: 1,
        }))
        .on('finish', resolve)
        .on('error', reject);
    });

    revalidatePath('/admin/plugins');
    return { success: true };
  }
  
  throw new Error('Empty response body');
}



export async function getHiddenSidebarPlugins(): Promise<string[]> {
  const db = getDb();
  const existingRows = await db.select().from(settings).where(eq(settings.key, 'hiddenSidebarPlugins'));
  if (existingRows.length > 0 && existingRows[0].value) {
    try {
      return JSON.parse(existingRows[0].value);
    } catch (e) {
      return [];
    }
  }
  return [];
}

export async function toggleSidebarVisibility(slug: string, isHidden: boolean) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  const db = getDb();
  const existingRows = await db.select().from(settings).where(eq(settings.key, 'hiddenSidebarPlugins'));
  
  let hiddenPlugins: string[] = [];
  if (existingRows.length > 0 && existingRows[0].value) {
    try { hiddenPlugins = JSON.parse(existingRows[0].value); } catch(e) {}
  }

  if (isHidden) {
    if (!hiddenPlugins.includes(slug)) hiddenPlugins.push(slug);
  } else {
    hiddenPlugins = hiddenPlugins.filter(p => p !== slug);
  }

  const newValue = JSON.stringify(hiddenPlugins);

  if (existingRows.length > 0) {
    await db.update(settings).set({ value: newValue }).where(eq(settings.key, 'hiddenSidebarPlugins'));
  } else {
    await db.insert(settings).values({ key: 'hiddenSidebarPlugins', value: newValue });
  }

  revalidatePath('/admin');
}

export async function triggerVercelBuild() {
  const gitOpsSettings = await getGitOpsSettings();
  if (gitOpsSettings && gitOpsSettings.githubToken) {
    console.log('Triggering manual Vercel build via dummy commit');
    const files = [{
      path: '.vercel-trigger',
      content: Buffer.from(new Date().toISOString(), 'utf-8')
    }];
    await createGithubCommit(files, 'Trigger Vercel Build (Manual Deployment)', gitOpsSettings);
    
    // Clear pending deployments
    const db = getDb();
    const existing = await db.select().from(settings).where(eq(settings.key, 'pending_deployments'));
    if (existing.length > 0) {
      await db.update(settings).set({ value: JSON.stringify([]) }).where(eq(settings.key, 'pending_deployments'));
    }
    
    return { success: true };
  }
  throw new Error('GitOps is not configured.');
}

export async function updateCore(downloadUrl: string, version: string) {
  const apiUrl = process.env.NEXT_PUBLIC_MARKETPLACE_API_URL || 'https://nextjscms-api.vercel.app';
  
  const proxyUrl = `${apiUrl}/api/core/download?url=${encodeURIComponent(downloadUrl)}&version=${version || ''}`;
  console.log(`Downloading core update via proxy: ${proxyUrl}`);
  
  const finalResponse = await fetch(proxyUrl);

  if (!finalResponse.ok) {
    throw new Error(`Failed to download core update tarball from API (${finalResponse.status}): ${finalResponse.statusText}`);
  }

  const gitOpsSettings = await getGitOpsSettings();
  if (gitOpsSettings && gitOpsSettings.githubToken) {
    if (!gitOpsSettings.githubOwner || !gitOpsSettings.githubRepo) {
      throw new Error('GitHub Owner or Repository is not configured.');
    }
    console.log('GitOps enabled, pushing core update to GitHub');
    
    const rootDirStr = gitOpsSettings.rootDir !== undefined ? gitOpsSettings.rootDir : 'packages/core';
    const rootDirPrefix = rootDirStr ? `${rootDirStr}/` : '';
    
    const excludeFilter = (filePath: string) => {
       if (filePath.startsWith(`${rootDirPrefix}src/themes/`) || filePath.startsWith(`${rootDirPrefix}src/plugins/`)) {
         return true;
       }
       return false;
    };
    
    await extractTarballToMemoryAndCommit(
      finalResponse.body, 
      '', // targetPrefix is empty so it doesn't double-nest the extracted paths
      `Update NextjsCMS Core to v${version} [skip vercel]`, 
      gitOpsSettings,
      excludeFilter
    );
    
    await addPendingDeployment(`Updated Core to v${version}`);
    return { success: true };
  }
  
  throw new Error('GitOps is required to update the core in this environment.');
}
