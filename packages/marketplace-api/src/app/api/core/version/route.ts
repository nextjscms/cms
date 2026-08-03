import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // In a production setup, you might fetch this from a database or GitHub Releases
  const latestVersion = process.env.NEXTJSCMS_LATEST_VERSION || '1.0.0';
  // Note: Replace with the actual repository for NextjsCMS
  const downloadUrl = process.env.NEXTJSCMS_DOWNLOAD_URL || 'https://github.com/sopro/nextjscms/archive/refs/heads/main.tar.gz';

  return NextResponse.json({ 
    version: latestVersion, 
    url: downloadUrl 
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }
  });
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }
  });
}
