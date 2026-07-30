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
import { users } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { requireRole } from '@/lib/auth-utils';
import { Loader2 } from 'lucide-react';

// The main page is no longer async! It renders the shell instantly.
export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Users</h1>
          <p className="text-slate-500 mt-1">Manage user accounts and roles.</p>
        </div>
        <Link href="/admin/users/new">
          <Button>Add New User</Button>
        </Link>
      </div>

      <div className="rounded-md border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-neutral-50/50">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* The Suspense boundary will show a skeleton only for the rows! */}
            <Suspense fallback={<UserTableSkeleton />}>
              <UserTableData />
            </Suspense>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// A simple skeleton specifically for the table rows
function UserTableSkeleton() {
  return (
    <TableRow>
      <TableCell colSpan={5} className="h-32 text-center">
        <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading users...</span>
        </div>
      </TableCell>
    </TableRow>
  );
}

// The Async Server Component that fetches the data
async function UserTableData() {
  // Only admins can access this data
  await requireRole('admin');

  const db = getDb();
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

  if (allUsers.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="h-24 text-center text-slate-500">
          No users found.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {allUsers.map((user) => (
        <TableRow key={user.id}>
          <TableCell className="font-medium">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-xs border border-slate-200">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              {user.name || 'Unnamed'}
            </div>
          </TableCell>
          <TableCell className="text-slate-600">{user.email}</TableCell>
          <TableCell>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              {user.role}
            </span>
          </TableCell>
          <TableCell className="text-slate-500">
            {new Date(user.createdAt).toLocaleDateString()}
          </TableCell>
          <TableCell className="text-right space-x-2">
            <Button variant="outline" size="sm">Edit</Button>
            {user.role !== 'admin' && (
              <Button variant="destructive" size="sm">Delete</Button>
            )}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
