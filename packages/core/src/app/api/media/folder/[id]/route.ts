import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDatabaseAdapter } from '@/lib/registry';
import { mediaFolders, media } from '@/db/schema';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('Database URL is not set');
    
    const adapter = getDatabaseAdapter(process.env.DATABASE_PROVIDER as any);
    const db = adapter.getDb(dbUrl);
    const { eq } = await import('drizzle-orm');

    await db.update(mediaFolders).set({
      name: body.name.trim()
    }).where(eq(mediaFolders.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update folder error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const folderId = parseInt(id);
    
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('Database URL is not set');
    
    const adapter = getDatabaseAdapter(process.env.DATABASE_PROVIDER as any);
    const db = adapter.getDb(dbUrl);
    const { eq } = await import('drizzle-orm');

    // Check if folder is empty (no subfolders, no media files)
    const subfolders = await db.select({ id: mediaFolders.id }).from(mediaFolders).where(eq(mediaFolders.parentId, folderId)).limit(1);
    if (subfolders.length > 0) {
      return NextResponse.json({ error: 'Cannot delete folder because it contains subfolders.' }, { status: 400 });
    }
    
    const files = await db.select({ id: media.id }).from(media).where(eq(media.folderId, folderId)).limit(1);
    if (files.length > 0) {
      return NextResponse.json({ error: 'Cannot delete folder because it contains files.' }, { status: 400 });
    }

    // Delete from database
    await db.delete(mediaFolders).where(eq(mediaFolders.id, folderId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete folder error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
