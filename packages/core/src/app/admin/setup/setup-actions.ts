'use server';

import { getDb } from '@/db';
import { users, settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function hasExistingUsers() {
  const db = getDb();
  const existingUsers = await db.select().from(users).limit(1);
  return existingUsers.length > 0;
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

  const hashedPassword = await hash(password, 10);

  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
    role: 'admin',
    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
  });

  return { success: true };
}

export async function saveGitOpsToken(token: string, owner: string, repo: string, branch: string = 'master') {
  const db = getDb();
  
  const settingsData = {
    githubToken: token,
    githubOwner: owner,
    githubRepo: repo,
    branch,
  };

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
