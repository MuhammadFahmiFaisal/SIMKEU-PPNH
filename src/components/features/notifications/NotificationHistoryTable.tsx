import React from 'react';
import { CheckCircle2, AlertCircle, Smartphone } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Notification } from '../../../types';

interface NotificationHistoryTableProps {
  notifications: Notification[];
  searchQuery: string;
}

export const NotificationHistoryTable: React.FC<NotificationHistoryTableProps> = ({
  notifications,
  searchQuery
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/50">
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Penerima</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Waktu</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Metode</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {notifications.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-bold italic uppercase text-xs tracking-widest">
                {searchQuery ? 'Log tidak ditemukan' : 'Belum ada riwayat pengiriman'}
              </td>
            </tr>
          ) : (
            notifications.map((notif) => (
              <tr key={notif.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                    notif.status === 'Berhasil' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                  )}>
                    {notif.status === 'Berhasil' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                    {notif.status}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{notif.studentName}</p>
                  <p className="text-[10px] text-slate-400 font-bold italic tracking-tighter">Wali: {notif.parentName}</p>
                </td>
                <td className="px-8 py-5 text-xs font-bold text-slate-500 font-mono italic">
                  {notif.date}
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Smartphone size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{notif.type}</span>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
