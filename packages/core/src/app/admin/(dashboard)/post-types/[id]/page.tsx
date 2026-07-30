import { getDb } from '@/db';
import { postTypes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import PostTypeClient from '../PostTypeClient';

export default async function EditPostTypePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);
  
  if (isNaN(id)) {
    notFound();
  }

  const db = getDb();
  const [postType] = await db.select().from(postTypes).where(eq(postTypes.id, id));

  if (!postType) {
    notFound();
  }

  return <PostTypeClient initialData={postType} />;
}
