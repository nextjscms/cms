'use server';

import { getDb } from '@/db';
import { users, settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function hasExistingUsers() {
  try {
    const db = getDb();
    const existingUsers = await db.select().from(users).limit(1);
    return existingUsers.length > 0;
  } catch (error: any) {
    const errorStr = error.message + ' ' + (error.cause ? String(error.cause) : '');
    if (errorStr.includes('relation "users" does not exist') || errorStr.includes('does not exist')) {
      return false;
    }
    throw error;
  }
}

export async function createFirstAdmin(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  if (!email || !password || !name) {
    throw new Error('All fields are required');
  }

  const db = getDb();
  const existingUsers = await db.select().from(users).limit(1);
  
  if (existingUsers.length > 0) {
    throw new Error('An admin user already exists. Setup cannot continue.');
  }

  // Hash the provided password using the same Web Crypto API as auth.ts
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  const hashedPassword = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
    role: 'admin',
    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
  });

  return { success: true };
}

export async function saveGitOpsToken(token: string, owner: string, repo: string, rootDir?: string, branch?: string) {
  const db = getDb();
  
  const settingsData: any = {
    githubToken: token,
    githubOwner: owner,
    githubRepo: repo,
  };
  if (rootDir !== undefined) {
    settingsData.rootDir = rootDir;
  }
  if (branch) {
    settingsData.branch = branch;
  }

  const stringified = JSON.stringify(settingsData);

  const existing = await db.select().from(settings).where(eq(settings.key, 'gitops_settings'));
  if (existing.length > 0) {
    await db.update(settings).set({ value: stringified }).where(eq(settings.key, 'gitops_settings'));
  } else {
    await db.insert(settings).values({ key: 'gitops_settings', value: stringified });
  }

  revalidatePath('/admin');
  return { success: true };
}

export async function checkAppInstallation(owner: string, repo: string) {
  try {
    const db = getDb();
    const existing = await db.select().from(settings).where(eq(settings.key, 'gitops_settings'));
    if (existing.length === 0 || !existing[0].value) {
      return { installed: false, error: 'No GitHub token found' };
    }
    
    const settingsData = JSON.parse(existing[0].value);
    const token = settingsData.githubToken;
    if (!token) return { installed: false, error: 'No GitHub token found' };

    const url = `https://api.github.com/repos/${owner}/${repo}/installation`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'NextjsCMS-GitOps',
      },
      cache: 'no-store'
    });
    
    if (response.status === 200) {
      return { installed: true };
    } else if (response.status === 404) {
      return { installed: false };
    }
    return { installed: false, error: `GitHub API returned ${response.status}` };
  } catch (error: any) {
    return { installed: false, error: String(error) };
  }
}
