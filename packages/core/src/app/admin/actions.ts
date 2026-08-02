'use server';

import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import * as tar from 'tar';
import { Readable } from 'stream';

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
