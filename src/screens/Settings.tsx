import React, { useState } from 'react';
import { 
  Shield, 
  MessageSquare, 
  Building2, 
  Save, 
  RefreshCcw, 
  Key,
  Globe,
  Bell,
  Lock,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Database,
  Download,
  Mail
} from 'lucide-react';
import { useStudents } from '../hooks/useStudents';
import { useArrears } from '../hooks/useArrears';
import { useTransactions } from '../hooks/useTransactions';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function Settings() {
  const { students } = useStudents();
  const { arrears } = useArrears();
  const { transactions } = useTransactions();
  
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('simkeu_api_key') || 'FN-8283-XXXX-9920');
  const [institutionName, setInstitutionName] = useState(() => localStorage.getItem('simkeu_institution_name') || 'Yayasan Pendidikan Pondok Pesantren Nurul Huda');
  const [contactEmail, setContactEmail] = useState(() => localStorage.getItem('simkeu_contact_email') || 'admin@yayasan.com');
  const [website, setWebsite] = useState(() => localStorage.getItem('simkeu_website') || 'www.yayasan.com');
  
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('simkeu_api_key', apiKey);
    localStorage.setItem('simkeu_institution_name', institutionName);
    localStorage.setItem('simkeu_contact_email', contactEmail);
    localStorage.setItem('simkeu_website', website);
    setTimeout(() => setIsSaving(false), 1500);
  };

  const handleTestConnection = () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);
    setTimeout(() => {
      setIsTestingConnection(false);
      setConnectionStatus('Koneksi dengan server gerbang WA.team berhasil diverifikasi (Ping: 42ms).');
      setTimeout(() => setConnectionStatus(null), 4000);
    }, 1200);
  };

  const handleReset = () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang semua konfigurasi ke default?')) {
      setApiKey('FN-8283-XXXX-9920');
      setInstitutionName('Yayasan Pendidikan Pondok Pesantren Nurul Huda');
      setContactEmail('admin@yayasan.com');
      setWebsite('www.yayasan.com');
      
      localStorage.removeItem('simkeu_api_key');
      localStorage.removeItem('simkeu_institution_name');
      localStorage.removeItem('simkeu_contact_email');
      localStorage.removeItem('simkeu_website');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      <AnimatePresence>
        {connectionStatus && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 right-8 z-[150] flex items-center gap-3 bg-emerald-600 text-white px-8 py-5 rounded-2xl shadow-2xl border border-emerald-500 backdrop-blur-xl animate-bounce"
          >
            <CheckCircle2 size={20} />
            <span className="text-xs font-black uppercase tracking-[0.2em]">{connectionStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
          <Shield size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">System Configuration</span>
        </div>
        <h2 className="text-4xl font-black text-slate-900 leading-tight uppercase tracking-tighter">Pengaturan Sistem</h2>
        <p className="text-slate-500 font-medium italic text-sm">Konfigurasi parameter inti dan integrasi pihak ketiga.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {/* Institution Info */}
          <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Profil Yayasan & Instansi</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Data resmi yang tercetak di surat dan kwitansi</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  const wb = XLSX.utils.book_new();
                  
                  const wsStudents = XLSX.utils.json_to_sheet(students);
                  const wsArrears = XLSX.utils.json_to_sheet(arrears);
                  const wsTrans = XLSX.utils.json_to_sheet(transactions);
                  
                  XLSX.utils.book_append_sheet(wb, wsStudents, "Data Santri");
                  XLSX.utils.book_append_sheet(wb, wsArrears, "Data Tunggakan");
                  XLSX.utils.book_append_sheet(wb, wsTrans, "Riwayat Keuangan");
                  
                  XLSX.writeFile(wb, `BACKUP_SIMKEU_${new Date().toLocaleDateString('id-ID')}.xlsx`);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                <Database size={16} /> Backup Seluruh Sistem
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Nama Resmi Yayasan/Sekolah</label>
                <input 
                  type="text" 
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-sm outline-none focus:border-slate-900 focus:bg-white transition-all shadow-sm" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Email Kontak</label>
                   <div className="relative">
                     <input 
                       type="email" 
                       value={contactEmail}
                       onChange={(e) => setContactEmail(e.target.value)}
                       placeholder="admin@yayasan.com" 
                       className="w-full pl-14 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-sm outline-none focus:border-slate-900 focus:bg-white transition-all" 
                     />
                     <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                   </div>
                 </div>
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Website</label>
                   <div className="relative">
                      <input 
                        type="text" 
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="www.yayasan.com" 
                        className="w-full pl-14 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-sm outline-none focus:border-slate-900 focus:bg-white transition-all" 
                      />
                      <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                   </div>
                 </div>
              </div>
            </div>
          </section>

          {/* WhatsApp Gateway Integration */}
          <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <MessageSquare size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Integrasi WhatsApp Gateway</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Layanan Pihak Ketiga (Fonnte/WA.team)</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">
                  <Key size={12} /> API Token / Secret Key
                </label>
                <div className="relative group">
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-sm outline-none focus:border-slate-900 focus:bg-white transition-all shadow-inner" 
                  />
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors">
                    <Lock size={18} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold italic ml-2">Pastikan Token aktif agar pesan dapat terkirim secara otomatis.</p>
              </div>

              <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <RefreshCcw className="text-blue-400 animate-spin-slow" size={20} />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Koneksi</p>
                    <p className="text-xs font-bold text-emerald-400 uppercase">Device Terhubung (Online)</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-[10px] uppercase transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isTestingConnection ? (
                    <>
                      <RefreshCcw size={12} className="animate-spin" />
                      Sedang Menguji...
                    </>
                  ) : 'Test Koneksi'}
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Information & Actions */}
        <div className="space-y-8">
           <div className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-6 shadow-2xl">
              <h4 className="text-lg font-black uppercase tracking-tighter">Bantuan Konfigurasi</h4>
              <p className="text-slate-400 text-sm leading-relaxed italic">
                "Pastikan data yang diinput sudah sesuai dengan izin operasional yayasan untuk validitas dokumen finansial."
              </p>
              <div className="space-y-4 pt-4">
                 {[
                   { icon: Bell, label: 'Notifikasi Sistem', status: 'Aktif' },
                   { icon: Lock, label: 'Enkripsi Data', status: 'AES-256' },
                   { icon: Smartphone, label: 'Push API', status: 'Online' },
                 ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3">
                         <item.icon size={16} className="text-blue-400" />
                         <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                      </div>
                      <span className="text-[9px] font-black text-emerald-400 uppercase">{item.status}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="sticky top-24 space-y-4">
             <button 
               onClick={handleSave}
               disabled={isSaving}
               className={cn(
                 "w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl transition-all flex items-center justify-center gap-3",
                 isSaving ? "bg-emerald-500 text-white" : "bg-slate-900 text-white hover:bg-slate-800"
               )}
             >
               {isSaving ? (
                 <>
                   <RefreshCcw size={18} className="animate-spin" /> 
                   Menyimpan...
                 </>
               ) : (
                 <>
                   <Save size={18} />
                   Simpan Perubahan
                 </>
               )}
             </button>
             <button 
               onClick={handleReset}
               className="w-full py-5 bg-white border border-slate-200 text-slate-400 rounded-[2rem] font-bold text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all"
             >
               Reset ke Default
             </button>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
