import React from 'react';
import { Eye } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Student } from '../../../types';

interface GroupedArrear {
  student: Student;
  totalUnpaid: number;
  count: number;
}

interface ArrearTableProps {
  groupedData: GroupedArrear[];
  onDetailClick: (studentId: string) => void;
}

export const ArrearTable: React.FC<ArrearTableProps> = ({ groupedData, onDetailClick }) => {
  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden mx-4 sm:mx-1">
      {/* Mobile Card View */}
      <div className="block sm:hidden divide-y divide-slate-100">
        {groupedData.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-slate-400 italic font-medium text-xs">Tidak ada data tunggakan.</p>
          </div>
        ) : (
          groupedData.map((group) => (
            <div key={group.student.id} className="p-5 space-y-4 active:bg-slate-50 transition-colors" onClick={() => onDetailClick(group.student.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-md">
                    {group.student.name.charAt(0)}
                  </div>
                  <div className="max-w-[150px]">
                    <p className="text-xs font-black text-slate-900 uppercase truncate">{group.student.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[9px] text-slate-500 font-bold uppercase">{group.student.class}</p>
                      <span className={cn(
                        "text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md border",
                        group.student.residenceStatus === 'Mondok' 
                          ? "bg-indigo-50 text-indigo-600 border-indigo-100" 
                          : "bg-orange-50 text-orange-600 border-orange-100"
                      )}>
                        {group.student.residenceStatus}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-md text-[8px] font-black uppercase border",
                  group.count > 0 ? "bg-red-50 text-red-700 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                )}>
                  {group.count} Item
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                <div>
                  <p className="text-xs font-black text-slate-900">Rp {group.totalUnpaid.toLocaleString()}</p>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Unpaid Balance</p>
                </div>
                <button 
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                >
                  Detail
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Siswa & Kelas</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Jumlah Item</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Tunggakan</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {groupedData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-10 py-20 text-center">
                  <p className="text-slate-400 italic font-medium">Tidak ada data tunggakan yang ditemukan.</p>
                </td>
              </tr>
            ) : (
              groupedData.map((group) => (
                <tr key={group.student.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                        {group.student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{group.student.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">{group.student.class}</p>
                          <span className="text-slate-300">•</span>
                          <span className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5 rounded-md border",
                            group.student.residenceStatus === 'Mondok' 
                              ? "bg-indigo-50 text-indigo-600 border-indigo-100" 
                              : "bg-orange-50 text-orange-600 border-orange-100"
                          )}>
                            {group.student.residenceStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase border",
                      group.count > 0 ? "bg-red-50 text-red-700 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                    )}>
                      {group.count} Item
                    </span>
                  </td>
                  <td className="px-10 py-7">
                    <p className="text-sm font-black text-slate-900">Rp {group.totalUnpaid.toLocaleString()}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Unpaid Balance</p>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <button 
                      onClick={() => onDetailClick(group.student.id)}
                      className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center gap-2 ml-auto"
                    >
                      <Eye size={14} /> Lihat Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
