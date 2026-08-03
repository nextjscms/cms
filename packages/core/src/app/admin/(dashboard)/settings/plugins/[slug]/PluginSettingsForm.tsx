'use client';

import { useState } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { savePluginSettings } from '@/app/admin/settings-actions';

export interface SchemaField {
  key: string;
  label?: string;
  type: 'string' | 'password' | 'boolean' | 'number' | 'object' | 'array' | 'select';
  required?: boolean;
  description?: string;
  options?: { label: string; value: string }[];
  children?: SchemaField[];
  showIf?: { field: string; equals: any };
}

// Utility to get a nested value
function getNestedValue(obj: any, path: string[]): any {
  return path.reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

// Utility to immutably set a nested value
function setNestedValue(obj: any, path: string[], value: any): any {
  if (path.length === 0) return value;
  const key = path[0];
  const isArray = Array.isArray(obj);
  const clone = isArray ? [...obj] : { ...obj };

  if (path.length === 1) {
    if (value === undefined) {
      if (isArray) {
        (clone as any[]).splice(Number(key), 1);
      } else {
        delete clone[key];
      }
    } else {
      clone[key] = value;
    }
  } else {
    clone[key] = setNestedValue(clone[key] || {}, path.slice(1), value);
  }
  return clone;
}

const FieldRenderer = ({
  field,
  path,
  formData,
  onChange,
}: {
  field: SchemaField;
  path: string[];
  formData: any;
  onChange: (path: string[], value: any) => void;
}) => {
  // Conditional rendering
  if (field.showIf) {
    const targetValue = getNestedValue(formData, field.showIf.field.split('.'));
    if (targetValue !== field.showIf.equals) return null;
  }

  const currentValue = getNestedValue(formData, path);
  const fieldId = path.join('-');

  // Array
  if (field.type === 'array') {
    const items = Array.isArray(currentValue) ? currentValue : [];
    return (
      <div className="space-y-3 p-4 border rounded-xl bg-slate-50/50">
        <div>
          <label className="text-sm font-semibold">{field.label || field.key}</label>
          {field.description && <p className="text-[0.8rem] text-slate-500 mt-1">{field.description}</p>}
        </div>
        <div className="space-y-4">
          {items.map((_, index) => (
            <div key={index} className="flex gap-4 items-start border-l-2 border-slate-200 pl-4">
              <div className="flex-1 space-y-4">
                {field.children?.map(child => (
                  <FieldRenderer
                    key={child.key}
                    field={child}
                    path={[...path, String(index), child.key]}
                    formData={formData}
                    onChange={onChange}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => onChange([...path, String(index)], undefined)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => onChange([...path, String(items.length)], {})}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </div>
    );
  }

  // Object
  if (field.type === 'object') {
    return (
      <div className="space-y-4 p-4 border rounded-xl bg-white shadow-sm">
        <div>
          <label className="text-sm font-semibold text-slate-800">{field.label || field.key}</label>
          {field.description && <p className="text-[0.8rem] text-slate-500 mt-1">{field.description}</p>}
        </div>
        <div className="space-y-4">
          {field.children?.map(child => (
            <FieldRenderer
              key={child.key}
              field={child}
              path={[...path, child.key]}
              formData={formData}
              onChange={onChange}
            />
          ))}
        </div>
      </div>
    );
  }

  // Base types
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium leading-none">
        {field.label || field.key}
      </label>

      {field.type === 'select' ? (
        <select
          id={fieldId}
          value={currentValue || ''}
          onChange={(e) => onChange(path, e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required={field.required}
        >
          <option value="" disabled>Select an option</option>
          {field.options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : field.type === 'boolean' ? (
        <div className="flex items-center space-x-2 pt-1">
          <input
            type="checkbox"
            id={fieldId}
            checked={!!currentValue}
            onChange={(e) => onChange(path, e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          <label htmlFor={fieldId} className="text-sm text-slate-600 cursor-pointer">
            Enable
          </label>
        </div>
      ) : (
        <Input
          id={fieldId}
          type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'}
          value={currentValue ?? ''}
          onChange={(e) => onChange(path, field.type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={field.type === 'password' ? (currentValue === '••••••••••••' ? '••••••••••••' : 'Enter secret...') : 'Enter value...'}
          required={field.required}
        />
      )}

      {field.description && (
        <p className="text-[0.8rem] text-slate-500 pt-1">{field.description}</p>
      )}
    </div>
  );
};

export default function PluginSettingsForm({
  slug,
  schema,
  initialData,
}: {
  slug: string;
  schema: SchemaField[];
  initialData: Record<string, any>;
}) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData || {});
  const [saving, setSaving] = useState(false);

  const handleUpdate = (path: string[], value: any) => {
    setFormData(prev => setNestedValue(prev, path, value));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await savePluginSettings(slug, formData);
      toast.success('Settings saved successfully!');
    } catch (err: any) {
      toast.error('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave}>
      <CardContent className="p-6 pt-6 max-w-3xl">
        <div className="space-y-6">
          {schema.map(field => (
            <FieldRenderer
              key={field.key}
              field={field}
              path={[field.key]}
              formData={formData}
              onChange={handleUpdate}
            />
          ))}
        </div>
      </CardContent>

      <div className="border-t p-4 bg-slate-50 flex justify-end rounded-b-xl">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
