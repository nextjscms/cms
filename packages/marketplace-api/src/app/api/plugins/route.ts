import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const dbUrl = process.env.MARKETPLACE_DB_URL;
  if (!dbUrl) {
    return NextResponse.json(
      { error: 'Marketplace DB URL is not configured' },
      { status: 500 }
    );
  }

  const sql = neon(dbUrl);
  
  // Extract pagination parameters
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('per_page') || '50', 10);
  const searchQuery = searchParams.get('q');
  
  const offset = (page - 1) * perPage;

  try {
    let rows;
    
    if (searchQuery) {
      // Use ILIKE for case-insensitive search in name or description
      const searchPattern = `%${searchQuery}%`;
      rows = await sql`
        SELECT * FROM marketplace_plugins 
        WHERE name ILIKE ${searchPattern} OR description ILIKE ${searchPattern}
        ORDER BY updated_at DESC
        LIMIT ${perPage} OFFSET ${offset}
      `;
    } else {
      rows = await sql`
        SELECT * FROM marketplace_plugins 
        ORDER BY updated_at DESC
        LIMIT ${perPage} OFFSET ${offset}
      `;
    }

    // Map database structure to the clean Marketplace structure expected by UI
    const plugins = rows.map((row) => {
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description || 'No description provided.',
        imageUrl: row.image_url,
        version: row.version,
        author: row.author,
        category: row.category,
        totalDownloads: row.total_downloads,
        url: row.download_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    // Add CORS headers since this will be called from a different domain/port
    return NextResponse.json({ plugins }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      }
    });
  } catch (error) {
    console.error('Error querying Neon DB:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plugins from Marketplace Registry' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }
  });
}
