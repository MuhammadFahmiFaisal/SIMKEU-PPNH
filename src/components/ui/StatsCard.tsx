import React from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  trend?: string;
  trendColor?: 'green' | 'red' | 'amber' | 'blue';
  loading?: boolean;
}

export function StatsCard({ 
  label, 
  value, 
  subtext, 
  icon: Icon, 
  trend, 
  trendColor = 'green',
  loading = false 
}: StatsCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "p-3 rounded-lg transition-colors",
          "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
        )}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className={cn(
            "text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider",
            trendColor === 'green' && "bg-green-50 text-green-700",
            trendColor === 'red' && "bg-red-50 text-red-700",
            trendColor === 'amber' && "bg-amber-50 text-amber-700",
            trendColor === 'blue' && "bg-blue-50 text-blue-700"
          )}>
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</h3>
      <p className="text-2xl font-bold text-slate-900 leading-tight tracking-tight">{value}</p>
      <p className="text-[11px] text-slate-400 mt-2 font-medium">{subtext}</p>
    </div>
  );
}
