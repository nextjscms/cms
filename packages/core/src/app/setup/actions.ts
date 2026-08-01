'use server'

import { getDatabaseAdapter } from '@/lib/registry';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function testDatabaseConnection(connectionString: string) {
  try {
    const adapter = getDatabaseAdapter();
    const success = await adapter.testConnection(connectionString);
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

export async function runSetupMigrations(dbUrl: string) {
  try {
    const adapter = getDatabaseAdapter();
    await adapter.migrate(dbUrl);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function seedSetupAdmin(dbUrl: string, formData: FormData) {
  try {
    const siteName = formData.get('siteName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // MVP plain-text or basic hashing. In production, use bcrypt/argon2.
    // Drizzle auth adapter might handle this, but we'll do a simple hash for MVP since NextAuth will check it.
    // For MVP, if there's no hashing function available yet, we just store plain text or simple sha256.
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    const adapter = getDatabaseAdapter();
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

export async function finalizeSetup(dbUrl: string, authSecret: string) {
  try {
    const envFileContent = `DATABASE_URL="${dbUrl}"\nAUTH_SECRET="${authSecret}"\n`;
    
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
