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

async function run() {
  const token = 'fake';
  const owner = 'nextjscms';
  const repo = 'cms';
  
  const basePath = `/repos/${owner}/${repo}`;
  const repoInfo = await githubApi(basePath, {}, token);
  console.log('Default Branch:', repoInfo.default_branch);

  const actualBranch = repoInfo.default_branch || 'main';
  const ref = await githubApi(`${basePath}/git/ref/heads/${actualBranch}`, {}, token);
  console.log('Ref SHA:', ref.object.sha);
}

run().catch(console.error);
