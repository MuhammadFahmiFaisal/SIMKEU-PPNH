import React from 'react';
import { Users, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface NotificationStatsProps {
  stats: {
    pendingCount: number;
    successCount: number;
    failedCount: number;
    totalCount: number;
  };
}

export const NotificationStats: React.FC<NotificationStatsProps> = ({ stats }) => {
  const items = [
    { label: 'Siswa Menunggu', value: stats.pendingCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Terkirim Berhasil', value: stats.successCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Gagal Kirim', value: stats.failedCount, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Total Broadcast', value: stats.totalCount, icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {items.map((item, i) => (
        <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{item.label}</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{item.value}</p>
            </div>
            <div className={cn("p-3 rounded-2xl shadow-sm group-hover:scale-110 transition-transform", item.bg, item.color)}>
              <item.icon size={20} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
