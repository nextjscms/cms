import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDatabaseAdapter } from '@/lib/registry';
import { mediaFolders } from '@/db/schema';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, parentId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('Database URL is not set');
    }

    const adapter = getDatabaseAdapter(process.env.DATABASE_PROVIDER as any);
    const db = adapter.getDb(dbUrl);
    
    const [newFolder] = await db.insert(mediaFolders).values({
      name,
      parentId: parentId || null,
    }).returning();

    return NextResponse.json({ success: true, folder: newFolder });
  } catch (error: any) {
    console.error('Folder creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
