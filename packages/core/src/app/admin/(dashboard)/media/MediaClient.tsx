'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder, File, Upload, Plus, ArrowLeft, Image as ImageIcon, Copy, Settings, X, MoreVertical, Edit2, Trash2, Check, Loader2, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getMediaSettingsAction, saveMediaSettingsAction } from './actions';
import { toast } from 'sonner';

export function MediaClient({ pickerMode = false, onSelect }: { pickerMode?: boolean, onSelect?: (media: any) => void }) {
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [folderHistory, setFolderHistory] = useState<{ id: number | null, name: string }[]>([{ id: null, name: 'Root' }]);

  const [folders, setFolders] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<{ id: string, file: File, targetFolderId: number | null, previewUrl?: string, done?: boolean, url?: string }[]>([]);
  const [newFolderName, setNewFolderName] = useState('');

  // File Details State
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isUpdatingFile, setIsUpdatingFile] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);
  // Track which uploads are currently active so only those rows show spinner
  const [activeUploadIds, setActiveUploadIds] = useState<string[]>([]);
  // Track which folder is highlighted during a drag-over
  const [dragOverFolderId, setDragOverFolderId] = useState<number | null | undefined>(undefined);
  // Track files currently being deleted to show a loader on their row
  const [deletingIds, setDeletingIds] = useState<number[]>([]);

  // Folder Management State
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  // Bulk Actions State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter, Sort, Pagination State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOption, setSortOption] = useState('createdAt_desc');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(timer);
  }, [search]);

  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({
    driver: 's3',
    s3ApiUrl: '',
    bucketName: '',
    publicUrl: '',
    accessKeyId: '',
    secretAccessKey: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchMedia = useCallback(async (folderId: number | null, silent = false, currentOffset = 0, append = false) => {
    if (!silent && !append) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (folderId) params.append('folderId', folderId.toString());
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (sortOption) params.append('sort', sortOption);
      params.append('limit', '50');
      params.append('offset', currentOffset.toString());

      const url = `/api/media?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!append) {
        if (data.folders) setFolders(data.folders);
        if (data.media) setMedia(data.media);
      } else {
        if (data.media && data.media.length > 0) {
          setMedia(prev => {
            // Avoid appending duplicates if any race conditions occur
            const existingIds = new Set(prev.map(m => m.id));
            const newMedia = data.media.filter((m: any) => !existingIds.has(m.id));
            return [...prev, ...newMedia];
          });
        }
      }
      return data.media?.length === 50;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      if (!silent && !append) setLoading(false);
    }
  }, [debouncedSearch, typeFilter, sortOption]);

  // Reset pagination when filters change
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchMedia(currentFolderId, false, 0, false);
  }, [currentFolderId, debouncedSearch, typeFilter, sortOption]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const newOffset = offset + 50;
    const moreAvailable = await fetchMedia(currentFolderId, true, newOffset, true);
    setOffset(newOffset);
    setHasMore(moreAvailable);
  }, [loading, hasMore, offset, currentFolderId, fetchMedia]);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => {
    getMediaSettingsAction().then(data => {
      const s3ApiUrl = data.endpoint ? data.endpoint : '';
      setSettings({
        ...data,
        s3ApiUrl
      });
    }).catch(console.error);
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const endpoint = settings.s3ApiUrl ? settings.s3ApiUrl.trim() : '';
      const bucketName = settings.bucketName ? settings.bucketName.trim() : '';

      const dataToSave = {
        ...settings,
        region: 'auto',
        endpoint,
        bucketName
      };
      await saveMediaSettingsAction(dataToSave);
      setShowSettings(false);
      toast.success('Settings saved successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;

    try {
      const res = await fetch('/api/media/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName, parentId: currentFolderId })
      });
      const data = await res.json();
      if (data.success) {
        setFolders([data.folder, ...folders]);
        setNewFolderName('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateFolderFromPrompt = async () => {
    const name = window.prompt('Enter new folder name:');
    if (!name) return;

    try {
      const res = await fetch('/api/media/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId: currentFolderId })
      });
      const data = await res.json();
      if (data.success) {
        setFolders([data.folder, ...folders]);
        toast.success('Folder created');
      } else {
        toast.error('Failed to create folder');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error creating folder');
    }
  };

  const uploadFiles = async (files: File[], targetFolderId: number | null = currentFolderId) => {
    if (files.length === 0) return;

    const newUploads = files.map((f, i) => {
      let previewUrl = undefined;
      if (f.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(f);
      }
      return { id: Math.random().toString(36).substring(7), file: f, targetFolderId, previewUrl, done: false, mediaRecord: null as any, originalIndex: i + 1, totalCount: files.length };
    });
    setUploadingFiles(prev => [...newUploads, ...prev]);

    const queue = [...newUploads];
    let successCount = 0;

    const worker = async () => {
      while (queue.length > 0) {
        const uploadObj = queue.shift();
        if (!uploadObj) break;

        setActiveUploadIds(prev => [...prev, uploadObj.id]);
        const file = uploadObj.file;
        const formData = new FormData();
        formData.append('file', file);
        if (uploadObj.targetFolderId !== null) {
          formData.append('folderId', uploadObj.targetFolderId.toString());
        }
        try {
          const res = await fetch('/api/media', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (data.success) {
            successCount++;
            try {
              const params = new URLSearchParams();
              params.append('search', file.name);
              if (targetFolderId) params.append('folderId', targetFolderId.toString());
              params.append('limit', '1');
              const freshRes = await fetch(`/api/media?${params}`);
              const freshData = await freshRes.json();
              if (freshData.media && freshData.media.length > 0) {
                setMedia(prev => {
                  const existingIds = new Set(prev.map((m: any) => m.id));
                  const newItems = freshData.media.filter((m: any) => !existingIds.has(m.id));
                  return [...newItems, ...prev];
                });
              }
            } catch (_) { }
            if (uploadObj.previewUrl) URL.revokeObjectURL(uploadObj.previewUrl);
            setUploadingFiles(prev => prev.filter(f => f.id !== uploadObj.id));
          } else {
            toast.error(`Failed to upload ${file.name}: ${data.error}`);
            setUploadingFiles(prev => prev.filter(f => f.id !== uploadObj.id));
          }
        } catch (e) {
          console.error(e);
          toast.error(`Error uploading ${file.name}`);
          setUploadingFiles(prev => prev.filter(f => f.id !== uploadObj.id));
        } finally {
          setActiveUploadIds(prev => prev.filter(id => id !== uploadObj.id));
        }
      }
    };

    const concurrency = Math.min(10, newUploads.length);
    const workers = Array.from({ length: concurrency }).map(() => worker());
    await Promise.all(workers);

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} file(s)`);
    }
  };

  const moveMedia = async (ids: number[], targetFolderId: number | null) => {
    setLoading(true);
    try {
      const res = await fetch('/api/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, targetFolderId })
      });
      if (res.ok) {
        toast.success(`Moved ${ids.length} file(s)`);
        setSelectedIds([]);
        setSelectionMode(false);
        fetchMedia(currentFolderId, true);
      } else {
        toast.error('Failed to move files');
      }
    } catch (err) {
      toast.error('Error moving files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(Array.from(e.target.files));
      e.target.value = ''; // Reset input
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFolderDrop = async (e: React.DragEvent, targetFolderId: number | null) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragOverFolderId(undefined);

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.type === 'move_media') {
          await moveMedia(data.ids, targetFolderId);
          return;
        }
      }
    } catch (err) {
      // Ignore parse errors (e.g. desktop drop)
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(Array.from(e.dataTransfer.files), targetFolderId);
    }
  };

  // Cancel drag-move when dropped on the table area (not on a folder)
  const handleTableDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragOverFolderId(undefined);

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.type === 'move_media') {
          // Dropped outside any folder — silently cancel, no move
          return;
        }
      }
    } catch (_) {}

    // Only allow desktop file drops on the table area
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(Array.from(e.dataTransfer.files), currentFolderId);
    }
  };

  const handleDragStartFile = (e: React.DragEvent, id: number) => {
    const dragIds = selectedIds.includes(id) ? selectedIds : [id];
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'move_media', ids: dragIds }));
    e.dataTransfer.effectAllowed = 'move';
    // Show count badge on drag ghost using a canvas-drawn image
    if (dragIds.length > 1) {
      const ghost = document.createElement('div');
      ghost.style.cssText = 'position:fixed;top:-200px;left:-200px;background:#2563eb;color:#fff;padding:4px 10px;border-radius:999px;font-size:13px;font-weight:600;white-space:nowrap;';
      ghost.textContent = `${dragIds.length} files`;
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 40, 16);
      setTimeout(() => document.body.removeChild(ghost), 0);
    }
    setDragOverFolderId(undefined);
  };

  const navigateToFolder = (id: number, name: string) => {
    // Guard: don't re-navigate if we're already in this folder (prevents double-click duplicating breadcrumbs)
    if (currentFolderId === id) return;
    setCurrentFolderId(id);
    setFolderHistory(prev => {
      // Also guard against the folder already being the last entry (race condition)
      if (prev[prev.length - 1]?.id === id) return prev;
      return [...prev, { id, name }];
    });
  };

  const navigateUp = () => {
    if (folderHistory.length <= 1) return;
    const newHistory = [...folderHistory];
    newHistory.pop(); // remove current
    const prev = newHistory[newHistory.length - 1];
    setFolderHistory(newHistory);
    setCurrentFolderId(prev.id);
  };

  const navigateToHistoryIndex = (index: number) => {
    const target = folderHistory[index];
    setFolderHistory(folderHistory.slice(0, index + 1));
    setCurrentFolderId(target.id);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.info('Copied to clipboard!');
  };

  const handleFileClick = (file: any) => {
    if (pickerMode && onSelect) {
      onSelect(file);
    } else {
      setSelectedFile({ ...file });
    }
  };

  const handleSaveFileDetails = async () => {
    if (!selectedFile) return;
    setIsUpdatingFile(true);
    try {
      const res = await fetch(`/api/media/${selectedFile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ altText: selectedFile.altText })
      });
      if (res.ok) {
        toast.success('File details updated');
        fetchMedia(currentFolderId, true);
        // We don't close the modal, just let them see it saved
      } else {
        toast.error('Failed to update details');
      }
    } catch (e) {
      toast.error('Error updating file');
    } finally {
      setIsUpdatingFile(false);
    }
  };

  const handleDeleteFile = () => {
    if (!selectedFile) return;
    toast('Are you sure you want to delete this file permanently?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          setIsDeletingFile(true);
          setDeletingIds(prev => [...prev, selectedFile.id]);
          try {
            const res = await fetch(`/api/media/${selectedFile.id}`, {
              method: 'DELETE'
            });
            if (res.ok) {
              toast.success('File deleted');
              setSelectedFile(null);
              fetchMedia(currentFolderId, true);
            } else {
              toast.error('Failed to delete file');
            }
          } catch (e) {
            toast.error('Error deleting file');
          } finally {
            setIsDeletingFile(false);
            setDeletingIds(prev => prev.filter(id => id !== selectedFile.id));
          }
        }
      },
      cancel: { label: 'Cancel', onClick: () => { } }
    });
  };

  const handleDownloadFile = (file: any) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRenameFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFolder || !editingFolderName) return;
    try {
      const res = await fetch(`/api/media/folder/${editingFolder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingFolderName })
      });
      if (res.ok) {
        toast.success('Folder renamed');
        setEditingFolder(null);
        fetchMedia(currentFolderId, true);
      } else {
        toast.error('Failed to rename folder');
      }
    } catch (e) {
      toast.error('Error renaming folder');
    }
  };

  const handleDeleteFolder = (folderId: number) => {
    toast('Are you sure you want to delete this folder? It must be empty.', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            const res = await fetch(`/api/media/folder/${folderId}`, {
              method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok && data.success) {
              toast.success('Folder deleted');
              fetchMedia(currentFolderId, true);
            } else {
              toast.error(data.error || 'Failed to delete folder');
            }
          } catch (e) {
            toast.error('Error deleting folder');
          }
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => { }
      }
    });
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedIds([]);
  };

  const toggleSelection = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    toast(`Are you sure you want to delete ${selectedIds.length} file(s) permanently?`, {
      action: {
        label: 'Delete',
        onClick: async () => {
          setDeletingIds(prev => [...prev, ...selectedIds]);
          try {
            const res = await fetch('/api/media', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: selectedIds })
            });
            if (res.ok) {
              toast.success('Files deleted');
              setSelectedIds([]);
              setSelectionMode(false);
              fetchMedia(currentFolderId, true);
            } else {
              toast.error('Failed to delete files');
            }
          } catch (e) {
            toast.error('Error deleting files');
          } finally {
            setDeletingIds(prev => prev.filter(id => !selectedIds.includes(id)));
          }
        }
      },
      cancel: { label: 'Cancel', onClick: () => { } }
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-1">

      <div className="border border-border/60 rounded-lg overflow-hidden flex flex-col flex-1 bg-background">

        {/* Action Bar (Top) */}
        <div className="flex flex-col sm:flex-row justify-end sm:items-center p-2 px-4 border-b border-border/60 bg-white gap-4 shrink-0 min-h-[52px]">
          {/* Search Bar & Breadcrumbs */}
          <div className="flex-1 items-center gap-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative w-full sm:w-[300px]">
                <Input
                  placeholder="Search objects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-background pr-10 h-9"
                />
                {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="flex h-9 w-[130px] items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                  <option value="document">Documents</option>
                </select>
                <select
                  className="flex h-9 w-[140px] items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="createdAt_desc">Newest First</option>
                  <option value="createdAt_asc">Oldest First</option>
                  <option value="name_asc">Alphabet (A-Z)</option>
                  <option value="size_desc">Largest</option>
                </select>
              </div>
              {/* Breadcrumbs */}
              <div className="flex items-center gap-1 text-[14px] bg-white px-3 py-1.5 rounded-md">
                {folderHistory.map((h, i) => (
                  <span key={`history-${h.id || 'root'}`} className="flex items-center">
                    <span
                      className={`cursor-pointer hover:underline transition-colors ${i === folderHistory.length - 1 ? 'text-foreground font-medium' : 'text-blue-600'}`}
                      onClick={() => navigateToHistoryIndex(i)}
                      onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={e => handleFolderDrop(e, h.id)}
                    >
                      {h.name}
                    </span>
                    {i < folderHistory.length - 1 && <span className="mx-1.5 text-muted-foreground">/</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-2">
            {deletingIds.length > 0 ? (
              <Button variant="destructive" size="sm" className="h-8 opacity-70 pointer-events-none">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting {deletingIds.length}...
              </Button>
            ) : selectedIds.length > 0 ? (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="h-8">
                <Trash2 className="w-4 h-4 mr-2" /> Delete ({selectedIds.length})
              </Button>
            ) : null}
            {/* Upload progress counter */}
            {uploadingFiles.length > 0 && (
              <span className="text-[13px] text-blue-600 font-medium whitespace-nowrap">
                {activeUploadIds.length > 0 
                  ? (() => {
                      const maxActiveIndex = Math.max(...uploadingFiles.filter(u => activeUploadIds.includes(u.id)).map(u => u.originalIndex));
                      const active = uploadingFiles.find(u => u.originalIndex === maxActiveIndex);
                      return active ? `Uploading ${active.originalIndex}/${active.totalCount}` : `Uploading...`;
                    })()
                  : `Uploading...`}
              </span>
            )}
            <div className="relative">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <Button variant="outline" size="sm" className="h-8 font-medium pointer-events-none">
                <Upload className="w-4 h-4 mr-1.5" /> Upload
              </Button>
            </div>



            <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-medium" onClick={handleCreateFolderFromPrompt}>
              <Plus className="w-4 h-4 mr-1.5" /> Add folder
            </Button>

            <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => fetchMedia(currentFolderId, false)}>
              <RefreshCw className="w-4 h-4" />
            </Button>

            <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Drag overlay — fixed so it always appears centered, not bottom */}
        {isDragging && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
            <div className="border-2 border-dashed border-primary rounded-xl p-12 flex flex-col items-center gap-4">
              <Upload className="w-14 h-14 text-primary animate-bounce" />
              <h3 className="text-xl font-bold text-primary">Drop files to upload</h3>
              <p className="text-sm text-muted-foreground">Release to upload to current folder</p>
            </div>
          </div>
        )}

        {/* Data Table Container */}
        <div
          className="flex-1 overflow-auto relative [&_div[data-slot=table-container]]:overflow-visible"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleTableDrop}
        >

          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-[40px] px-4">
                  <input type="checkbox" className="rounded border-gray-300"
                    checked={selectedIds.length === media.length && media.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(media.map(m => m.id));
                      else setSelectedIds([]);
                    }}
                  />
                </TableHead>
                <TableHead className="font-medium text-[13px] text-muted-foreground">Objects</TableHead>
                <TableHead className="w-[120px] font-medium text-[13px] text-muted-foreground hidden sm:table-cell">Type</TableHead>
                <TableHead className="w-[120px] font-medium text-[13px] text-muted-foreground hidden md:table-cell">Storage Class</TableHead>
                <TableHead className="w-[100px] font-medium text-[13px] text-muted-foreground hidden sm:table-cell">Size</TableHead>
                <TableHead className="w-[200px] font-medium text-[13px] text-muted-foreground hidden lg:table-cell">Modified</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {folders.length === 0 && media.length === 0 && loading && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                  </TableCell>
                </TableRow>
              )}

              {folders.length === 0 && media.length === 0 && !loading && uploadingFiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <Folder className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No media found. Upload something to get started!
                  </TableCell>
                </TableRow>
              )}

              {/* Folders */}
              {folders.map(folder => (
                <TableRow
                  key={`folder-${folder.id}`}
                  className={`hover:bg-muted/30 group transition-colors ${dragOverFolderId === folder.id ? 'bg-blue-50 ring-1 ring-blue-400' : ''}`}
                >
                  <TableCell className="px-4">
                    <input type="checkbox" className="rounded border-gray-300" disabled />
                  </TableCell>
                  <TableCell>
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => navigateToFolder(folder.id, folder.name)}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverFolderId(folder.id); }}
                      onDragLeave={(e) => { e.stopPropagation(); setDragOverFolderId(undefined); }}
                      onDrop={(e) => handleFolderDrop(e, folder.id)}
                    >
                      <Folder
                        className={`w-5 h-5 shrink-0 transition-colors ${dragOverFolderId === folder.id ? 'text-blue-600' : 'text-blue-500'}`}
                        fill="currentColor" fillOpacity={dragOverFolderId === folder.id ? 0.4 : 0.2}
                      />
                      <span className="text-[14px] font-medium text-blue-600 group-hover:underline truncate">{folder.name}</span>
                      {dragOverFolderId === folder.id && (
                        <span className="ml-auto text-[11px] text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full">Drop here</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[13px] hidden sm:table-cell">-</TableCell>
                  <TableCell className="text-muted-foreground text-[13px] hidden md:table-cell">-</TableCell>
                  <TableCell className="text-muted-foreground text-[13px] hidden sm:table-cell">-</TableCell>
                  <TableCell className="text-muted-foreground text-[13px] hidden lg:table-cell">-</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground outline-none">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditingFolder(folder);
                          setEditingFolderName(folder.name);
                        }}>
                          <Edit2 className="w-4 h-4 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => handleDeleteFolder(folder.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

              {/* Uploading Files */}
              {uploadingFiles.filter(uf => uf.targetFolderId === currentFolderId).map(upload => (
                <TableRow key={`upload-${upload.id}`}>
                  <TableCell className="px-4">
                    <input type="checkbox" className="rounded border-gray-300" disabled />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 bg-muted/30 rounded overflow-hidden flex items-center justify-center relative">
                        {upload.done && upload.mediaRecord ? (
                          // Show real thumbnail once done
                          upload.mediaRecord.mimeType?.startsWith('image/') ? (
                            <img
                              src={(upload.mediaRecord.sizes as any)?.thumbnail || upload.mediaRecord.url}
                              alt={upload.file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : <File className="w-4 h-4 text-muted-foreground" />
                        ) : upload.previewUrl ? (
                          <>
                            <img src={upload.previewUrl} alt={upload.file.name} className="w-full h-full object-cover opacity-60" />
                            {activeUploadIds.includes(upload.id) && (
                              <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                              </div>
                            )}
                          </>
                        ) : (
                          activeUploadIds.includes(upload.id)
                            ? <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            : <File className="w-4 h-4 text-muted-foreground/40" />
                        )}
                        {/* Green checkmark overlay when done */}
                        {upload.done && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <Check className="w-3 h-3 text-green-600" />
                          </div>
                        )}
                      </div>
                      <span className="text-[14px] truncate text-muted-foreground">{upload.file.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[13px] hidden sm:table-cell">{upload.file.type || 'unknown'}</TableCell>
                  <TableCell className="text-muted-foreground text-[13px] hidden md:table-cell">Standard</TableCell>
                  <TableCell className="text-muted-foreground text-[13px] hidden sm:table-cell">{formatBytes(upload.file.size)}</TableCell>
                  <TableCell className="text-muted-foreground text-[13px] hidden lg:table-cell">
                    {upload.done
                      ? <span className="text-green-600 font-medium">Done</span>
                      : activeUploadIds.includes(upload.id)
                        ? <span className="text-blue-600">{upload.originalIndex}/{upload.totalCount} Uploading...</span>
                        : <span className="text-muted-foreground/50">{upload.originalIndex}/{upload.totalCount} Queued</span>
                    }
                  </TableCell>
                </TableRow>
              ))}

              {/* Media Files */}
              {media.map(file => {
                const isDeleting = deletingIds.includes(file.id);
                return (
                <TableRow
                  key={`file-${file.id}`}
                  className={`hover:bg-muted/30 transition-colors ${selectedIds.includes(file.id) ? 'bg-primary/5' : ''} ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <TableCell className="px-4">
                    <input type="checkbox" className="rounded border-gray-300 cursor-pointer"
                      checked={selectedIds.includes(file.id)}
                      onChange={(e) => toggleSelection(file.id, e as any)}
                    />
                  </TableCell>
                  <TableCell>
                    <div
                      className="flex items-center gap-3 cursor-pointer group"
                      draggable
                      onDragStart={(e) => handleDragStartFile(e, file.id)}
                      onClick={() => handleFileClick(file)}
                    >
                      <div className="w-8 h-8 shrink-0 bg-muted/30 rounded border overflow-hidden flex items-center justify-center">
                        {file.mimeType.startsWith('image/') ? (
                          <img src={(file.sizes as any)?.thumbnail || file.url} alt={file.altText || file.filename} className="w-full h-full object-cover" />
                        ) : (
                          <File className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-[14px] font-medium text-blue-600 group-hover:underline truncate">{file.filename}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[13px] hidden sm:table-cell truncate">{file.mimeType}</TableCell>
                  <TableCell className="text-muted-foreground text-[13px] hidden md:table-cell">Standard</TableCell>
                  <TableCell className="text-muted-foreground text-[13px] hidden sm:table-cell whitespace-nowrap">{formatBytes(file.size)}</TableCell>
                  <TableCell className="text-muted-foreground text-[13px] hidden lg:table-cell whitespace-nowrap">{new Date(file.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground outline-none">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleFileClick(file)}>
                          <Edit2 className="w-4 h-4 mr-2" /> Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadFile(file)}>
                          <Download className="w-4 h-4 mr-2" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => {
                          toast('Are you sure you want to delete this file permanently?', {
                            action: {
                              label: 'Delete',
                              onClick: async () => {
                                setDeletingIds(prev => [...prev, file.id]);
                                try {
                                  const res = await fetch(`/api/media/${file.id}`, { method: 'DELETE' });
                                  if (res.ok) {
                                    toast.success('File deleted');
                                    fetchMedia(currentFolderId, true);
                                  } else {
                                    toast.error('Failed to delete file');
                                  }
                                } catch (e) {
                                  toast.error('Error deleting file');
                                } finally {
                                  setDeletingIds(prev => prev.filter(id => id !== file.id));
                                }
                              }
                            },
                            cancel: { label: 'Cancel', onClick: () => { } }
                          });
                        }}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            </TableBody>
          </Table>

          {/* Infinite Scroll Observer Target */}
          {hasMore && !loading && (
            <div ref={observerTarget} className="h-20 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
          )}


        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setShowSettings(false)}
            >
              <X className="w-4 h-4" />
            </Button>
            <CardHeader>
              <CardTitle>Media Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">S3 API URL</label>
                  <Input
                    value={settings.s3ApiUrl}
                    onChange={e => setSettings({ ...settings, s3ApiUrl: e.target.value })}
                    placeholder="e.g. https://<id>.r2.cloudflarestorage.com"
                  />
                  <p className="text-xs text-muted-foreground">The API endpoint (without bucket name).</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bucket Name</label>
                  <Input
                    value={settings.bucketName}
                    onChange={e => setSettings({ ...settings, bucketName: e.target.value })}
                    placeholder="my-bucket-name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Public Development URL</label>
                  <Input
                    value={settings.publicUrl}
                    onChange={e => setSettings({ ...settings, publicUrl: e.target.value })}
                    placeholder="e.g. https://pub-abcdef123.r2.dev"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Access Key ID</label>
                  <Input
                    type="password"
                    value={settings.accessKeyId}
                    onChange={e => setSettings({ ...settings, accessKeyId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Secret Access Key</label>
                  <Input
                    type="password"
                    value={settings.secretAccessKey}
                    onChange={e => setSettings({ ...settings, secretAccessKey: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
                <Button onClick={handleSaveSettings} disabled={savingSettings}>
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* File Details Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl relative flex flex-col max-h-[90vh]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-white/50 hover:bg-white/80"
              onClick={() => setSelectedFile(null)}
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="flex flex-col md:flex-row overflow-hidden flex-1 min-h-0">
              <div className="md:w-1/2 bg-muted/30 flex items-center justify-center p-4 border-b md:border-b-0 md:border-r min-h-[250px]">
                {selectedFile.mimeType.startsWith('image/') ? (
                  <img
                    src={(selectedFile.sizes as any)?.medium || (selectedFile.sizes as any)?.large || (selectedFile.sizes as any)?.thumbnail || selectedFile.url}
                    alt={selectedFile.altText || selectedFile.filename}
                    className="max-w-full max-h-full object-contain rounded-md"
                  />
                ) : (
                  <File className="w-20 h-20 text-muted-foreground" />
                )}
              </div>

              <div className="md:w-1/2 p-6 overflow-y-auto flex flex-col gap-6">
                <div>
                  <h3 className="font-semibold text-lg break-all">{selectedFile.filename}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.mimeType}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Uploaded: {new Date(selectedFile.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">File URL</label>
                  <div className="flex gap-2">
                    <Input readOnly value={selectedFile.url} className="text-xs bg-muted/50" />
                    <Button variant="outline" size="icon" onClick={() => copyUrl(selectedFile.url)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Generated Sizes */}
                {selectedFile.sizes && Object.keys(selectedFile.sizes as any).length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Generated Sizes (WebP)</label>
                    <div className="space-y-1.5">
                      {Object.entries(selectedFile.sizes as Record<string, string>).map(([key, sizeUrl]) => (
                        <div key={key} className="flex gap-2 items-center">
                          <span className="text-xs text-muted-foreground capitalize w-[70px] shrink-0">{key}</span>
                          <Input readOnly value={sizeUrl} className="text-xs bg-muted/50 h-7" />
                          <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyUrl(sizeUrl)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Alt Text</label>
                  <Input
                    placeholder="Describe this image for SEO..."
                    value={selectedFile.altText || ''}
                    onChange={e => setSelectedFile({ ...selectedFile, altText: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2 mt-auto pt-4 border-t">
                  <Button onClick={handleSaveFileDetails} disabled={isUpdatingFile}>
                    {isUpdatingFile ? 'Saving...' : 'Save Details'}
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteFile} disabled={isDeletingFile}>
                    {isDeletingFile ? 'Deleting...' : 'Delete Permanently'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Rename Folder Modal */}
      {editingFolder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm relative">
            <CardHeader>
              <CardTitle>Rename Folder</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRenameFolder} className="space-y-4">
                <Input
                  value={editingFolderName}
                  onChange={e => setEditingFolderName(e.target.value)}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditingFolder(null)}>Cancel</Button>
                  <Button type="submit">Rename</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
