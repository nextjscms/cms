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
import { pages, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { Loader2 } from 'lucide-react';

export default function PagesAdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pages</h1>
          <p className="text-slate-500 mt-1">Manage your static pages like About or Contact.</p>
        </div>
        <Link href="/admin/editor?type=page">
          <Button>Add New Page</Button>
        </Link>
      </div>

      <div className="rounded-md border border-neutral-200 bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-50/50">
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Suspense fallback={<TableSkeleton />}>
              <PagesTableData />
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
      <TableCell colSpan={5} className="h-32 text-center">
        <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading data...</span>
        </div>
      </TableCell>
    </TableRow>
  );
}

async function PagesTableData() {
  const db = getDb();
  
  // Fetch pages and join with users to get author name
  const allPages = await db.select({
    id: pages.id,
    title: pages.title,
    status: pages.status,
    createdAt: pages.createdAt,
    authorName: users.name,
  })
  .from(pages)
  .leftJoin(users, eq(pages.authorId, users.id))
  .orderBy(desc(pages.createdAt));

  if (allPages.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="h-24 text-center text-slate-500">
          No pages found. Ready to build your first one?
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {allPages.map((page) => (
        <TableRow key={page.id}>
          <TableCell className="font-medium text-slate-900">{page.title}</TableCell>
          <TableCell className="text-slate-600">{page.authorName || 'Unknown'}</TableCell>
          <TableCell>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${page.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
            </span>
          </TableCell>
          <TableCell className="text-slate-500">{new Date(page.createdAt).toLocaleDateString()}</TableCell>
          <TableCell className="text-right space-x-2">
            <Link href={`/admin/editor?type=page&id=${page.id}`}>
              <Button variant="outline" size="sm">Edit</Button>
            </Link>
            <Button variant="destructive" size="sm">Delete</Button>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
