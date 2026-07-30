import { nextjscms } from '@/lib/hooks';

// This is an example plugin that subscribes to CMS events.

// 1. Intercept before Save
nextjscms.on('beforeSave', async (postData) => {
  console.log('[Plugin: Content Filter] Intercepting beforeSave...');
  
  // Modify the data (e.g., auto-capitalize the title)
  if (postData.title) {
    return {
      ...postData,
      title: postData.title.toUpperCase()
    };
  }
  
  // Return unmodified if no title
  return postData;
});

// 2. Audit log after Save
nextjscms.on('afterSave', async (savedPost) => {
  console.log(`[Plugin: Audit Log] A new post was successfully saved! ID: ${savedPost.id}`);
  // In a real plugin, this could trigger a webhook to Slack or Discord.
});
