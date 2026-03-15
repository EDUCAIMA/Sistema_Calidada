import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend: string;
  color: string;
}

export function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  const isPositive = trend.startsWith('+');

  return (
    <Card className="bg-white border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md transition-all overflow-hidden relative group">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-${color}-500/10 transition-all`} />
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2.5 rounded-xl bg-${color}-50 border border-${color}-100`}>
             {/* Note: since color is dynamic we inject it carefully, this assumes Tailwind safelist is configured or tailwind will compile it if it sees the full string somewhere else. In a real scenario color maps to exact class names. For now we stick to the existing class pattern. */}
            <Icon className={`h-5 w-5 text-${color}-600`} />
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {trend}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}
