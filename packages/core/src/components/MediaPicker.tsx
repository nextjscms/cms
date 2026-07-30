'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image as ImageIcon, X, UploadCloud, Link as LinkIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface MediaPickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export function MediaPicker({ value, onChange, id }: MediaPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  const handleOpen = () => {
    setTempUrl(value || '');
    setIsOpen(true);
  };

  const handleSave = () => {
    onChange(tempUrl);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div>
      <div className="flex gap-2 items-center">
        {value ? (
          <div className="flex flex-col gap-2 w-full">
            <div className="relative w-full h-32 bg-slate-100 rounded-md overflow-hidden border border-slate-200 flex items-center justify-center">
              {value.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={value} alt="Selected media" className="object-contain w-full h-full" />
              ) : (
                <div className="text-center text-slate-500">
                  <LinkIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <span className="text-xs break-all px-2 block">{value}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleOpen} className="flex-1 bg-white">
                Change Media
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleClear} className="text-red-500 hover:text-red-600 bg-white">
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="outline" onClick={handleOpen} className="w-full h-24 border-dashed border-2 bg-slate-50 hover:bg-slate-100 flex flex-col gap-2">
            <ImageIcon className="w-6 h-6 text-slate-400" />
            <span className="text-sm text-slate-600">Select Media</span>
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-900">Select Media</h2>
              <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-6">
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-medium text-slate-900">Media Library</h3>
                  <p className="text-sm text-slate-500 max-w-xs">
                    File uploads are not yet configured. Please use a direct URL for now.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="media-url" className="text-sm font-medium text-slate-700">Media URL</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="media-url"
                      placeholder="https://example.com/image.jpg"
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleSave}>Select</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
