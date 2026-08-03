
import tar from 'tar-stream';
import zlib from 'zlib';
import { Readable } from 'stream';

async function run() {
  const url = 'https://nextjscms-api.vercel.app/api/themes/download?url=https%3A%2F%2Fnpm.pkg.github.com%2F%40nextjscms%2Ftheme-nextjscmstheme%2F-%2Ftheme-nextjscmstheme-1.0.0.tgz&version=1.0.0';
  console.log('Fetching', url);
  
  const finalResponse = await fetch(url);
  if (!finalResponse.ok) {
    console.error('Fetch failed', finalResponse.status, finalResponse.statusText);
    return;
  }
  
  const extract = tar.extract();
  const files: { path: string }[] = [];
  
  extract.on('entry', (header, stream, next) => {
    const chunks: Buffer[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => {
      console.log('Entry:', header.name, 'Type:', header.type);
      
      const parts = header.name.split('/');
      parts.shift();
      const cleanPath = parts.join('/');
      
      if (cleanPath && header.type === 'file') {
        files.push({ path: cleanPath });
      }
      next();
    });
  });

  const bodyStream = Readable.fromWeb(finalResponse.body as any);
  
  await new Promise((resolve, reject) => {
    bodyStream
      .pipe(zlib.createGunzip())
      .pipe(extract)
      .on('finish', resolve)
      .on('error', reject);
  });
  
  console.log('Extracted files count:', files.length);
  if (files.length > 0) {
    console.log('Sample file:', files[0].path);
  }
}

run().catch(console.error);
