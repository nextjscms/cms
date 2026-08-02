import { MediaClient } from '@/app/admin/(dashboard)/media/MediaClient';
import { getDatabaseAdapter } from '@/lib/registry';

export default async function MediaPage() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return <div>Database not configured</div>;

  const adapter = getDatabaseAdapter(process.env.DATABASE_PROVIDER as any);
  const db = adapter.getDb(dbUrl);

  // We don't necessarily need to prefetch, but we could for initial load.
  // To keep the component simple and interactive, we'll let the client fetch its own state.

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground mt-2">Manage your images and files in Cloud Storage.</p>
        </div>
      </div>
      <MediaClient />
    </div>
  );
}
