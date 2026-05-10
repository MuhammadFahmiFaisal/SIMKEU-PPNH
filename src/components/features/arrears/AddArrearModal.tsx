import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, CheckCircle2, Plus, Trash2, ArrowRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Student, Arrear } from '../../../types';

interface AddArrearModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  arrears: Arrear[];
  arrearLines: Omit<Arrear, 'id' | 'studentId' | 'status'>[];
  setArrearLines: (lines: Omit<Arrear, 'id' | 'studentId' | 'status'>[]) => void;
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  studentSearchQuery: string;
  setStudentSearchQuery: (query: string) => void;
  isProcessing: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddArrearModal: React.FC<AddArrearModalProps> = ({
  isOpen,
  onClose,
  students,
  arrears,
  arrearLines,
  setArrearLines,
  selectedStudentId,
  setSelectedStudentId,
  studentSearchQuery,
  setStudentSearchQuery,
  isProcessing,
  onSubmit
}) => {
  const [customLines, setCustomLines] = React.useState<number[]>([]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
           <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white w-full max-w-4xl rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]"
           >
              <div className="p-6 sm:p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                 <div>
                   <h3 className="text-lg sm:text-2xl font-black text-slate-900 uppercase">Tambah Tagihan</h3>
                   <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">Entri data tagihan khusus untuk santri tertentu</p>
                 </div>
                 <button onClick={onClose} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-all"><X size={20} /></button>
              </div>
              <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 sm:p-10 space-y-6 sm:space-y-8 bg-white">
                 <div className="space-y-4 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cari & Pilih Siswa</label>
                    <div className="relative">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={studentSearchQuery}
                        onChange={(e) => {
                          setStudentSearchQuery(e.target.value);
                          if (selectedStudentId) setSelectedStudentId('');
                        }}
                        placeholder="Ketik nama santri..." 
                        className={cn(
                          "w-full pl-14 sm:pl-16 pr-8 py-4 sm:py-5 bg-slate-50 border border-slate-200 rounded-[1.2rem] sm:rounded-[1.5rem] font-bold text-xs sm:text-sm outline-none transition-all focus:border-slate-900 focus:bg-white",
                          selectedStudentId && "border-emerald-500 bg-emerald-50 text-emerald-900"
                        )}
                      />
                      {selectedStudentId && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-emerald-600">
                           <CheckCircle2 size={14} />
                           <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Terpilih</span>
                        </div>
                      )}
                    </div>
                    
                    <AnimatePresence>
                      {!selectedStudentId && studentSearchQuery.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-[110] left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl overflow-hidden max-h-60 overflow-y-auto"
                        >
                          {students
                            .filter(s => s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()))
                            .map(s => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setSelectedStudentId(s.id);
                                  setStudentSearchQuery(s.name);
                                }}
                                className="w-full px-8 py-4 text-left hover:bg-slate-50 flex items-center justify-between group transition-colors border-b border-slate-50 last:border-0"
                              >
                                <div>
                                  <p className="text-sm font-black text-slate-900 uppercase group-hover:text-blue-600">{s.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{s.class} • {s.residenceStatus}</p>
                                </div>
                                <ArrowRight size={16} className="text-slate-200 group-hover:text-blue-600 transition-colors" />
                              </button>
                            ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Tagihan</label>
                      <button type="button" onClick={() => setArrearLines([...arrearLines, { type: 'SPP', month: 'Mei 2026', amount: 250000, dueDate: new Date().toISOString().split('T')[0] }])} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"> <Plus size={14} /> Tambah Baris</button>
                    </div>
                    <div className="space-y-4">
                      {arrearLines.map((line, i) => (
                        <div key={i} className="flex flex-col gap-4 p-5 sm:p-6 bg-slate-50 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 group hover:bg-white hover:border-slate-200 transition-all relative">
                           <div className="grid grid-cols-1 sm:grid-cols-11 gap-4">
                             <div className="sm:col-span-4 space-y-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                                {!customLines.includes(i) ? (
                                  <select 
                                    value={line.type} 
                                    onChange={(e) => { 
                                      if (e.target.value === 'Lainnya') {
                                        setCustomLines(prev => [...prev, i]);
                                        const n = [...arrearLines]; n[i].type = ''; setArrearLines(n);
                                      } else {
                                        const n = [...arrearLines]; n[i].type = e.target.value; setArrearLines(n); 
                                      }
                                    }} 
                                    className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-slate-900 outline-none cursor-pointer"
                                  >
                                  <option value="SPP">SPP</option>
                                  <option value="Uang Makan">Uang Makan</option>
                                  <option value="Kegiatan">Kegiatan</option>
                                  {Array.from(new Set(arrears.map(a => a.type))).filter(t => t !== 'SPP' && t !== 'Uang Makan' && t !== 'Kegiatan').map(t => <option key={t} value={t}>{t}</option>)}
                                  <option value="Lainnya" className="font-bold text-blue-600 bg-blue-50">+ Tambah Kategori Baru</option>
                                </select>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="text" 
                                    value={line.type} 
                                    onChange={(e) => { const n = [...arrearLines]; n[i].type = e.target.value; setArrearLines(n); }} 
                                    className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-slate-900 outline-none" 
                                    placeholder="Ketik kategori..." 
                                    autoFocus
                                  />
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      setCustomLines(prev => prev.filter(idx => idx !== i));
                                      const n = [...arrearLines]; n[i].type = 'SPP'; setArrearLines(n);
                                    }}
                                    className="p-3 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              )}
                           </div>
                           <div className="sm:col-span-3 space-y-2">
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Bulan/Periode</label>
                              <input type="text" value={line.month} onChange={(e) => { const n = [...arrearLines]; n[i].month = e.target.value; setArrearLines(n); }} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-slate-900 outline-none" placeholder="Mei 2026" />
                           </div>
                           <div className="sm:col-span-4 space-y-2">
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal (Rp)</label>
                              <input type="number" value={line.amount} onChange={(e) => { const n = [...arrearLines]; n[i].amount = Number(e.target.value); setArrearLines(n); }} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-slate-900 outline-none" placeholder="250000" />
                           </div>
                           </div>
                           <button 
                            type="button" 
                            onClick={() => setArrearLines(arrearLines.filter((_, idx) => idx !== i))} 
                            className="absolute -top-2 -right-2 sm:static sm:top-auto sm:right-auto p-2 bg-red-50 sm:bg-transparent text-red-500 sm:text-slate-300 hover:text-red-600 rounded-full sm:rounded-lg transition-all shadow-sm sm:shadow-none"
                           >
                            <Trash2 size={16} />
                           </button>
                        </div>
                      ))}
                    </div>
                 </div>

                 <button 
                  type="submit" 
                  disabled={isProcessing || !selectedStudentId}
                  className={cn(
                    "w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95",
                    isProcessing || !selectedStudentId 
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                      : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20"
                  )}
                 >
                   {isProcessing ? 'Sedang Menyimpan...' : 'Simpan Seluruh Tagihan'}
                 </button>
              </form>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
