export async function fetchGithubAuthor(packageName: string, defaultAuthor: string) {
  try {
    const token = process.env.GITHUB_PUBLISH_TOKEN || process.env.GITHUB_MARKETPLACE_TOKEN;
    if (token) {
      const res = await fetch(`https://npm.pkg.github.com/${packageName}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        next: { revalidate: 3600 }
      });
      if (res.ok) {
        const data = await res.json();
        if (data?._npmUser?.name) {
          return data._npmUser.name;
        } else if (data?.author?.name) {
          return data.author.name;
        }
      }
    }
  } catch (e) {
    console.error('Failed to fetch real author from github:', e);
  }
  return defaultAuthor;
}
