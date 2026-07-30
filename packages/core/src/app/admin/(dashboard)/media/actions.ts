'use server'

import { getStorageAdapter } from '@/lib/registry';

export async function uploadMediaAction(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) return { success: false, error: 'No file provided' };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = getStorageAdapter();
    
    // In a real application, we would save the returned URL to a `media` table in the database
    // so we can display all previously uploaded media in the library grid.
    const url = await storage.upload(buffer, file.name, file.type);
    
    return { success: true, url };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
