import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getDb } from '@/db';
import { tags, postTags } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';
import { Loader2 } from 'lucide-react';

export default function TagsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tags</h1>
          <p className="text-slate-500 mt-1">Manage tags used across your posts.</p>
        </div>
        <Link href="/admin/tags/new">
          <Button>Add New Tag</Button>
        </Link>
      </div>

      <div className="rounded-md border border-neutral-200 bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-50/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Posts</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Suspense fallback={<TableSkeleton />}>
              <TagsTableData />
            </Suspense>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <TableRow>
      <TableCell colSpan={4} className="h-32 text-center">
        <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading data...</span>
        </div>
      </TableCell>
    </TableRow>
  );
}

async function TagsTableData() {
  const db = getDb();
  
  // Fetch tags with post counts
  const allTags = await db.select({
    id: tags.id,
    name: tags.name,
    slug: tags.slug,
    postCount: sql<number>`count(${postTags.postId})`.mapWith(Number),
  })
  .from(tags)
  .leftJoin(postTags, eq(tags.id, postTags.tagId))
  .groupBy(tags.id)
  .orderBy(tags.name);

  if (allTags.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={4} className="h-24 text-center text-slate-500">
          No tags found.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {allTags.map((tag) => (
        <TableRow key={tag.id}>
          <TableCell className="font-medium text-slate-900">{tag.name}</TableCell>
          <TableCell className="text-slate-500 font-mono text-xs">{tag.slug}</TableCell>
          <TableCell className="text-right font-medium">{tag.postCount}</TableCell>
          <TableCell className="text-right space-x-2">
            <Button variant="outline" size="sm">Edit</Button>
            <Button variant="destructive" size="sm">Delete</Button>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
