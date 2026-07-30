import { Button } from '@/components/ui/button';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Media Library</h1>
          <p className="text-slate-500 mt-1">Manage your uploaded images and files.</p>
        </div>
        <Button>
          <UploadCloud className="w-4 h-4 mr-2" />
          Upload New
        </Button>
      </div>

      <div className="border-2 border-dashed border-neutral-200 rounded-xl p-12 text-center bg-white flex flex-col items-center justify-center space-y-3 shadow-sm min-h-[400px]">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center text-slate-400">
          <ImageIcon className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">No media found</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          You haven't uploaded any files yet. Drag and drop images here or click the upload button to get started.
        </p>
      </div>
    </div>
  );
}
