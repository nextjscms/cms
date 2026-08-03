import { getDb } from '@/db';
import { settings as settingsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getGitOpsSettings() {
  try {
    const db = getDb();
    const settingsRows = await db.select().from(settingsTable).where(eq(settingsTable.key, 'gitops_settings'));
    if (settingsRows.length === 0 || !settingsRows[0].value) return null;
    return JSON.parse(settingsRows[0].value);
  } catch (error: any) {
    if (error.message?.includes('relation "settings" does not exist') || error.message?.includes('does not exist')) {
      return null;
    }
    return null;
  }
}

async function githubApi(endpoint: string, options: RequestInit, token: string) {
  const url = `https://api.github.com${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${errorBody}`);
  }
  return response.json();
}

export async function createGithubCommit(files: { path: string, content: Buffer }[], message: string, settings: any) {
  const { githubToken, githubOwner, githubRepo, branch = 'master' } = settings; // default to master or main
  const actualBranch = branch || 'master';
  const basePath = `/repos/${githubOwner}/${githubRepo}`;

  console.log(`Starting GitHub Commit: ${message}`);

  // 1. Get branch info
  const ref = await githubApi(`${basePath}/git/ref/heads/${actualBranch}`, {}, githubToken);
  const commitSha = ref.object.sha;
  
  // 2. Get commit info
  const commit = await githubApi(`${basePath}/git/commits/${commitSha}`, {}, githubToken);
  const treeSha = commit.tree.sha;

  // 3. Create Blobs for each file
  const treeItems = [];
  for (const file of files) {
    console.log(`Creating Blob for ${file.path}`);
    const blobRes = await githubApi(`${basePath}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({
        content: file.content.toString('base64'),
        encoding: 'base64',
      })
    }, githubToken);
    
    treeItems.push({
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: blobRes.sha,
    });
  }

  // 4. Create new Tree
  console.log(`Creating new Tree`);
  const newTree = await githubApi(`${basePath}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: treeSha,
      tree: treeItems,
    })
  }, githubToken);

  // 5. Create new Commit
  console.log(`Creating new Commit`);
  const newCommit = await githubApi(`${basePath}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message: message,
      tree: newTree.sha,
      parents: [commitSha],
    })
  }, githubToken);

  // 6. Update Branch Reference
  console.log(`Updating Ref to ${newCommit.sha}`);
  await githubApi(`${basePath}/git/refs/heads/${actualBranch}`, {
    method: 'PATCH',
    body: JSON.stringify({
      sha: newCommit.sha,
      force: false,
    })
  }, githubToken);

  console.log(`GitHub Commit Successful!`);
}

import tar from 'tar-stream';
import zlib from 'zlib';
import { Readable } from 'stream';

export async function extractTarballToMemoryAndCommit(
  responseBody: any, 
  targetPrefix: string, 
  commitMessage: string, 
  settings: any
) {
  const extract = tar.extract();
  const files: { path: string, content: Buffer }[] = [];

  extract.on('entry', (header, stream, next) => {
    const chunks: Buffer[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => {
      // Strip the first directory (e.g. package/)
      const parts = header.name.split('/');
      parts.shift();
      const cleanPath = parts.join('/');
      
      if (cleanPath && header.type === 'file') {
        files.push({
          path: `${targetPrefix}/${cleanPath}`,
          content: Buffer.concat(chunks),
        });
      }
      next();
    });
  });

  const bodyStream = Readable.fromWeb(responseBody);
  
  await new Promise((resolve, reject) => {
    bodyStream
      .pipe(zlib.createGunzip())
      .pipe(extract)
      .on('finish', resolve)
      .on('error', reject);
  });

  await createGithubCommit(files, commitMessage, settings);
}
