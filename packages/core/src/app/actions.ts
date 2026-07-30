'use server'

import { nextjscms } from '@/lib/hooks';

// This function simulates saving a post to a database and firing hooks.
export async function savePostAction(postData: any) {
  console.log('--- Action Started ---');
  console.log('Original Data:', postData);

  // 1. Fire the beforeSave hook (Plugins can validate or modify data)
  const modifiedData = await nextjscms.emit('beforeSave', postData);

  console.log('Data after beforeSave hooks:', modifiedData);

  // 2. Perform the Database operation (Mocked)
  // const savedPost = await db.insert(posts).values(modifiedData).returning();
  const savedPost = {
    ...modifiedData,
    id: Math.floor(Math.random() * 1000), // simulate DB ID generation
    savedAt: new Date().toISOString()
  };

  // 3. Fire the afterSave hook (Plugins can send emails, hit webhooks, audit log)
  await nextjscms.emit('afterSave', savedPost);

  console.log('--- Action Completed ---');
  return { success: true, post: savedPost };
}
