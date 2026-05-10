import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Arrear } from '../../../types';

interface BulkArrearModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: string[];
  arrears: Arrear[];
  bulkData: {
    type: string;
    month: string;
    amount: number;
    targetClass: string;
    targetResidence: string;
    dueDate: string;
  };
  setBulkData: (data: any) => void;
  isProcessing: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const BulkArrearModal: React.FC<BulkArrearModalProps> = ({
  isOpen,
  onClose,
  classes,
  arrears,
  bulkData,
  setBulkData,
  isProcessing,
  onSubmit
}) => {
  const [isCustomCategory, setIsCustomCategory] = React.useState(false);
  
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
            className="relative w-full max-w-xl bg-white rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
          >
            <div className="p-6 sm:p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 flex-shrink-0">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase">Tagihan Massal</h3>
                <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">Buat tagihan sekaligus ke banyak siswa</p>
              </div>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={onSubmit} className="p-5 sm:p-10 space-y-5 sm:space-y-6 bg-white overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Kelas</label>
                  <select 
                    value={bulkData.targetClass}
                    onChange={(e) => setBulkData({...bulkData, targetClass: e.target.value})}
                    className="w-full px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-slate-900 transition-all"
                  >
                    <option value="Semua">Semua Kelas</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kategori</label>
                  {!isCustomCategory ? (
                    <select 
                      value={bulkData.type}
                      onChange={(e) => {
                        if (e.target.value === 'Lainnya') {
                          setIsCustomCategory(true);
                          setBulkData({...bulkData, type: ''});
                        } else {
                          setBulkData({...bulkData, type: e.target.value});
                        }
                      }}
                      className="w-full px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-slate-900 transition-all cursor-pointer"
                    >
                      <option value="SPP">SPP</option>
                      <option value="Uang Makan">Uang Makan</option>
                      <option value="Kegiatan">Kegiatan</option>
                      {Array.from(new Set(arrears.map(a => a.type))).filter(t => t !== 'SPP' && t !== 'Uang Makan' && t !== 'Kegiatan').map(t => <option key={t} value={t}>{t}</option>)}
                      <option value="Lainnya" className="font-bold text-blue-600 bg-blue-50">+ Tambah Kategori Baru</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        value={bulkData.type}
                        onChange={(e) => setBulkData({...bulkData, type: e.target.value})}
                        placeholder="Ketik kategori baru..."
                        autoFocus
                        className="w-full px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-slate-900 transition-all"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(false);
                          setBulkData({...bulkData, type: 'SPP'});
                        }}
                        className="p-3.5 sm:p-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Periode (Bulan & Tahun)</label>
                <input 
                  type="text" 
                  value={bulkData.month}
                  onChange={(e) => setBulkData({...bulkData, month: e.target.value})}
                  placeholder="Contoh: April 2026"
                  className="w-full px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-slate-900 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nominal (Rp)</label>
                  <input 
                    type="number" 
                    value={bulkData.amount}
                    onChange={(e) => setBulkData({...bulkData, amount: parseInt(e.target.value)})}
                    className="w-full px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-slate-900 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 sm:text-right sm:block">Tenggat Waktu</label>
                  <input 
                    type="date" 
                    value={bulkData.dueDate}
                    onChange={(e) => setBulkData({...bulkData, dueDate: e.target.value})}
                    className="w-full px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-slate-900 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 sm:p-6 bg-slate-50 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Status Mukim</label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-200/50 rounded-2xl">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'mondok', label: 'Mondok' },
                    { id: 'ansor', label: 'Ansor' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBulkData({...bulkData, targetResidence: opt.id as any})}
                      className={cn(
                        "py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase transition-all",
                        bulkData.targetResidence === opt.id 
                          ? "bg-white text-slate-900 shadow-md scale-[1.02]" 
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase italic text-center mt-1">
                  {bulkData.targetResidence === 'all' && "⚠️ Seluruh siswa tanpa kecuali."}
                  {bulkData.targetResidence === 'mondok' && "✅ Hanya siswa yang Mondok."}
                  {bulkData.targetResidence === 'ansor' && "✅ Khusus siswa Ansor."}
                </p>
              </div>

              <button 
                type="submit" 
                disabled={isProcessing}
                className={cn(
                  "w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 mt-4",
                  isProcessing ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100 shadow-blue-900/10"
                )}
              >
                {isProcessing ? 'Sedang Memproses...' : 'Generate Tagihan Sekarang'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
