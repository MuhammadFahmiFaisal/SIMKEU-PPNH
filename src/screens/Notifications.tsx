import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Smartphone,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useStudents } from '../hooks/useStudents';
import { useArrears } from '../hooks/useArrears';
import { useNotifications } from '../hooks/useNotifications';
import { useConfirm } from '../context/ConfirmContext';

// Sub-components
import { NotificationStats } from '../components/features/notifications/NotificationStats';
import { NotificationFilters } from '../components/features/notifications/NotificationFilters';
import { NotificationTable } from '../components/features/notifications/NotificationTable';
import { NotificationHistoryTable } from '../components/features/notifications/NotificationHistoryTable';
import { PdfPreviewModal } from '../components/features/notifications/PdfPreviewModal';
import { useNotificationLogic } from '../components/features/notifications/useNotificationLogic';
import { generateArrearPdf } from '../lib/pdfGenerator';

export function Notifications() {
  const { students } = useStudents();
  const { arrears } = useArrears();
  const { notifications, sendNotification, sendBroadcastNotification } = useNotifications();
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('Semua');
  const [filterResidence, setFilterResidence] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [sortBy, setSortBy] = useState<any>('name');
  const [previewPdf, setPreviewPdf] = useState<{ url: string; fileName: string } | null>(null);

  // Broadcast States
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState(0);
  const [broadcastCompleted, setBroadcastCompleted] = useState(false);
  const [confirmBroadcast, setConfirmBroadcast] = useState(false);

  const handleBroadcast = async () => {
    if (filteredPending.length === 0) return;
    setIsBroadcasting(true);
    setBroadcastProgress(0);
    setBroadcastCompleted(false);

    const targetIds = filteredPending.map(s => s.id);
    const total = targetIds.length;

    for (let i = 0; i < total; i++) {
      await new Promise(resolve => setTimeout(resolve, 300)); // Visual premium delay
      await sendBroadcastNotification([targetIds[i]]);
      setBroadcastProgress(Math.round(((i + 1) / total) * 100));
    }

    setIsBroadcasting(false);
    setBroadcastCompleted(true);
    setConfirmBroadcast(false);
  };

  const {
    filteredPending,
    filteredHistory,
    classes,
    stats
  } = useNotificationLogic({
    students,
    notifications,
    activeTab,
    searchQuery,
    filterClass,
    filterResidence,
    filterStatus,
    sortBy
  });

  const handleSendWA = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    const confirmSend = await confirm({
      title: 'Kirim Notifikasi',
      message: `Apakah Anda yakin ingin mengirim notifikasi WhatsApp tagihan kepada wali murid "${student?.name || 'terkait'}"?`,
      type: 'info'
    });
    if (!confirmSend) return;

    setSendingId(studentId);
    setTimeout(() => {
      sendNotification(studentId);
      setSendingId(null);
    }, 1500);
  };

  const handlePreview = async (studentId: string) => {
    setIsProcessing(true);
    try {
      const student = students.find(s => s.id === studentId);
      const studentArrears = arrears.filter(a => a.studentId === studentId && a.status !== 'Lunas');
      if (!student) return;

      const doc = await generateArrearPdf(student, studentArrears);
      if (!doc) return;
      
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPreviewPdf({ url, fileName: `Tagihan_${student.name}.pdf` });
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadFromPreview = () => {
    if (!previewPdf) return;
    const link = document.createElement('a');
    link.href = previewPdf.url;
    link.download = previewPdf.fileName;
    link.click();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <AnimatePresence>
        {sendingId && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 right-8 z-[100] flex items-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-[1.5rem] shadow-2xl border border-white/10"
          >
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest">Mengirim Notifikasi WhatsApp...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <PdfPreviewModal 
        previewPdf={previewPdf}
        onClose={() => setPreviewPdf(null)}
        onDownload={handleDownloadFromPreview}
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-slate-900 leading-tight uppercase tracking-tighter">Pusat Notifikasi</h2>
          <p className="text-slate-500 text-sm font-medium italic">Kirim pengingat tagihan dengan tampilan surat modern dan profesional.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
          <button 
            onClick={() => { 
              setActiveTab('pending'); 
              setSortBy('name'); 
              setFilterClass('Semua'); 
              setFilterResidence('Semua');
            }}
            className={cn(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'pending' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Menunggu
          </button>
          <button 
            onClick={() => { 
              setActiveTab('history'); 
              setSortBy('date_desc'); 
              setFilterStatus('Semua');
            }}
            className={cn(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'history' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Riwayat
          </button>
        </div>
      </div>

      <NotificationStats stats={stats} />

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <NotificationFilters 
          activeTab={activeTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterClass={filterClass}
          setFilterClass={setFilterClass}
          filterResidence={filterResidence}
          setFilterResidence={setFilterResidence}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          sortBy={sortBy}
          setSortBy={setSortBy}
          classes={classes}
        />
        
        {activeTab === 'pending' ? (
          <NotificationTable 
            students={filteredPending}
            onPreview={handlePreview}
            onSend={handleSendWA}
            searchQuery={searchQuery}
          />
        ) : (
          <NotificationHistoryTable 
            notifications={filteredHistory}
            searchQuery={searchQuery}
          />
        )}
      </div>

      <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full -ml-10 -mb-10 blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-md">
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Kirim BROADCAST Massal</h3>
            <p className="text-blue-100/70 text-sm font-medium mt-2 leading-relaxed">
              Konfirmasikan rincian surat melalui pratinjau sebelum melakukan pengiriman massal ke semua wali murid.
            </p>
          </div>
          <button 
            onClick={() => setIsBroadcastModalOpen(true)}
            disabled={filteredPending.length === 0}
            className={cn(
              "px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl",
              filteredPending.length === 0 
                ? "bg-blue-300 text-blue-100 cursor-not-allowed opacity-80"
                : "bg-white text-blue-700 hover:bg-blue-50 shadow-blue-900/20"
            )}
          >
            Kirim BROADCAST Sekarang
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isBroadcastModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => !isBroadcasting && setIsBroadcastModalOpen(false)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase">Broadcast Massal</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 italic">Kirim pengingat tagihan otomatis</p>
                  </div>
                </div>
                {!isBroadcasting && (
                  <button 
                    onClick={() => setIsBroadcastModalOpen(false)} 
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-all"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
              
              <div className="p-8 space-y-6">
                {!broadcastCompleted ? (
                  <>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0 mt-0.5">
                        <AlertCircle size={18} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700">Pernyataan Konfirmasi (ISO 9241)</p>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                          Anda akan menyiarkan pesan pengingat tagihan ke seluruh <span className="text-slate-900 font-bold">{filteredPending.length} santri</span> yang memiliki tunggakan terdeteksi. WhatsApp Gateway akan mencatat riwayat notifikasi secara otomatis di cloud database.
                        </p>
                      </div>
                    </div>

                    {isBroadcasting ? (
                      <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin text-indigo-600" />
                            Mengirim Pesan...
                          </span>
                          <span className="text-indigo-600 font-black">{broadcastProgress}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" 
                            initial={{ width: 0 }}
                            animate={{ width: `${broadcastProgress}%` }}
                            transition={{ duration: 0.1 }}
                          />
                        </div>
                        <p className="text-center text-[10px] text-slate-400 font-bold italic">Mohon jangan menutup tab atau menyegarkan halaman ini.</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Daftar Penerima ({filteredPending.length})</p>
                          {filteredPending.slice(0, 5).map(s => (
                            <div key={s.id} className="flex justify-between items-center px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700">
                              <span>{s.name} ({s.class})</span>
                              <span className="text-indigo-600 font-bold">Rp {s.totalArrears.toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                          {filteredPending.length > 5 && (
                            <p className="text-[10px] text-slate-400 font-bold text-center italic mt-2">...dan {filteredPending.length - 5} santri lainnya.</p>
                          )}
                        </div>

                        <label className="flex items-start gap-3 p-4 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl border border-indigo-100/50 cursor-pointer transition-all select-none">
                          <input 
                            type="checkbox" 
                            checked={confirmBroadcast}
                            onChange={(e) => setConfirmBroadcast(e.target.checked)}
                            className="mt-1 accent-indigo-600 rounded cursor-pointer"
                          />
                          <span className="text-[10px] font-bold text-indigo-900 leading-relaxed uppercase">Saya mengonfirmasi bahwa data ini benar dan siap melakukan siaran massal.</span>
                        </label>

                        <button 
                          onClick={handleBroadcast}
                          disabled={!confirmBroadcast}
                          className={cn(
                            "w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 mt-4",
                            !confirmBroadcast 
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
                          )}
                        >
                          Mulai Siaran Massal
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 space-y-6 flex flex-col items-center">
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1, rotate: 360 }} 
                      className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-50"
                    >
                      <CheckCircle2 size={40} />
                    </motion.div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-black text-slate-900 uppercase">Siaran Berhasil Dikirim</h4>
                      <p className="text-xs text-slate-400 font-bold max-w-xs leading-relaxed uppercase">Sebanyak {filteredPending.length} log notifikasi telah berhasil dicatat ke server cloud Supabase.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setIsBroadcastModalOpen(false);
                        setTimeout(() => {
                          setBroadcastCompleted(false);
                          setBroadcastProgress(0);
                        }, 500);
                      }}
                      className="px-8 py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-md"
                    >
                      Selesai
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
