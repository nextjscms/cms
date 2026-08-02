'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveThemeSettings } from './actions';
import { X, Save, RefreshCw, RotateCcw } from 'lucide-react';

export default function CustomizerClient({ activeTheme, themeData, schema, initialSettings }: any) {
  const [draftSettings, setDraftSettings] = useState(initialSettings);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Categorize fields
  const categories = Array.from(new Set(schema.map((f: any) => f.category || 'General')));

  const handleSettingChange = (fieldId: string, value: string, isGlobal: boolean = false) => {
    const key = isGlobal ? fieldId : `theme_${activeTheme}_${fieldId}`;
    const updated = { ...draftSettings, [key]: value };
    setDraftSettings(updated);
  };

  const handleSave = () => {
    // Invoke Server Action
    saveThemeSettings(activeTheme, draftSettings);
  };

  const handleUpdatePreview = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'THEME_UPDATE',
        settings: draftSettings,
        activeTheme
      }, '*');
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-sm">
      {/* Sidebar Form */}
      <aside className="w-[400px] flex flex-col bg-white border-r border-slate-200 z-10">
        <header className="h-16 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h1 className="font-bold text-slate-900 tracking-tight">Theme Customizer</h1>
            <p className="text-xs text-slate-500 mt-0.5">{themeData.name}</p>
          </div>
          <Link href="/admin/themes" className="text-slate-400 hover:text-slate-700 transition">
            <X className="w-5 h-5" />
          </Link>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {schema.length === 0 ? (
            <p className="text-slate-500 text-sm">This theme has no customizable settings.</p>
          ) : (
            categories.map(category => (
              <div key={category as string} className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">{category as string}</h2>
                <div className="space-y-5">
                  {schema.filter((f: any) => (f.category || 'General') === category).map((field: any) => {
                    const isGlobal = field.global || field.id === 'siteName';
                    const key = isGlobal ? field.id : `theme_${activeTheme}_${field.id}`;
                    const currentValue = draftSettings[key] ?? field.default ?? '';

                    return (
                      <div key={field.id} className="grid gap-2">
                        <Label htmlFor={field.id} className="text-slate-700">{field.label}</Label>
                        {field.type === 'color' ? (
                          <div className="flex items-center gap-3">
                            <Input 
                              type="color" 
                              id={field.id} 
                              value={currentValue}
                              onChange={(e) => handleSettingChange(field.id, e.target.value, isGlobal)}
                              className="w-12 h-8 p-1 cursor-pointer rounded-md border-slate-300"
                            />
                            <Input
                              type="text"
                              value={currentValue}
                              onChange={(e) => handleSettingChange(field.id, e.target.value, isGlobal)}
                              className="font-mono text-xs text-slate-500 uppercase flex-1 h-8"
                            />
                            {field.default && currentValue !== field.default && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-slate-700" 
                                onClick={() => handleSettingChange(field.id, field.default, isGlobal)}
                                title="Reset to theme default"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        ) : field.type === 'boolean' ? (
                          <select 
                            id={field.id} 
                            value={currentValue === 'true' || currentValue === true ? 'true' : 'false'}
                            onChange={(e) => handleSettingChange(field.id, e.target.value, isGlobal)}
                            className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950"
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        ) : field.type === 'select' ? (
                          <select 
                            id={field.id} 
                            value={currentValue}
                            onChange={(e) => handleSettingChange(field.id, e.target.value, isGlobal)}
                            className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-slate-950"
                          >
                            {field.options?.map((opt: any) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <Input 
                            type="text" 
                            id={field.id} 
                            value={currentValue} 
                            placeholder={field.default}
                            onChange={(e) => handleSettingChange(field.id, e.target.value, isGlobal)}
                            className="h-9 text-sm"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <footer className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handleUpdatePreview}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Update Preview
          </Button>
          <Button size="sm" onClick={handleSave} className="bg-slate-900">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </footer>
      </aside>

      {/* Live Preview Iframe */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-800">
        <div className="w-full h-full max-w-[1400px] bg-white rounded-lg overflow-hidden border border-slate-700 relative">
          <div className="absolute top-0 left-0 w-full h-8 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div className="ml-4 text-xs font-mono text-slate-400">Live Preview</div>
          </div>
          <iframe 
            ref={iframeRef}
            src="/" 
            className="w-full h-full mt-8"
            title="Theme Preview"
          />
        </div>
      </main>
    </div>
  );
}
