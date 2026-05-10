import React from 'react';
import { CheckCircle2, Smartphone, ExternalLink, Eye, Send } from 'lucide-react';
import { Student } from '../../../types';

interface NotificationTableProps {
  students: Student[];
  onPreview: (id: string) => void;
  onSend: (id: string) => void;
  searchQuery: string;
}

export const NotificationTable: React.FC<NotificationTableProps> = ({
  students,
  onPreview,
  onSend,
  searchQuery
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/50">
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Siswa</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">WhatsApp</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Total Tagihan</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Aksi Cepat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {students.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-8 py-20 text-center">
                <div className="flex flex-col items-center opacity-30">
                  <CheckCircle2 size={48} className="text-emerald-500 mb-4" />
                  <p className="font-black uppercase tracking-widest text-slate-900">
                    {searchQuery ? 'Hasil Tidak Ditemukan' : 'Semua Tagihan Bersih'}
                  </p>
                  <p className="text-xs font-medium italic mt-1">
                    {searchQuery ? 'Coba gunakan kata kunci pencarian lain.' : 'Tidak ada notifikasi yang perlu dikirim.'}
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            students.map((student) => (
              <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-black text-sm shadow-sm ring-2 ring-white">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors">{student.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{student.class}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer group/wa">
                    <Smartphone size={14} />
                    <span className="text-xs font-mono font-bold tracking-tighter">+{student.whatsapp}</span>
                    <ExternalLink size={10} className="opacity-0 group-hover/wa:opacity-100 transition-opacity" />
                  </div>
                </td>
                <td className="px-8 py-6">
                  <p className="text-sm font-black text-red-500">Rp {student.totalArrears.toLocaleString()}</p>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      onClick={() => onPreview(student.id)}
                      className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-slate-50 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm flex items-center gap-2"
                      title="Pratinjau PDF"
                    >
                      <Eye size={16} />
                      <span className="text-[9px] font-black uppercase tracking-tighter">Preview</span>
                    </button>
                    <button 
                      onClick={() => onSend(student.id)}
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                    >
                      <Send size={14} className="fill-white" />
                      Kirim WA
                    </button>
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
