import { nextjscms } from '@/lib/hooks';

// This is an internal core plugin that handles Post Revisions.
// It subscribes to the 'afterSave' hook.
// Whenever a post is saved to the database, this hook will fire and create a snapshot in the `post_revisions` table.

nextjscms.on('afterSave', async (savedPost) => {
  console.log(`[Core Plugin: Revisions] Creating snapshot for Post ID: ${savedPost.id}`);
  
  // In a real implementation we would insert into the DB:
  // await db.insert(postRevisions).values({
  //   postId: savedPost.id,
  //   title: savedPost.title,
  //   content: savedPost.content,
  //   meta: savedPost.meta,
  //   authorId: savedPost.authorId,
  // });
  
  // We can also add logic to prune old revisions if there are too many.
  // e.g. Keep only the last 10 revisions.
  
  return savedPost;
});
