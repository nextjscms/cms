import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getStorageAdapter } from '@/adapters/storage-registry';
import { getDatabaseAdapter } from '@/lib/registry';
import { media } from '@/db/schema';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('Database URL is not set');
    
    const adapter = getDatabaseAdapter(process.env.DATABASE_PROVIDER as any);
    const db = adapter.getDb(dbUrl);
    const { eq } = await import('drizzle-orm');

    await db.update(media).set({
      altText: body.altText
    }).where(eq(media.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update media error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('Database URL is not set');
    
    const adapter = getDatabaseAdapter(process.env.DATABASE_PROVIDER as any);
    const db = adapter.getDb(dbUrl);
    const { eq } = await import('drizzle-orm');

    // Fetch the media record first to get the URL
    const records = await db.select().from(media).where(eq(media.id, parseInt(id)));
    if (records.length === 0) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }
    
    const mediaItem = records[0];

    // Attempt to delete from S3/R2
    try {
      // Use the driver that was originally used to upload this file. 
      // Fallback to undefined (which will use current active driver) if it's an old record without a driver.
      const storageAdapter = await getStorageAdapter(db, mediaItem.driver || undefined);
      const urlsToDelete = new Set<string>();
      if (mediaItem.url) urlsToDelete.add(mediaItem.url);

      if (mediaItem.sizes) {
        const sizes = mediaItem.sizes as Record<string, string>;
        Object.values(sizes).forEach(url => {
          if (typeof url === 'string') urlsToDelete.add(url);
        });
      }

      const deletePromises = Array.from(urlsToDelete).map(async (url) => {
        try {
          const parts = url.split('/');
          const key = parts.pop();
          if (key) {
            await storageAdapter.delete(key);
          }
        } catch (e) {
          console.error(`Failed to delete file ${url} from storage driver:`, e);
        }
      });
      await Promise.all(deletePromises);
    } catch (e) {
      console.error('Failed to init storage driver for deletion:', e);
      // We log but continue, because we still want to delete from the DB even if S3 fails 
      // (e.g. if the file is already gone or credentials changed)
    }

    // Delete from database
    await db.delete(media).where(eq(media.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete media error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
