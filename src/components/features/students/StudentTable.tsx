import React from 'react';
import { SearchX, Edit2, Trash2, Lock, Printer, CreditCard } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Student } from '../../../types';
import { printClearanceLetter } from '../../../lib/pdfGenerator';

interface StudentTableProps {
  students: Student[];
  canWrite: boolean;
  isSuperAdmin: boolean;
  isAuditor: boolean;
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  onPrintClearance: (student: Student) => void;
  onPrintCard: (student: Student) => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  canWrite,
  isSuperAdmin,
  isAuditor,
  onEdit,
  onDelete,
  onPrintClearance,
  onPrintCard
}) => {
  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col mx-1">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Informasi Santri</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status Mukim</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status Perpulangan</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Detail Wali</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Opsi Pengelolaan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {students.length === 0 ? (
              <tr>
                <td className="px-10 py-32" colSpan={4}>
                  <div className="flex flex-col items-center justify-center text-center">
                      <SearchX size={56} className="text-slate-200 mb-6" />
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Kriteria Tidak Ditemukan</h3>
                      <p className="text-sm font-medium text-slate-500 mt-2 italic">Gunakan kata kunci pencarian yang berbeda.</p>
                  </div>
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-5">
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm transition-transform group-hover:scale-105", 
                        student.gender === 'L' ? "bg-slate-900" : "bg-slate-700"
                      )}>
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-900 uppercase tracking-tight">{student.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{student.class}</span>
                           <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded", 
                             student.gender === 'L' ? "text-slate-600 bg-slate-100" : "text-slate-600 bg-slate-100")}>{student.gender === 'L' ? 'Boy' : 'Girl'}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-center">
                        <span className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border", 
                          student.residenceStatus === 'Mondok' ? "bg-slate-50 text-slate-800 border-slate-200" : "bg-white text-slate-500 border-slate-100"
                        )}>{student.residenceStatus}</span>
                  </td>
                  <td className="px-10 py-7 text-center">
                    {student.totalArrears === 0 || student.dispensationStatus ? (
                      <span className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border bg-emerald-50 text-emerald-700 border-emerald-200">
                        🟢 Diizinkan
                      </span>
                    ) : (
                      <span className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border bg-red-50 text-red-700 border-red-200" title={`Tunggakan: Rp ${student.totalArrears.toLocaleString('id-ID')}`}>
                        🔴 Tertahan
                      </span>
                    )}
                  </td>
                  <td className="px-10 py-7">
                      <div className="space-y-1.5">
                          <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{student.parentName}</p>
                          <p className="text-[10px] font-bold text-slate-500 tracking-widest">WA: {student.whatsapp}</p>
                      </div>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {canWrite && (
                        <button onClick={() => onEdit(student)} className="p-4 bg-white border border-slate-200 text-slate-900 hover:bg-slate-900 hover:text-white rounded-2xl transition-all shadow-sm"><Edit2 size={18} /></button>
                      )}
                      {isSuperAdmin && (
                        <button onClick={() => onDelete(student.id)} className="p-4 bg-white border border-slate-200 text-slate-900 hover:bg-red-600 hover:text-white hover:border-red-600 rounded-2xl transition-all shadow-sm"><Trash2 size={18} /></button>
                      )}
                      {isAuditor && (
                        <div className="p-4 text-slate-200 border border-transparent" title="Mode Auditor (Read-Only)"><Lock size={18} /></div>
                      )}
                    </div>
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
