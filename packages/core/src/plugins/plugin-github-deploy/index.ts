import { nextjscms } from '@/lib/hooks';
import GithubDeployUI from './GithubDeployUI';
import { getDb } from '@/db';
import { settings as settingsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Readable } from 'stream';
import tar from 'tar-stream';
import zlib from 'zlib';

async function getGithubSettings() {
  const db = getDb();
  const settingsRows = await db.select().from(settingsTable).where(eq(settingsTable.key, 'plugin:plugin-github-deploy'));
  if (settingsRows.length === 0 || !settingsRows[0].value) return null;
  try {
    return JSON.parse(settingsRows[0].value);
  } catch (e) {
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

async function createGithubCommit(files: { path: string, content: Buffer }[], message: string, settings: any) {
  const { githubToken, githubOwner, githubRepo, branch = 'main' } = settings;
  const basePath = `/repos/${githubOwner}/${githubRepo}`;

  console.log(`Starting GitHub Commit: ${message}`);

  // 1. Get branch info
  const ref = await githubApi(`${basePath}/git/ref/heads/${branch}`, {}, githubToken);
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
  await githubApi(`${basePath}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: JSON.stringify({
      sha: newCommit.sha,
      force: false,
    })
  }, githubToken);

  console.log(`GitHub Commit Successful!`);
}

// Register Hook Listeners
if (typeof window === 'undefined') {
  nextjscms.on('installPlugin', async (data) => {
    const settings = await getGithubSettings();
    if (!settings || !settings.githubToken) {
      // Plugin is not configured, fallback to default behavior (local fs)
      return data;
    }

    try {
      console.log(`Intercepting plugin install for ${data.slug} to push to GitHub...`);
      
      const extract = tar.extract();
      const files: { path: string, content: Buffer }[] = [];

      extract.on('entry', (header, stream, next) => {
        const chunks: Buffer[] = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => {
          // GitHub action strips the first directory (e.g. package/) similar to `tar --strip 1`
          const parts = header.name.split('/');
          parts.shift();
          const cleanPath = parts.join('/');
          
          if (cleanPath && header.type === 'file') {
            files.push({
              path: `src/plugins/${data.slug}/${cleanPath}`,
              content: Buffer.concat(chunks),
            });
          }
          next();
        });
      });

      const bodyStream = Readable.fromWeb(data.finalResponse.body as any);
      
      await new Promise((resolve, reject) => {
        bodyStream
          .pipe(zlib.createGunzip())
          .pipe(extract)
          .on('finish', resolve)
          .on('error', reject);
      });

      await createGithubCommit(files, `Install NextjsCMS Plugin: ${data.slug}`, settings);

      data.handled = true;
      return data;
    } catch (e: any) {
      console.error('Failed GitHub deployment for plugin install:', e);
      throw new Error('Failed to deploy to GitHub: ' + e.message);
    }
  });

  nextjscms.on('togglePlugin', async (data) => {
    const settings = await getGithubSettings();
    if (!settings || !settings.githubToken) {
      return data; // Fallback
    }

    try {
      console.log(`Intercepting plugin toggle for ${data.slug} to push to GitHub...`);
      
      // Calculate active plugins based on the new state
      const db = getDb();
      const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, 'activePlugins'));
      
      let activePlugins: string[] = [];
      if (existing.length > 0 && existing[0].value) {
        try {
          activePlugins = JSON.parse(existing[0].value);
        } catch (e) {}
      }

      if (data.activate) {
        if (!activePlugins.includes(data.slug)) activePlugins.push(data.slug);
      } else {
        activePlugins = activePlugins.filter(p => p !== data.slug);
      }

      // Generate registry.ts
      const registryContent = `// @ts-nocheck
// Auto-generated Plugin Registry
// This file is dynamically overwritten when plugins are toggled in the admin dashboard.
${activePlugins.map((s, i) => `import * as plugin${i} from './${s}';`).join('\n')}

export const PluginUIs: Record<string, any> = {
${activePlugins.map((s, i) => `  '${s}': plugin${i},`).join('\n')}
};
`;

      const files = [{
        path: 'src/plugins/registry.ts',
        content: Buffer.from(registryContent, 'utf-8')
      }];

      await createGithubCommit(files, `Toggle NextjsCMS Plugin: ${data.slug} (${data.activate ? 'Activate' : 'Deactivate'})`, settings);

      data.handled = true;
      return data;
    } catch (e: any) {
      console.error('Failed GitHub deployment for plugin toggle:', e);
      throw new Error('Failed to deploy to GitHub: ' + e.message);
    }
  });
}

// We export the custom UI for the OAuth flow
export default function GithubDeployPlugin() {
  return <GithubDeployUI />;
}
