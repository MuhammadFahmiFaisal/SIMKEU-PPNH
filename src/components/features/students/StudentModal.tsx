import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Student } from '../../../types';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStudent: Student | null;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  editingStudent,
  formData,
  setFormData,
  onSubmit
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl max-h-[95vh] flex flex-col bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="shrink-0 p-8 md:p-12 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div>
                <h3 className="text-3xl font-black text-slate-900 uppercase">{editingStudent ? 'Edit Profil' : 'Pendaftaran Siswa'}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">Lengkapi detail entitas akademik</p>
              </div>
              <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 bg-white">
              <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Kategori Santri</label>
                          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200">
                              {['L', 'P'].map(g => (
                                  <button key={g} type="button" onClick={() => setFormData({...formData, gender: g as 'L' | 'P'})} 
                                      className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all", 
                                          formData.gender === g ? "bg-slate-900 text-white" : "text-slate-400")}>{g === 'L' ? 'Putra' : 'Putri'}</button>
                              ))}
                          </div>
                      </div>
                      <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Status Hunian</label>
                          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200">
                              {['Mondok', 'Ansor'].map(s => (
                                  <button key={s} type="button" onClick={() => setFormData({...formData, residenceStatus: s as 'Mondok' | 'Ansor'})} 
                                      className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all", 
                                          formData.residenceStatus === s ? "bg-slate-900 text-white" : "text-slate-400")}>{s}</button>
                              ))}
                          </div>
                      </div>
                  </div>

                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Nama Lengkap Sesuai Akte</label>
                      <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                          className="w-full px-7 py-5 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:border-slate-900 outline-none transition-all" placeholder="Input Nama Lengkap..." />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Kelas Akademik</label>
                          <input required type="text" value={formData.class} onChange={(e) => setFormData({ ...formData, class: e.target.value })} 
                              className="w-full px-7 py-5 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:border-slate-900 outline-none transition-all" placeholder="Misal: 10 KUI" />
                      </div>
                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">No. WA Wali</label>
                          <input required type="tel" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} 
                              className="w-full px-7 py-5 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:border-slate-900 outline-none transition-all" placeholder="628..." />
                      </div>
                  </div>
              </div>
              
              <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100 space-y-6">
                  <div className="flex items-center gap-4">
                      <input type="checkbox" id="dispensation" 
                          checked={formData.dispensationStatus || false} 
                          onChange={(e) => setFormData({...formData, dispensationStatus: e.target.checked})} 
                          className="w-6 h-6 rounded-md border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer" />
                      <div>
                          <label htmlFor="dispensation" className="text-sm font-black text-slate-900 uppercase tracking-tight cursor-pointer block">Berikan Dispensasi Izin Pulang</label>
                          <p className="text-[10px] font-medium text-slate-500 mt-0.5">Beri centang jika santri diizinkan pulang meskipun ada tunggakan (misal: kendala ekonomi)</p>
                      </div>
                  </div>
                  {formData.dispensationStatus && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Alasan Dispensasi (Wajib diisi jika dicentang)</label>
                          <input type="text" value={formData.dispensationReason || ''} onChange={(e) => setFormData({ ...formData, dispensationReason: e.target.value })} 
                              className="w-full px-7 py-5 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:border-slate-900 outline-none transition-all" placeholder="Contoh: Kendala Ekonomi Keluarga" />
                      </div>
                  )}
              </div>
              
              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-800 shadow-2xl shadow-slate-900/10 transition-all active:scale-95">
                {editingStudent ? 'Konfirmasi Perubahan' : 'Selesaikan Pendaftaran'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
