'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { GripVertical, Plus, Save, Trash2, Loader2 } from 'lucide-react';
import { saveMenuAction } from './actions';

type MenuItem = {
  id?: number;
  label: string;
  url: string;
};

export default function MenuEditorClient({ allMenus }: { allMenus: Record<string, any[]> }) {
  const existingSlugs = Object.keys(allMenus);
  const initialSlug = existingSlugs.includes('primary') ? 'primary' : (existingSlugs[0] || 'primary');
  
  const [activeMenuSlug, setActiveMenuSlug] = useState(initialSlug);
  const [newMenuSlug, setNewMenuSlug] = useState('');
  
  const [items, setItems] = useState<MenuItem[]>(
    allMenus[initialSlug] || [{ label: 'Home', url: '/' }]
  );
  
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // When activeMenuSlug changes, load its items
  useEffect(() => {
    if (allMenus[activeMenuSlug]) {
      setItems(allMenus[activeMenuSlug]);
    } else {
      setItems([{ label: 'Home', url: '/' }]);
    }
  }, [activeMenuSlug, allMenus]);

  const handleAddItem = () => {
    setItems([...items, { label: '', url: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleChange = (index: number, field: 'label' | 'url', value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems);
  };

  const handleCreateNewMenu = () => {
    const slug = newMenuSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    if (!slug) return;
    
    setActiveMenuSlug(slug);
    setNewMenuSlug('');
  };

  const handleSave = () => {
    // Validate
    if (items.some(i => !i.label.trim() || !i.url.trim())) {
      setErrorMsg('All menu items must have a label and URL.');
      return;
    }
    setErrorMsg('');

    startTransition(async () => {
      const result = await saveMenuAction({
        menuSlug: activeMenuSlug,
        items: items.map((item, index) => ({
          label: item.label,
          url: item.url,
          order: index
        }))
      });

      if (result.success) {
        setSuccessMsg(`${activeMenuSlug} Menu saved successfully!`);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(result.error || 'Failed to save menu.');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Menu Selector */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="grid gap-2 flex-1">
              <Label>Select a Menu to Edit</Label>
              <select 
                value={activeMenuSlug}
                onChange={(e) => setActiveMenuSlug(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {existingSlugs.map(slug => (
                  <option key={slug} value={slug}>{slug} Menu</option>
                ))}
                {!existingSlugs.includes(activeMenuSlug) && (
                  <option value={activeMenuSlug}>{activeMenuSlug} Menu (Unsaved)</option>
                )}
              </select>
            </div>
            
            <div className="flex items-center justify-center text-sm text-slate-400 font-medium">OR</div>
            
            <div className="flex gap-2 flex-1 items-end">
              <div className="grid gap-2 flex-1">
                <Label>Create New Menu</Label>
                <Input 
                  placeholder="e.g. footer" 
                  value={newMenuSlug} 
                  onChange={(e) => setNewMenuSlug(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateNewMenu(); }}
                />
              </div>
              <Button onClick={handleCreateNewMenu} variant="secondary">Create</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-semibold text-slate-800 capitalize">{activeMenuSlug} Menu</h2>
            <div className="flex items-center gap-3">
              {errorMsg && <span className="text-sm font-medium text-red-600">{errorMsg}</span>}
              {successMsg && <span className="text-sm font-medium text-emerald-600">{successMsg}</span>}
              <Button onClick={handleSave} disabled={isPending} className="bg-slate-900 hover:bg-slate-800">
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Menu
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg group">
                <div className="flex flex-col gap-1 mt-2">
                  <button 
                    onClick={() => handleMoveUp(index)} 
                    disabled={index === 0}
                    className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  >
                    <GripVertical className="w-4 h-4 rotate-90" />
                  </button>
                </div>
                
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Link Text</Label>
                    <Input 
                      value={item.label} 
                      onChange={(e) => handleChange(index, 'label', e.target.value)} 
                      placeholder="e.g. About Us" 
                      className="bg-white"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>URL</Label>
                    <Input 
                      value={item.url} 
                      onChange={(e) => handleChange(index, 'url', e.target.value)} 
                      placeholder="e.g. /about or https://google.com" 
                      className="bg-white font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="pt-8">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveItem(index)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    title="Remove Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-8 text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                No items in this menu. Add one below!
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={handleAddItem} 
              className="w-full mt-4 border-dashed border-2 text-slate-600 hover:text-slate-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Menu Item
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
