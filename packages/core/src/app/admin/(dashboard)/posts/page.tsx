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
import { posts, users, postTypes } from '@/db/schema';
import { desc, eq, isNull } from 'drizzle-orm';
import { Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const resolvedParams = await searchParams;
  const typeId = resolvedParams.type ? parseInt(resolvedParams.type, 10) : undefined;
  
  const db = getDb();
  let typeName = 'Posts';
  let typeSlug = 'post';
  let emptyMsg = "No posts found. Ready to write your first one?";
  let customColumns: any[] = [];
  
  if (typeId) {
    const [pt] = await db.select().from(postTypes).where(eq(postTypes.id, typeId));
    if (!pt) notFound();
    typeName = pt.name;
    typeSlug = pt.slug;
    emptyMsg = `No ${pt.name.toLowerCase()} found. Ready to write your first one?`;
    if (pt.schema && Array.isArray(pt.schema)) {
      customColumns = (pt.schema as any[]).filter((s) => s.showInTable);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{typeName}</h1>
          <p className="text-slate-500 mt-1">Manage your {typeName.toLowerCase()}.</p>
        </div>
        <Link href={`/admin/editor?type=${typeSlug}`}>
          <Button>Add New {typeName}</Button>
        </Link>
      </div>

      <div className="rounded-md border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-neutral-50/50">
            <TableRow>
              <TableHead>Title</TableHead>
              {customColumns.map((col) => (
                <TableHead key={col.name}>{col.name}</TableHead>
              ))}
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Suspense fallback={<TableSkeleton colSpan={5 + customColumns.length} />}>
              <PostsTableData typeId={typeId} typeSlug={typeSlug} emptyMsg={emptyMsg} customColumns={customColumns} />
            </Suspense>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TableSkeleton({ colSpan = 5 }: { colSpan?: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-32 text-center">
        <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading data...</span>
        </div>
      </TableCell>
    </TableRow>
  );
}

async function PostsTableData({ typeId, typeSlug, emptyMsg, customColumns = [] }: { typeId?: number, typeSlug: string, emptyMsg: string, customColumns?: any[] }) {
  const db = getDb();
  
  const query = db.select({
    id: posts.id,
    title: posts.title,
    status: posts.status,
    createdAt: posts.createdAt,
    meta: posts.meta,
    authorName: users.name,
  })
  .from(posts)
  .leftJoin(users, eq(posts.authorId, users.id));
  
  if (typeId) {
    query.where(eq(posts.postTypeId, typeId));
  } else {
    query.where(isNull(posts.postTypeId));
  }

  const allPosts = await query.orderBy(desc(posts.createdAt));

  if (allPosts.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={5 + customColumns.length} className="h-24 text-center text-slate-500">
          {emptyMsg}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {allPosts.map((post: any) => (
        <TableRow key={post.id}>
          <TableCell className="font-medium text-slate-900">{post.title}</TableCell>
          {customColumns.map(col => {
            const val = post.meta && typeof post.meta === 'object' ? (post.meta as any)[col.name] : null;
            return (
               <TableCell key={col.name} className="text-slate-600 truncate max-w-[200px]">
                 {typeof val === 'object' ? JSON.stringify(val) : String(val || '')}
               </TableCell>
            );
          })}
          <TableCell className="text-slate-600">{post.authorName || 'Unknown'}</TableCell>
          <TableCell>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
            </span>
          </TableCell>
          <TableCell className="text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</TableCell>
          <TableCell className="text-right space-x-2">
            <Link href={`/admin/editor?type=${typeSlug}&id=${post.id}`}>
              <Button variant="outline" size="sm">Edit</Button>
            </Link>
            <Button variant="destructive" size="sm">Delete</Button>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
