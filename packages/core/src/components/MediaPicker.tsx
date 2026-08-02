'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, X, Link as LinkIcon } from 'lucide-react';
import { MediaClient } from '@/app/admin/(dashboard)/media/MediaClient';

interface MediaPickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export function MediaPicker({ value, onChange, id }: MediaPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleSelect = (media: any) => {
    onChange(media.url);
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h2 className="text-lg font-semibold text-slate-900">Select Media</h2>
              <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden relative flex flex-col bg-muted/10 p-2">
              <MediaClient pickerMode onSelect={handleSelect} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
