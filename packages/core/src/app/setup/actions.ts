'use server'

import { getDatabaseAdapter } from '@/lib/registry';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function testDatabaseConnection(dbUrl: string, provider: string) {
  try {
    const adapter = getDatabaseAdapter(provider);
    const success = await adapter.testConnection(dbUrl);
    if (!success) throw new Error("Connection failed");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveSetupConfig(dbUrl: string) {
  try {
    const authSecret = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');
    return { success: true, authSecret };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function runSetupMigrations(dbUrl: string, provider: string) {
  try {
    const adapter = getDatabaseAdapter(provider);
    await adapter.migrate(dbUrl);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function seedSetupAdmin(dbUrl: string, provider: string, formData: FormData) {
  try {
    const siteName = formData.get('siteName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    const adapter = getDatabaseAdapter(provider);
    await adapter.seedAdmin(dbUrl, { siteName, email, passwordHash });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getEnvironmentDetails() {
  return {
    isVercel: !!process.env.VERCEL,
    vercelOwner: process.env.VERCEL_GIT_REPO_OWNER || null,
    vercelSlug: process.env.VERCEL_GIT_REPO_SLUG || null,
  };
}

export async function finalizeSetup(dbUrl: string, provider: string, authSecret: string) {
  try {
    const envFileContent = `DATABASE_URL="${dbUrl}"\nDATABASE_PROVIDER="${provider}"\nAUTH_SECRET="${authSecret}"\n`;
    
    // Attempt local write for local dev, but don't fail if it doesn't work (like on Vercel)
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      fs.appendFileSync(envPath, `\n${envFileContent}`);
    } catch (e) {
      // Ignored
    }

    return { success: true, envFileContent };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
