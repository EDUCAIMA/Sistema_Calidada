import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { ActivityLog } from '@/lib/admin/admin-mock-data';

interface ActivityFeedProps {
  activities: ActivityLog[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card className="bg-[#111927]/60 backdrop-blur-md border-white/5 shadow-xl h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-white">Actividad Reciente</CardTitle>
        <CardDescription className="text-slate-500 text-xs">Alertas y cambios de sistemas</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <div className="space-y-6 flex-1">
          {activities.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex gap-4 items-center">
                <div className={`h-10 w-10 shrink-0 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${item.iconColor}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white leading-tight">{item.company}</span>
                  <span className="text-xs text-slate-400 mt-1">{item.action}</span>
                  <span className="text-[10px] text-slate-500 font-medium mt-1 uppercase">{item.time}</span>
                </div>
              </div>
            );
          })}
        </div>
        <Button variant="ghost" className="w-full mt-4 text-xs text-slate-400 hover:text-blue-400 hover:bg-blue-400/5 group border border-white/5 rounded-xl">
          Ver todo el historial
          <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}
