'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Users, MousePointerClick, TrendingUp, Monitor, Smartphone, Globe, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

export function AdminUI() {
  const [timeRange, setTimeRange] = useState('7d');

  const metrics = [
    { title: 'Total Visitors', value: '45,231', change: '+20.1%', trend: 'up', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Active Sessions', value: '1,205', change: '+12.5%', trend: 'up', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: 'Bounce Rate', value: '42.3%', change: '-4.1%', trend: 'down', icon: MousePointerClick, color: 'text-rose-500', bg: 'bg-rose-50' },
    { title: 'Avg Session', value: '2m 14s', change: '+1.2%', trend: 'up', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' }
  ];

  const devices = [
    { name: 'Desktop', percentage: 65, icon: Monitor, color: 'bg-blue-500' },
    { name: 'Mobile', percentage: 28, icon: Smartphone, color: 'bg-indigo-500' },
    { name: 'Tablet', percentage: 7, icon: Globe, color: 'bg-sky-400' }
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Traffic Analytics</h1>
          <p className="text-slate-500 mt-1">Real-time insights and performance metrics.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {['24h', '7d', '30d', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                timeRange === range 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, i) => (
          <Card key={i} className="group hover:shadow-md transition-all duration-300 border-slate-200/60 hover:border-slate-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{metric.title}</CardTitle>
              <div className={`p-2 rounded-lg ${metric.bg}`}>
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{metric.value}</div>
              <div className="flex items-center mt-1 space-x-1">
                {metric.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-emerald-500" />
                )}
                <p className="text-sm font-medium text-emerald-600">{metric.change}</p>
                <span className="text-sm text-slate-400 ml-1">vs last {timeRange}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chart Area Mockup */}
        <Card className="lg:col-span-2 border-slate-200/60 shadow-sm">
          <CardHeader>
            <CardTitle>Audience Overview</CardTitle>
            <CardDescription>Daily unique visitors over the selected period.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-end justify-between gap-2 px-2 pt-10 pb-4 relative group">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full border-b border-slate-100 h-0" />
                ))}
              </div>
              
              {/* Bars */}
              {[40, 65, 45, 80, 55, 90, 75, 40, 65, 100, 85, 70].map((height, i) => (
                <div key={i} className="w-full flex flex-col justify-end h-full relative group/bar">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-600 to-sky-400 rounded-t-sm opacity-80 group-hover/bar:opacity-100 transition-all duration-300 cursor-pointer"
                    style={{ height: `${height}%` }}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {height * 123} views
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>Jan 1</span>
              <span>Jan 15</span>
              <span>Jan 31</span>
            </div>
          </CardContent>
        </Card>

        {/* Devices breakdown */}
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader>
            <CardTitle>Device Categories</CardTitle>
            <CardDescription>Traffic sources by device type.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-4 space-y-6">
              {devices.map((device, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <device.icon className="w-4 h-4 text-slate-400" />
                      {device.name}
                    </div>
                    <span className="font-bold text-slate-900">{device.percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${device.color} transition-all duration-1000 ease-out`}
                      style={{ width: `${device.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-blue-100/50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900">Pro Tip</h4>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                    Mobile traffic is up 12% this week. Ensure your landing pages are fully responsive.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
