import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import util from 'util';
import * as tar from 'tar';

const execPromise = util.promisify(exec);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const type = formData.get('type') as string;
    const file = formData.get('file') as File;
    const imageUrl = formData.get('imageUrl') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > 4.5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 4.5MB limit' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create temporary paths
    const tmpDir = os.tmpdir();
    const timestamp = Date.now();
    const tarPath = path.join(tmpDir, `theme-${timestamp}.tgz`);
    const extractDir = path.join(tmpDir, `extracted-${timestamp}`);
    
    fs.mkdirSync(extractDir, { recursive: true });
    fs.writeFileSync(tarPath, buffer);

    // Extract package.json to read metadata
    await tar.x({
      file: tarPath,
      cwd: extractDir,
      filter: (path) => path === 'package/package.json'
    });

    const packageJsonPath = path.join(extractDir, 'package', 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found in the uploaded archive. Make sure it is a valid npm package.');
    }

    const pkgData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const { name, version, description, author } = pkgData;

    if (!name || !version) {
      throw new Error('package.json must contain a "name" and "version" field.');
    }

    // Prepare GitHub Packages auth
    const GITHUB_PUBLISH_TOKEN = process.env.GITHUB_PUBLISH_TOKEN;
    if (!GITHUB_PUBLISH_TOKEN) {
      throw new Error('GITHUB_PUBLISH_TOKEN environment variable is not configured on the server.');
    }

    const npmrcPath = path.join(tmpDir, `.npmrc-${timestamp}`);
    const npmrcContent = `//npm.pkg.github.com/:_authToken=${GITHUB_PUBLISH_TOKEN}\n@nextjscms:registry=https://npm.pkg.github.com`;
    fs.writeFileSync(npmrcPath, npmrcContent);

    // Run npm publish
    try {
      await execPromise(`npm publish ${tarPath} --userconfig=${npmrcPath}`);
    } catch (publishError: any) {
      console.error('Publish error:', publishError.stdout, publishError.stderr);
      throw new Error(`Failed to publish to GitHub Packages: ${publishError.message}`);
    } finally {
      // Cleanup
      try {
        fs.unlinkSync(npmrcPath);
        fs.unlinkSync(tarPath);
        fs.rmSync(extractDir, { recursive: true, force: true });
      } catch(e) {}
    }

    // Update Neon Database
    const dbUrl = process.env.MARKETPLACE_DB_URL;
    if (dbUrl) {
      const sql = neon(dbUrl);
      const slug = name.replace('@nextjscms/', '').replace('theme-', '').replace('plugin-', '');
      const downloadUrl = `https://npm.pkg.github.com/${name}/-/${name.split('/')[1]}-${version}.tgz`;
      
      const authorStr = typeof author === 'string' ? author : (author?.name || 'Unknown');

      if (type === 'theme') {
        await sql`
          INSERT INTO marketplace_themes (slug, name, description, image_url, version, author, download_url, updated_at)
          VALUES (${slug}, ${name}, ${description || ''}, ${imageUrl}, ${version}, ${authorStr}, ${downloadUrl}, NOW())
          ON CONFLICT (slug) DO UPDATE SET
            version = EXCLUDED.version,
            description = EXCLUDED.description,
            image_url = EXCLUDED.image_url,
            author = EXCLUDED.author,
            download_url = EXCLUDED.download_url,
            updated_at = NOW()
        `;
      } else {
        await sql`
          INSERT INTO marketplace_plugins (slug, name, description, image_url, version, author, download_url, updated_at)
          VALUES (${slug}, ${name}, ${description || ''}, ${imageUrl}, ${version}, ${authorStr}, ${downloadUrl}, NOW())
          ON CONFLICT (slug) DO UPDATE SET
            version = EXCLUDED.version,
            description = EXCLUDED.description,
            image_url = EXCLUDED.image_url,
            author = EXCLUDED.author,
            download_url = EXCLUDED.download_url,
            updated_at = NOW()
        `;
      }
    }

    return NextResponse.json({ 
 
      success: true, 
      name, 
      version 
    });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
