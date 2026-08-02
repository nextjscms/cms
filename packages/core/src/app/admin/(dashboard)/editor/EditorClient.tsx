'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Blockquote from '@tiptap/extension-blockquote';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import CodeBlock from '@tiptap/extension-code-block';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Send, Loader2, Settings, Type, List, ListOrdered, Quote, Code } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { savePostAction } from './actions';
import { useRouter } from 'next/navigation';
import { MediaPicker } from '@/components/MediaPicker';

type EditorClientProps = {
  initialData?: any;
  type: string;
  customSchema?: any;
  postTypeId?: number | null;
}

export default function EditorClient({ initialData, type, customSchema, postTypeId }: EditorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [meta, setMeta] = useState<Record<string, any>>(initialData?.meta || {});
  
  const handleMetaChange = (key: string, value: any) => {
    setMeta({ ...meta, [key]: value });
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [savingAction, setSavingAction] = useState<'draft' | 'published' | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'draft' | 'published'>(initialData?.status || 'draft');
  
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
      }),
      BulletList,
      OrderedList,
      ListItem,
      Blockquote,
      CodeBlock,
    ],
    content: initialData?.content || '<p>Start writing your masterpiece...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[600px] px-8 py-8 text-lg leading-relaxed',
      },
    },
  });

  const handleSave = (status: 'draft' | 'published') => {
    if (!title.trim()) {
      setErrorMsg('Title is required to save.');
      return;
    }
    
    let hasValidationError = false;
    if (customSchema && Array.isArray(customSchema)) {
      for (const field of customSchema) {
        if (field.required && field.type !== 'boolean') {
          const val = meta[field.name];
          if (val === undefined || val === null || val === '') {
            setErrorMsg(`Field "${field.name}" is required.`);
            hasValidationError = true;
            break;
          }
        }
      }
    }
    if (hasValidationError) return;

    setErrorMsg('');
    setSuccessMsg('');
    setSavingAction(status);
    setCurrentStatus(status);

    startTransition(async () => {
      const result = await savePostAction({
        id: initialData?.id,
        type: type === 'page' ? 'page' : 'post',
        postTypeId,
        title,
        slug,
        excerpt,
        content: editor?.getHTML() || '',
        meta,
        status
      });

      if (result.success && result.post) {
        setSuccessMsg(`${type === 'page' ? 'Page' : 'Post'} ${status === 'published' ? 'published' : 'saved as draft'} successfully!`);
        // If it was a new post/page, redirect to edit URL to prevent duplicate inserts on next save
        if (!initialData?.id) {
          router.replace(`/admin/editor?type=${type}&id=${result.post.id}`);
        }
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(result.error || 'Failed to save post.');
      }
      setSavingAction(null);
    });
  };

  return (
    <div className="h-full flex flex-col space-y-4 max-w-7xl mx-auto px-4">
      {/* Editor Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 pt-2">
        <div className="flex items-center gap-4 flex-1">
          <Link href={type === 'page' ? "/admin/pages" : type === 'post' ? "/admin/posts" : `/admin/posts?type=${type}`}>
            <Button variant="ghost" size="icon" className="hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex flex-col flex-1">
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder={`${type === 'page' ? 'Page' : 'Post'} Title`}
              className="text-3xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto placeholder:text-slate-300"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {errorMsg && <span className="text-sm font-medium text-red-600">{errorMsg}</span>}
          {successMsg && <span className="text-sm font-medium text-emerald-600">{successMsg}</span>}
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={isSidebarOpen ? 'bg-slate-100' : ''}
            title="Toggle Settings Sidebar"
          >
            <Settings className="w-5 h-5 text-slate-600" />
          </Button>

          <Button 
            variant="outline" 
            onClick={() => handleSave('draft')}
            disabled={isPending}
          >
            {isPending && savingAction === 'draft' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Draft
          </Button>
          <Button 
            onClick={() => handleSave('published')}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isPending && savingAction === 'published' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Publish
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 gap-6 overflow-hidden pb-6">
        
        {/* TipTap Editor Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Card className="flex-1 overflow-y-auto bg-white border border-slate-200 flex flex-col rounded-xl">
            
            {/* Notion-style Toolbar */}
            <div className="sticky top-0 z-10 border-b border-slate-100 p-1.5 flex gap-1 bg-white/80 backdrop-blur-sm rounded-t-xl">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={editor?.isActive('bold') ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}
                title="Bold (Cmd+B)"
              >
                <strong className="font-bold">B</strong>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={editor?.isActive('italic') ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}
                title="Italic (Cmd+I)"
              >
                <em className="font-serif italic">I</em>
              </Button>
              <div className="w-px h-6 bg-slate-200 mx-1 my-auto" />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor?.isActive('heading', { level: 2 }) ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}
                title="Heading 2"
              >
                <Type className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-slate-200 mx-1 my-auto" />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={editor?.isActive('bulletList') ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                className={editor?.isActive('orderedList') ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}
                title="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                className={editor?.isActive('blockquote') ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}
                title="Quote"
              >
                <Quote className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                className={editor?.isActive('codeBlock') ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}
                title="Code Block"
              >
                <Code className="w-4 h-4" />
              </Button>
            </div>

            {/* Actual Editor */}
            {editor && <EditorContent editor={editor} className="flex-1 overflow-y-auto cursor-text" onClick={() => editor.commands.focus()} />}
          </Card>
        </div>

        {/* Post Settings Sidebar */}
        {isSidebarOpen && (
          <div className="w-80 flex flex-col space-y-6 bg-slate-50 rounded-xl p-5 border border-slate-200 overflow-y-auto">
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">{type === 'page' ? 'Page' : 'Post'} Settings</h3>
              
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="slug" className="text-slate-600">URL Slug</Label>
                  <Input 
                    id="slug" 
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value)} 
                    placeholder="leave-blank-to-autogenerate" 
                    className="bg-white font-mono text-sm"
                  />
                  <p className="text-xs text-slate-400">The URL path for this {type}.</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="excerpt" className="text-slate-600">Excerpt</Label>
                  <Textarea 
                    id="excerpt" 
                    value={excerpt} 
                    onChange={(e) => setExcerpt(e.target.value)} 
                    placeholder="Write a brief summary..." 
                    className="bg-white resize-none h-24"
                  />
                  <p className="text-xs text-slate-400">Used for SEO and post previews.</p>
                </div>
              </div>
            </div>

            {customSchema && Array.isArray(customSchema) && customSchema.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-4">Custom Fields</h4>
                <div className="space-y-4">
                  {customSchema.map((field: any, idx: number) => (
                    <div key={idx} className="grid gap-2">
                      <Label htmlFor={`meta_${field.name}`} className="text-slate-600">
                        {field.name}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {field.type === 'textarea' ? (
                        <Textarea 
                          id={`meta_${field.name}`}
                          value={meta[field.name] || ''}
                          onChange={(e) => handleMetaChange(field.name, e.target.value)}
                          className="bg-white"
                        />
                      ) : field.type === 'boolean' ? (
                        <div className="flex items-center space-x-2 h-10">
                           <input type="checkbox" id={`meta_${field.name}`} checked={!!meta[field.name]} onChange={(e) => handleMetaChange(field.name, e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                           <label htmlFor={`meta_${field.name}`} className="text-sm text-slate-600">Enabled</label>
                        </div>
                      ) : field.type === 'date' ? (
                        <Input
                          id={`meta_${field.name}`}
                          type="date"
                          value={meta[field.name] || ''}
                          onChange={(e) => handleMetaChange(field.name, e.target.value)}
                          className="bg-white"
                        />
                      ) : field.type === 'json' ? (
                        <Textarea 
                          id={`meta_${field.name}`}
                          value={typeof meta[field.name] === 'object' ? JSON.stringify(meta[field.name], null, 2) : meta[field.name] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            try {
                              const parsed = JSON.parse(val);
                              handleMetaChange(field.name, parsed);
                            } catch {
                              handleMetaChange(field.name, val);
                            }
                          }}
                          className="bg-white font-mono text-xs h-32"
                          placeholder="{}"
                        />
                      ) : field.type === 'select' ? (
                        <select
                          id={`meta_${field.name}`}
                          value={meta[field.name] || ''}
                          onChange={(e) => handleMetaChange(field.name, e.target.value)}
                          className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                        >
                          <option value="">Select an option</option>
                          {(field.options || '').split(',').map((opt: string) => opt.trim()).filter(Boolean).map((opt: string, i: number) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'media' ? (
                        <MediaPicker 
                          value={meta[field.name] || ''} 
                          onChange={(val) => handleMetaChange(field.name, val)} 
                        />
                      ) : (
                        <Input
                          id={`meta_${field.name}`}
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={meta[field.name] || ''}
                          onChange={(e) => handleMetaChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                          className="bg-white"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Information</p>
              <div className="text-sm text-slate-600 space-y-1">
                <p>Status: <strong className="text-slate-900">{currentStatus === 'published' ? 'Published' : currentStatus === 'draft' ? 'Draft' : 'New'}</strong></p>
                <p>Created: <strong className="text-slate-900">{initialData?.createdAt ? new Date(initialData.createdAt).toLocaleDateString('en-US') : 'Not saved'}</strong></p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
