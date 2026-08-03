import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour to avoid GitHub API rate limits

export async function GET(request: Request) {
  try {
    const token = process.env.GITHUB_MARKETPLACE_TOKEN;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'NextjsCMS-Marketplace'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('https://api.github.com/repos/nextjscms/cms/releases/latest', { headers });
    
    if (!response.ok) {
      // Fallback if GitHub API fails or no releases exist yet
      console.warn('Failed to fetch latest release from GitHub', await response.text());
      return NextResponse.json({ 
        version: '1.0.0', 
        url: 'https://github.com/nextjscms/cms/archive/refs/heads/master.tar.gz',
        releaseNotes: 'Update to the latest version of NextjsCMS core.'
      }, { headers: getCorsHeaders() });
    }

    const data = await response.json();
    
    // The tag_name is usually "v1.2.3", we strip the "v" if present
    const version = data.tag_name ? data.tag_name.replace(/^v/, '') : '1.0.0';
    const url = data.tarball_url || `https://github.com/nextjscms/cms/archive/refs/tags/${data.tag_name}.tar.gz`;
    const releaseNotes = data.body || 'No release notes provided.';

    return NextResponse.json({ 
      version, 
      url,
      releaseNotes
    }, { headers: getCorsHeaders() });

  } catch (error) {
    console.error('Error fetching core version:', error);
    return NextResponse.json({ 
      version: '1.0.0', 
      url: 'https://github.com/nextjscms/cms/archive/refs/heads/master.tar.gz',
      releaseNotes: 'Could not fetch release notes.'
    }, { headers: getCorsHeaders() });
  }
}

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { headers: getCorsHeaders() });
}
