import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Users, Eye, Plus, Settings, Sparkles, Loader2 } from 'lucide-react';
import { getDb } from '@/db';
import { posts, users, pages } from '@/db/schema';
import { count, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Suspense } from 'react';

// The main layout is 100% static and renders instantly
export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Here is what is happening with your site today.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/posts/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 bg-slate-900 text-white hover:bg-slate-900/90 h-9 px-4 py-2">
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Link>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm border-neutral-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Total Posts</CardTitle>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<CountSkeleton />}>
              <PostsCountData />
            </Suspense>
            <p className="text-xs text-slate-500 font-medium mt-1">Published and drafts</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-neutral-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Active Users</CardTitle>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<CountSkeleton />}>
              <UsersCountData />
            </Suspense>
            <p className="text-xs text-slate-500 font-medium mt-1">Registered accounts</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-neutral-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Total Pages</CardTitle>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Eye className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<CountSkeleton />}>
              <PagesCountData />
            </Suspense>
            <p className="text-xs text-slate-500 font-medium mt-1">Static site pages</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card className="shadow-sm border-neutral-200 col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900">Recent Users</CardTitle>
            <CardDescription>Latest members to join the CMS.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ListSkeleton />}>
              <RecentUsersData />
            </Suspense>
          </CardContent>
        </Card>

        {/* Quick Actions (100% Static) */}
        <Card className="shadow-sm border-neutral-200 col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-slate-300">Jump right into managing your content.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <Link href="/admin/posts/new" className="flex flex-col items-center justify-center p-6 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10 group">
                <FileText className="w-8 h-8 mb-3 text-blue-300 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-sm">Write Post</span>
              </Link>
              <Link href="/admin/settings" className="flex flex-col items-center justify-center p-6 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10 group">
                <Settings className="w-8 h-8 mb-3 text-emerald-300 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-sm">Site Settings</span>
              </Link>
              <Link href="/admin/users" className="flex flex-col items-center justify-center p-6 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10 group">
                <Users className="w-8 h-8 mb-3 text-purple-300 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-sm">Manage Users</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Skeletons
function CountSkeleton() {
  return <div className="h-9 w-12 bg-slate-100 rounded animate-pulse" />;
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse" />
            <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Micro Async Components for Data Fetching
async function PostsCountData() {
  const db = getDb();
  const [result] = await db.select({ value: count() }).from(posts);
  return <div className="text-3xl font-bold text-slate-900">{result.value}</div>;
}

async function UsersCountData() {
  const db = getDb();
  const [result] = await db.select({ value: count() }).from(users);
  return <div className="text-3xl font-bold text-slate-900">{result.value}</div>;
}

async function PagesCountData() {
  const db = getDb();
  const [result] = await db.select({ value: count() }).from(pages);
  return <div className="text-3xl font-bold text-slate-900">{result.value}</div>;
}

async function RecentUsersData() {
  const db = getDb();
  const recentUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(5);

  return (
    <div className="space-y-4">
      {recentUsers.map(user => (
        <div key={user.id} className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-sm border border-slate-200">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || 'Unnamed'}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
          <div className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {user.role}
          </div>
        </div>
      ))}
    </div>
  );
}
