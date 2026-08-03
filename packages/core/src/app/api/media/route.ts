import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getStorageAdapter, getActiveStorageDriver } from '@/adapters/storage-registry';
import { getDatabaseAdapter } from '@/lib/registry';
import { media, mediaFolders } from '@/db/schema';
import crypto from 'crypto';
import sharp from 'sharp';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const altText = formData.get('altText') as string | null;
    const folderIdStr = formData.get('folderId') as string | null;
    const folderId = folderIdStr ? parseInt(folderIdStr) : null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalFilename = file.name;
    const mimeType = file.type;
    const size = file.size;

    // Generate unique filename to avoid collisions
    const fileExtension = originalFilename.split('.').pop();
    const uniqueFilename = `${crypto.randomUUID()}-${Date.now()}.${fileExtension}`;

    // Database connection
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('Database URL is not set');
    }

    const adapter = getDatabaseAdapter(process.env.DATABASE_PROVIDER as any);
    const db = adapter.getDb(dbUrl);

    // Get storage adapter dynamically based on DB settings
    const activeDriver = await getActiveStorageDriver(db);
    const storageAdapter = await getStorageAdapter(db, activeDriver);

    let primaryUrl: string;
    let primaryMimeType = mimeType;
    let primarySize = size;
    let sizesJson: Record<string, string> | null = null;

    // For images: generate optimized WebP sizes, skip storing the original
    if (mimeType.startsWith('image/') && !mimeType.includes('svg') && !mimeType.includes('gif')) {
      try {
        const image = sharp(buffer);
        const metadata = await image.metadata();
        sizesJson = {};

        // 1. Generate all sizes concurrently
        const largeWidth = (metadata.width && metadata.width > 1920) ? 1920 : null;
        const [thumbBuffer, mediumBuffer, largeBuffer] = await Promise.all([
          image.clone().resize(300, 300, { fit: 'cover' }).webp({ quality: 80 }).toBuffer(),
          (metadata.width && metadata.width > 300) 
            ? image.clone().resize(768, null, { withoutEnlargement: true }).webp({ quality: 80 }).toBuffer() 
            : Promise.resolve(null),
          image.clone().resize(largeWidth, null, { withoutEnlargement: true }).webp({ quality: 85 }).toBuffer()
        ]);

        const baseName = uniqueFilename.replace(/\.[^/.]+$/, "");
        
        // 2. Upload all buffers concurrently
        const uploadPromises = [
          storageAdapter.upload(thumbBuffer, `${baseName}-thumb.webp`, 'image/webp'),
          mediumBuffer ? storageAdapter.upload(mediumBuffer, `${baseName}-medium.webp`, 'image/webp') : Promise.resolve(null),
          storageAdapter.upload(largeBuffer, `${baseName}-large.webp`, 'image/webp')
        ];

        const [thumbUrl, mediumUrl, largeUrl] = await Promise.all(uploadPromises);

        sizesJson.thumbnail = thumbUrl as string;
        if (mediumUrl) sizesJson.medium = mediumUrl as string;
        sizesJson.large = largeUrl as string;

        primaryUrl = largeUrl as string;
        primaryMimeType = 'image/webp';
        primarySize = largeBuffer.length;

      } catch (err) {
        console.error('Failed to generate image sizes, falling back to original upload:', err);
        // Fallback: upload the original if sharp processing fails
        primaryUrl = await storageAdapter.upload(buffer, uniqueFilename, mimeType);
      }
    } else {
      // Non-image files (PDF, video, etc.): upload original as-is
      primaryUrl = await storageAdapter.upload(buffer, uniqueFilename, mimeType);
    }

    await db.insert(media).values({
      filename: originalFilename,
      url: primaryUrl!,
      mimeType: primaryMimeType,
      size: primarySize,
      altText: altText || null,
      sizes: sizesJson,
      driver: activeDriver,
      folderId: folderId,
    });

    return NextResponse.json({ success: true, url: primaryUrl!, filename: originalFilename });
  } catch (error: any) {
    console.error('Media upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('Database URL is not set');
    }

    const adapter = getDatabaseAdapter(process.env.DATABASE_PROVIDER as any);
    const db = adapter.getDb(dbUrl);

    const url = new URL(req.url);
    const parentIdStr = url.searchParams.get('folderId');
    const parentId = parentIdStr ? parseInt(parentIdStr) : null;
    const search = url.searchParams.get('search');
    const type = url.searchParams.get('type');
    const sort = url.searchParams.get('sort');
    const limitStr = url.searchParams.get('limit');
    const offsetStr = url.searchParams.get('offset');

    const limit = limitStr ? parseInt(limitStr) : 50;
    const offset = offsetStr ? parseInt(offsetStr) : 0;

    const { desc, eq, isNull, and, or, ilike, like, asc } = await import('drizzle-orm');
    
    // Build folders condition
    let folderConditions = [];
    if (search) {
      folderConditions.push(ilike(mediaFolders.name, `%${search}%`));
    } else {
      folderConditions.push(parentId ? eq(mediaFolders.parentId, parentId) : isNull(mediaFolders.parentId));
    }
    const folderWhere = folderConditions.length > 0 ? and(...folderConditions) : undefined;
    
    let foldersQuery = db.select().from(mediaFolders) as any;
    if (folderWhere) foldersQuery = foldersQuery.where(folderWhere);
    
    // Sort folders
    if (sort === 'name_asc') {
      foldersQuery = foldersQuery.orderBy(asc(mediaFolders.name));
    } else {
      foldersQuery = foldersQuery.orderBy(desc(mediaFolders.createdAt));
    }

    // Only return folders on the first page of results to avoid duplicating them during infinite scroll
    let finalFolders = [];
    if (offset === 0) {
      finalFolders = await foldersQuery;
    }

    // Build media conditions
    let mediaConditions = [];
    if (search) {
      mediaConditions.push(
        or(
          ilike(media.filename, `%${search}%`), 
          ilike(media.altText, `%${search}%`)
        )
      );
    } else {
      mediaConditions.push(parentId ? eq(media.folderId, parentId) : isNull(media.folderId));
    }

    if (type === 'image') {
      mediaConditions.push(like(media.mimeType, 'image/%'));
    } else if (type === 'document') {
      mediaConditions.push(or(
        like(media.mimeType, 'application/pdf'),
        like(media.mimeType, 'application/msword'),
        like(media.mimeType, 'text/%')
      ));
    } else if (type === 'video') {
      mediaConditions.push(like(media.mimeType, 'video/%'));
    }

    const mediaWhere = mediaConditions.length > 0 ? and(...mediaConditions) : undefined;
    
    let mediaQuery = db.select().from(media) as any;
    if (mediaWhere) mediaQuery = mediaQuery.where(mediaWhere);
    
    // Sort media
    if (sort === 'name_asc') {
      mediaQuery = mediaQuery.orderBy(asc(media.filename));
    } else if (sort === 'size_desc') {
      mediaQuery = mediaQuery.orderBy(desc(media.size));
    } else if (sort === 'createdAt_asc') {
      mediaQuery = mediaQuery.orderBy(asc(media.createdAt));
    } else {
      mediaQuery = mediaQuery.orderBy(desc(media.createdAt));
    }

    mediaQuery = mediaQuery.limit(limit).offset(offset);

    const mediaFiles = await mediaQuery;

    return NextResponse.json({ folders: finalFolders, media: mediaFiles });
  } catch (error: any) {
    console.error('Media fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('Database URL is not set');

    const adapter = getDatabaseAdapter(process.env.DATABASE_PROVIDER as any);
    const db = adapter.getDb(dbUrl);
    const { inArray } = await import('drizzle-orm');

    // Fetch media records to get their URLs
    const records = await db.select().from(media).where(inArray(media.id, ids));

    // Delete from storage
    for (const record of records) {
      const driver = record.driver || undefined;
      const storageAdapter = await getStorageAdapter(db, driver);

      const urlsToDelete = new Set<string>();
      if (record.url) urlsToDelete.add(record.url);
      if (record.sizes) {
        const sizes = record.sizes as Record<string, string>;
        Object.values(sizes).forEach(url => {
          if (typeof url === 'string') urlsToDelete.add(url);
        });
      }

      for (const url of Array.from(urlsToDelete)) {
        try {
          const parts = url.split('/');
          const key = parts.pop();
          if (key) {
            await storageAdapter.delete(key);
          }
        } catch (e) {
          console.error(`Failed to delete file ${url} from storage`, e);
        }
      }
    }

    // Delete from database
    await db.delete(media).where(inArray(media.id, ids));

    return NextResponse.json({ success: true, count: records.length });
  } catch (error: any) {
    console.error('Bulk delete media error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { ids, targetFolderId } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('Database URL is not set');

    const adapter = getDatabaseAdapter(process.env.DATABASE_PROVIDER as any);
    const db = adapter.getDb(dbUrl);
    const { inArray } = await import('drizzle-orm');

    // Update database
    await db.update(media)
      .set({ folderId: targetFolderId === null ? null : parseInt(targetFolderId) })
      .where(inArray(media.id, ids));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Bulk move media error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
