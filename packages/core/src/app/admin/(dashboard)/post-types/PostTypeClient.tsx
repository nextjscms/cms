'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Plus, Save, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { savePostTypeAction } from './actions';

type FieldSchema = {
  name: string;
  type: string;
  options?: string;
  required?: boolean;
  showInTable?: boolean;
};

export default function PostTypeClient({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [icon, setIcon] = useState(initialData?.icon || '');
  const [schema, setSchema] = useState<FieldSchema[]>(initialData?.schema || []);
  
  const [errorMsg, setErrorMsg] = useState('');

  const addField = () => {
    setSchema([...schema, { name: '', type: 'text' }]);
  };

  const removeField = (index: number) => {
    setSchema(schema.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: keyof FieldSchema, value: string | boolean) => {
    const newSchema = [...schema];
    (newSchema[index] as any)[key] = value;
    setSchema(newSchema);
  };

  const handleSave = () => {
    if (!name.trim() || !slug.trim()) {
      setErrorMsg('Name and Slug are required.');
      return;
    }
    setErrorMsg('');

    startTransition(async () => {
      const result = await savePostTypeAction({
        id: initialData?.id,
        name,
        slug,
        icon,
        schema,
      });

      if (result.success) {
        router.push('/admin/post-types');
      } else {
        setErrorMsg(result.error || 'Failed to save post type.');
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/post-types">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {initialData ? 'Edit Post Type' : 'Create Post Type'}
        </h1>
        <div className="flex-1" />
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Post Type
        </Button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm font-medium border border-red-200">
          {errorMsg}
        </div>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>The name and URL slug for this content type.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name (Plural)</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Products" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug (Singular)</Label>
              <Input 
                id="slug" 
                value={slug} 
                onChange={(e) => setSlug(e.target.value)} 
                placeholder="e.g. product" 
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500">This determines the URL, e.g. /product/my-item</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="icon">Icon (Optional)</Label>
              <Input 
                id="icon" 
                value={icon} 
                onChange={(e) => setIcon(e.target.value)} 
                placeholder="e.g. Box, Star, FileText" 
              />
              <p className="text-xs text-slate-500">
                Name of the Lucide icon to use. <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Browse icons &rarr;</a>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Custom Fields</CardTitle>
                <CardDescription>Define the data structure for this post type.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addField}>
                <Plus className="w-4 h-4 mr-2" /> Add Field
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {schema.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm border-2 border-dashed border-slate-100 rounded-md">
                No custom fields defined. Click "Add Field" to start building your schema.
              </div>
            ) : (
              <div className="space-y-3">
                {schema.map((field, index) => (
                  <div key={index} className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex gap-3 items-start">
                      <div className="flex-1 grid gap-2">
                        <Label className="text-xs">Field Name</Label>
                        <Input 
                          value={field.name}
                          onChange={(e) => updateField(index, 'name', e.target.value)}
                          placeholder="e.g. Price"
                          className="bg-white"
                        />
                      </div>
                      <div className="flex-1 grid gap-2">
                        <Label className="text-xs">Field Type</Label>
                        <select 
                          value={field.type} 
                          onChange={(e) => updateField(index, 'type', e.target.value)}
                          className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                        >
                          <option value="text">Short Text</option>
                          <option value="textarea">Long Text (Textarea)</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean (Toggle)</option>
                          <option value="date">Date</option>
                          <option value="json">JSON / Object</option>
                          <option value="select">Selection</option>
                          <option value="media">Media / Image</option>
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs text-transparent select-none">Req</Label>
                        <div className="flex items-center space-x-2 bg-white px-3 h-10 rounded-md border border-slate-200">
                           <input type="checkbox" id={`req_${index}`} checked={!!field.required} onChange={(e) => updateField(index, 'required', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                           <label htmlFor={`req_${index}`} className="text-sm text-slate-600 leading-none">Required</label>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs text-transparent select-none">Table</Label>
                        <div className="flex items-center space-x-2 bg-white px-3 h-10 rounded-md border border-slate-200">
                           <input type="checkbox" id={`table_${index}`} checked={!!field.showInTable} onChange={(e) => updateField(index, 'showInTable', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                           <label htmlFor={`table_${index}`} className="text-sm text-slate-600 leading-none">Show in Table</label>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs text-transparent select-none">Action</Label>
                        <Button variant="ghost" size="icon" onClick={() => removeField(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {field.type === 'select' && (
                      <div className="grid gap-2">
                        <Label className="text-xs">Options (Comma separated)</Label>
                        <Input 
                          value={field.options || ''}
                          onChange={(e) => updateField(index, 'options', e.target.value)}
                          placeholder="e.g. Red, Blue, Green"
                          className="bg-white"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
