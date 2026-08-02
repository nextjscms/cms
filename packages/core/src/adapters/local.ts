import fs from 'fs/promises';
import path from 'path';
import { StorageAdapter } from './storage';

export class LocalStorageAdapter implements StorageAdapter {
  private uploadDir: string;

  constructor() {
    // In a Next.js app, public folder is served statically.
    // We save files to public/uploads
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
  }

  async upload(file: Buffer, filename: string, mimeType: string): Promise<string> {
    // Ensure the upload directory exists
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }

    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9.\-_]/g, '');
    const uniqueFilename = `${Date.now()}-${safeFilename}`;
    const filePath = path.join(this.uploadDir, uniqueFilename);

    await fs.writeFile(filePath, file);

    // Return the public URL path
    return `/uploads/${uniqueFilename}`;
  }

  async delete(url: string): Promise<void> {
    if (!url.startsWith('/uploads/')) return;
    const filename = url.replace('/uploads/', '');
    const safeFilename = path.basename(filename);
    const filePath = path.join(this.uploadDir, safeFilename);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete file: ${filePath}`, error);
    }
  }
}
