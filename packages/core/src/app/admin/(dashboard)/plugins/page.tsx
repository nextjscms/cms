import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Plug, Zap } from 'lucide-react';

export default function PluginsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Plugins</h1>
          <p className="text-slate-500 mt-1">Extend the functionality of your CMS.</p>
        </div>
        <Button>Install Plugins</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <CardTitle>SEO Optimizer</CardTitle>
            <CardDescription>By NextjsCMS Team</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Automatically generate meta tags, sitemaps, and optimize your site for search engines.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-slate-50 py-3">
            <span className="text-xs text-slate-500 font-medium">Inactive</span>
            <Button variant="outline" size="sm">Activate</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
