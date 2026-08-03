import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const token = process.env.GITHUB_MARKETPLACE_TOKEN;

  const { searchParams } = new URL(request.url);
  const downloadUrl = searchParams.get('url');

  if (!downloadUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let finalDownloadUrl = downloadUrl;

  try {
    const headers: Record<string, string> = {};
    if (token && finalDownloadUrl.includes('github.com')) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`Fetching core tarball from: ${finalDownloadUrl}`);
    const downloadRes = await fetch(finalDownloadUrl, {
      method: 'GET',
      headers,
      redirect: 'manual'
    });

    if (downloadRes.status >= 300 && downloadRes.status < 400) {
      const location = downloadRes.headers.get('location');
      if (location) {
        console.log('Redirecting client securely to blob storage...');
        return NextResponse.redirect(location);
      }
    }

    return new NextResponse(downloadRes.body, {
      status: downloadRes.status,
      headers: {
        'Content-Type': downloadRes.headers.get('Content-Type') || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err: any) {
    console.error('Proxy Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
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
