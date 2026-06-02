import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Student } from '../../../types';
import toast from 'react-hot-toast';

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
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_DIMENSION = 800; // max dimension to keep quality good but size small
          if (width > height) {
            if (width > MAX_DIMENSION) {
              height *= MAX_DIMENSION / width;
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width *= MAX_DIMENSION / height;
              height = MAX_DIMENSION;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Canvas not supported"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 75% quality (usually resulting in < 200KB)
          resolve(canvas.toDataURL('image/jpeg', 0.75)); 
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Harap unggah file berupa gambar (JPG/PNG).");
        return;
      }
      
      const toastId = toast.loading("Sedang mengompresi foto...");
      try {
        const compressedBase64 = await compressImage(file);
        setFormData({ ...formData, photoUrl: compressedBase64 });
        toast.success("Foto berhasil dikompresi dan ditambahkan!", { id: toastId });
      } catch (err) {
        console.error("Compression error:", err);
        toast.error("Gagal mengompresi foto.", { id: toastId });
      }
    }
  };

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
                  {/* Photo Upload Section */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-200/50">
                    <div className="w-24 h-32 bg-slate-200 rounded-2xl border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative group shadow-inner">
                      {formData.photoUrl ? (
                        <img src={formData.photoUrl} alt="Foto Santri" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-3 text-slate-400">
                          <p className="text-[9px] font-black uppercase tracking-wider">No Photo</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 text-center sm:text-left flex-1">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block">Foto Identitas Santri</label>
                      <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                        <label className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-all select-none">
                          Pilih Foto
                          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                        {formData.photoUrl && (
                          <button type="button" onClick={() => setFormData({ ...formData, photoUrl: '' })} className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-100 transition-all">
                            Hapus
                          </button>
                        )}
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 leading-normal">
                        Rekomendasi rasio 3:4 (Pas Foto resmi). Sistem akan otomatis mengompresi ukuran foto (Auto-compress).
                      </p>
                    </div>
                  </div>

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

                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">NISN / Nomor Induk Santri</label>
                      <input type="text" value={formData.nisn || ''} onChange={(e) => setFormData({ ...formData, nisn: e.target.value })} 
                          className="w-full px-7 py-5 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:border-slate-900 outline-none transition-all" placeholder="Contoh: 2026-05-001" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Tempat Lahir</label>
                          <input type="text" value={formData.tempatLahir || ''} onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })} 
                              className="w-full px-7 py-5 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:border-slate-900 outline-none transition-all" placeholder="Contoh: Cirebon" />
                      </div>
                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Tanggal Lahir</label>
                          <input type="text" value={formData.tanggalLahir || ''} onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })} 
                              className="w-full px-7 py-5 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:border-slate-900 outline-none transition-all" placeholder="Contoh: 12 April 2008" />
                      </div>
                  </div>

                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Alamat Lengkap</label>
                      <input type="text" value={formData.alamat || ''} onChange={(e) => setFormData({ ...formData, alamat: e.target.value })} 
                          className="w-full px-7 py-5 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:border-slate-900 outline-none transition-all" placeholder="Contoh: Beber, Cirebon" />
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
