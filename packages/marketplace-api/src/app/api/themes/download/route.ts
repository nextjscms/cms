import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const token = process.env.GITHUB_MARKETPLACE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Marketplace token not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const downloadUrl = searchParams.get('url');
  const version = searchParams.get('version');

  if (!downloadUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let finalDownloadUrl = downloadUrl;

  try {
    // 1. Resolve true tarball URL for GitHub Packages
    if (downloadUrl.includes('npm.pkg.github.com') && version && !downloadUrl.includes('/download/')) {
      const match = downloadUrl.match(/(@[^\/]+\/[^\/]+)/);
      const packageName = match ? match[1] : '';
      if (packageName) {
        const registryUrl = `https://npm.pkg.github.com/${packageName}`;
        console.log(`Resolving true tarball for ${registryUrl} version ${version}...`);
        
        const metadataRes = await fetch(registryUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (metadataRes.ok) {
          const metadata = await metadataRes.json();
          if (metadata.versions && metadata.versions[version] && metadata.versions[version].dist) {
            finalDownloadUrl = metadata.versions[version].dist.tarball;
          }
        }
      }
    }

    // 2. We have the exact tarball URL. Now we fetch it with redirect: manual
    console.log(`Fetching tarball from: ${finalDownloadUrl}`);
    const downloadRes = await fetch(finalDownloadUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      },
      redirect: 'manual'
    });

    // 3. Handle GitHub's redirect to AWS S3 (or wherever the blob is stored)
    if (downloadRes.status >= 300 && downloadRes.status < 400) {
      const location = downloadRes.headers.get('location');
      if (location) {
        console.log('Redirecting client securely to S3 Blob...');
        // We redirect the client to the S3 URL. S3 doesn't require our Auth token because it uses a presigned URL!
        return NextResponse.redirect(location);
      }
    }

    // If it didn't redirect (e.g. regular file download) we proxy the stream
    return new NextResponse(downloadRes.body, {
      status: downloadRes.status,
      headers: {
        'Content-Type': downloadRes.headers.get('Content-Type') || 'application/octet-stream'
      }
    });

  } catch (err: any) {
    console.error('Proxy Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
