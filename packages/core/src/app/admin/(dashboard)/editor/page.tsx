import { getDb } from '@/db';
import { posts, pages, postTypes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import EditorClient from './EditorClient';
import { notFound } from 'next/navigation';

export default async function EditorPage({ searchParams }: { searchParams: Promise<{ id?: string, type?: string }> }) {
  const resolvedParams = await searchParams;
  const id = resolvedParams.id ? parseInt(resolvedParams.id, 10) : undefined;
  const type = resolvedParams.type || 'post';
  
  let initialData = null;
  let customSchema = null;
  let postTypeId = null;
  
  const db = getDb();

  let table: any = posts;
  if (type === 'page') {
    table = pages;
  } else if (type !== 'post') {
    const [pt] = await db.select().from(postTypes).where(eq(postTypes.slug, type));
    if (!pt) notFound();
    customSchema = pt.schema;
    postTypeId = pt.id;
  }
  
  if (id) {
    const [item] = await db.select().from(table).where(eq(table.id, id));
    if (!item) {
      notFound();
    }
    initialData = item;
  }
  
  return <EditorClient initialData={initialData} type={type} customSchema={customSchema} postTypeId={postTypeId} />;
}
