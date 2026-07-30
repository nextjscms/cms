import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Plus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Link from 'next/link';
import { getDb } from '@/db';
import { postTypes } from '@/db/schema';

function DynamicIcon({ name, fallback = 'Database', className }: { name?: string | null, fallback?: string, className?: string }) {
  const iconName = name ? name.charAt(0).toUpperCase() + name.slice(1) : fallback;
  const IconComponent = (LucideIcons as any)[iconName] || (LucideIcons as any)[fallback] || Database;
  return <IconComponent className={className} />;
}

export default async function PostTypesPage() {
  const db = getDb();
  const allPostTypes = await db.select().from(postTypes);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Custom Post Types</h1>
          <p className="text-slate-500 mt-1">Define custom data structures for your site.</p>
        </div>
        <Link href="/admin/post-types/new">
          <Button><Plus className="w-4 h-4 mr-2" /> Create Post Type</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allPostTypes.map(pt => (
          <Card key={pt.id} className="overflow-hidden border-slate-200 bg-white">
            <CardHeader>
              <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center mb-3">
                <DynamicIcon name={pt.icon} className="w-5 h-5" />
              </div>
              <CardTitle>{pt.name}</CardTitle>
              <CardDescription className="font-mono text-xs mt-1">slug: {pt.slug}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                Custom fields: {pt.schema && Array.isArray(pt.schema) && pt.schema.length > 0 ? (pt.schema as any[]).map(s => s.name).join(', ') : 'None'}.
              </p>
              <div className="flex gap-2">
                <Link href={`/admin/post-types/${pt.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full bg-white">Configure</Button>
                </Link>
                <Link href={`/admin/posts?type=${pt.id}`} className="flex-1">
                  <Button variant="default" size="sm" className="w-full bg-slate-900 text-white hover:bg-slate-800">View</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
        {allPostTypes.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No Post Types</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-1 mb-4">You haven't created any custom post types yet.</p>
            <Link href="/admin/post-types/new">
              <Button variant="outline">Create your first Post Type</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
