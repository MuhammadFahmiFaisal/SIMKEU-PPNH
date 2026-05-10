import React from 'react';
import { Mail, Lock } from 'lucide-react';

interface ArrearStatsProps {
  totalUnpaidAll: number;
  totalItemsUnpaid: number;
  canWrite: boolean;
  isAuditor: boolean;
}

export const ArrearStats: React.FC<ArrearStatsProps> = ({ 
  totalUnpaidAll, 
  totalItemsUnpaid, 
  canWrite, 
  isAuditor 
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-0">
      <div className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 shadow-sm">
        <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Belum Terbayar</p>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900">Rp {totalUnpaidAll.toLocaleString()}</h3>
      </div>
      <div className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 shadow-sm">
        <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Item Tunggakan Aktif</p>
        <h3 className="text-2xl sm:text-3xl font-black text-red-600">
          {totalItemsUnpaid} <span className="text-xs sm:text-sm text-slate-400 font-bold ml-1">Tagihan</span>
        </h3>
      </div>
      {canWrite && (
        <div className="bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] text-white flex items-center justify-between group cursor-pointer hover:bg-slate-800 transition-all sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Broadcast</p>
            <h3 className="text-lg sm:text-xl font-black uppercase">Kirim Pengingat</h3>
          </div>
          <Mail size={28} className="text-blue-400" />
        </div>
      )}
      {isAuditor && (
        <div className="bg-slate-100 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] text-slate-400 flex items-center justify-between opacity-60 sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Broadcast</p>
            <h3 className="text-lg sm:text-xl font-black uppercase text-slate-500">Mode Pantau</h3>
          </div>
          <Lock size={28} />
        </div>
      )}
    </div>
  );
};
