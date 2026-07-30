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
import { categories, postCategories } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';
import { Loader2 } from 'lucide-react';

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Categories</h1>
          <p className="text-slate-500 mt-1">Organize your posts into topics.</p>
        </div>
        <Link href="/admin/categories/new">
          <Button>Add New Category</Button>
        </Link>
      </div>

      <div className="rounded-md border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-neutral-50/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Posts</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Suspense fallback={<TableSkeleton />}>
              <CategoriesTableData />
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

async function CategoriesTableData() {
  const db = getDb();
  
  // Fetch categories with post counts
  const allCategories = await db.select({
    id: categories.id,
    name: categories.name,
    slug: categories.slug,
    description: categories.description,
    postCount: sql<number>`count(${postCategories.postId})`.mapWith(Number),
  })
  .from(categories)
  .leftJoin(postCategories, eq(categories.id, postCategories.categoryId))
  .groupBy(categories.id)
  .orderBy(categories.name);

  if (allCategories.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="h-24 text-center text-slate-500">
          No categories found. Create one to get started.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {allCategories.map((category) => (
        <TableRow key={category.id}>
          <TableCell className="font-medium text-slate-900">{category.name}</TableCell>
          <TableCell className="text-slate-500">{category.description || '-'}</TableCell>
          <TableCell className="text-slate-500 font-mono text-xs">{category.slug}</TableCell>
          <TableCell className="text-right font-medium">{category.postCount}</TableCell>
          <TableCell className="text-right space-x-2">
            <Button variant="outline" size="sm">Edit</Button>
            <Button variant="destructive" size="sm">Delete</Button>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
