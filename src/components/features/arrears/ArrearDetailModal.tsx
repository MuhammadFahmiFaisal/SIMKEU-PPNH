import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, CheckCircle, Trash2, ShieldCheck, CheckCircle2, FileText, Edit2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Student, Arrear } from '../../../types';

interface ArrearDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | undefined;
  arrears: Arrear[];
  showPaid: boolean;
  canWrite: boolean;
  isAuditor: boolean;
  partialPayingId: string | null;
  setPartialPayingId: (id: string | null) => void;
  partialInput: string;
  setPartialInput: (val: string) => void;
  processPayment: (id: string, amount: number) => Promise<void>;
  deleteArrear: (id: string) => Promise<void>;
  updateArrear: (id: string, data: Partial<Arrear>) => Promise<void>;
  sendConsolidatedReceipt: (studentId: string, payments: { type: string, month: string, amount: number }[]) => Promise<void>;
  previewReceiptPDF: (studentId: string, payments: { type: string, month: string, amount: number }[]) => Promise<void>;
}

export const ArrearDetailModal: React.FC<ArrearDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  arrears,
  showPaid,
  canWrite,
  isAuditor,
  partialPayingId,
  setPartialPayingId,
  partialInput,
  setPartialInput,
  processPayment,
  deleteArrear,
  updateArrear,
  sendConsolidatedReceipt,
  previewReceiptPDF
}) => {
  const [sessionPayments, setSessionPayments] = React.useState<{ type: string, month: string, amount: number }[]>([]);
  const [editingArrearId, setEditingArrearId] = React.useState<string | null>(null);
  const [editInput, setEditInput] = React.useState('');

  if (!student) return null;

  const handleProcessPayment = async (id: string, amount: number) => {
    const arrear = arrears.find(a => a.id === id);
    if (!arrear) return;

    const isFullPayment = amount >= arrear.amount;
    const paymentLabel = isFullPayment ? `${arrear.type} (Lunas)` : `${arrear.type} (Cicilan)`;

    await processPayment(id, amount);

    setSessionPayments(prev => [...prev, {
      type: paymentLabel,
      month: arrear.month,
      amount
    }]);
  };

  const filteredArrears = arrears.filter(a =>
    a.studentId === student.id && (showPaid ? true : a.status !== 'Lunas')
  );

  const totalOutstanding = arrears
    .filter(a => a.studentId === student.id && a.status !== 'Lunas')
    .reduce((sum, a) => sum + a.amount, 0);

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
            className="relative w-full max-w-4xl bg-white rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]"
          >
            <div className="p-6 sm:p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3 sm:gap-5">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-slate-900 text-white rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-base sm:text-xl shadow-xl">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tighter line-clamp-1">
                    {student.name}
                  </h3>
                  <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest">Rincian Tunggakan Akademik</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 sm:p-3 text-slate-400 hover:text-slate-900"><X size={24} /></button>
            </div>

            <div className="p-4 sm:p-10 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
              {filteredArrears.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={40} />
                  </div>
                  <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Semua Tagihan Telah Dilunasi</p>
                </div>
              ) : (
                 <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {filteredArrears.map((item) => (
                      <div key={item.id} className="p-5 sm:p-6 bg-slate-50 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between group gap-4">
                        <div className="flex items-center gap-4 sm:gap-6">
                          <div className={cn(
                            "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0",
                            item.status === 'Lunas' ? "bg-emerald-500 text-white" : "bg-white text-slate-400"
                          )}>
                            <Wallet size={18} />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-black text-slate-900 uppercase">{item.type} - {item.month}</p>
                            <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Jatuh Tempo: {item.dueDate}</p>
                          </div>
                        </div>
                        <div className="flex flex-row flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-3 sm:gap-6 border-t sm:border-t-0 border-slate-100 pt-4 sm:pt-0">
                          <div className="text-right">
                            <p className="text-base sm:text-lg font-black text-slate-900">Rp {item.amount.toLocaleString()}</p>
                            <span className={cn(
                              "text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                              item.status === 'Lunas' ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
                            )}>{item.status}</span>
                          </div>
  
                          {canWrite && item.status !== 'Lunas' && (
                            <div className="flex items-center gap-2">
                             {editingArrearId === item.id ? (
                               <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                                 <input
                                   type="number"
                                   autoFocus
                                   value={editInput}
                                   onChange={(e) => setEditInput(e.target.value)}
                                   placeholder="Nominal baru..."
                                   className="w-24 px-3 py-2 text-[10px] font-bold outline-none border border-slate-100 rounded-lg"
                                 />
                                 <button
                                   onClick={async () => {
                                     const val = Number(editInput);
                                     if (val > 0) {
                                       await updateArrear(item.id, { amount: val });
                                       setEditingArrearId(null);
                                       setEditInput('');
                                     }
                                   }}
                                   className="px-3 py-2 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-blue-700 transition-colors"
                                 >
                                   Simpan
                                 </button>
                                 <button onClick={() => setEditingArrearId(null)} className="px-2 py-2 text-slate-400 hover:text-slate-900"><X size={14} /></button>
                               </motion.div>
                             ) : partialPayingId === item.id ? (
                               <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                                 <input
                                   type="number"
                                   autoFocus
                                   value={partialInput}
                                   onChange={(e) => setPartialInput(e.target.value)}
                                   placeholder="Nominal..."
                                   className="w-24 px-3 py-2 text-[10px] font-bold outline-none"
                                 />
                                 <button
                                   onClick={async () => {
                                     const val = Number(partialInput);
                                     if (val > 0) {
                                       await handleProcessPayment(item.id, val);
                                       setPartialPayingId(null);
                                       setPartialInput('');
                                     }
                                   }}
                                   className="px-3 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase"
                                 >
                                   Bayar
                                 </button>
                                 <button onClick={() => setPartialPayingId(null)} className="px-2 py-2 text-slate-400 hover:text-slate-900"><X size={14} /></button>
                               </motion.div>
                             ) : (
                               <div className="flex items-center gap-2">
                                 <button
                                   onClick={() => {
                                     setPartialPayingId(item.id);
                                     setPartialInput('');
                                   }}
                                   className="px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-50 text-blue-600 rounded-xl font-black text-[8px] sm:text-[9px] uppercase tracking-widest hover:bg-blue-100 transition-all active:scale-95 flex items-center gap-2"
                                 >
                                   Cicilan
                                 </button>
                                 <button
                                   onClick={() => handleProcessPayment(item.id, item.amount)}
                                   className="px-4 sm:px-5 py-2.5 sm:py-3 bg-emerald-500 text-white rounded-xl font-black text-[8px] sm:text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 active:scale-95 flex items-center gap-2"
                                 >
                                   <CheckCircle size={14} /> Lunas
                                 </button>
                               </div>
                             )}
                            </div>
                          )}

                          {canWrite && (
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              {item.status !== 'Lunas' && editingArrearId !== item.id && (
                                <button
                                  onClick={() => {
                                    setEditingArrearId(item.id);
                                    setEditInput(item.amount.toString());
                                  }}
                                  className="p-3 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                  title="Edit Nominal"
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => { if (window.confirm('Hapus tagihan ini secara permanen?')) deleteArrear(item.id); }}
                                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="Hapus Tagihan"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}

                          {isAuditor && (
                            <div className="p-3 text-slate-300 ml-4">
                              <ShieldCheck size={18} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                 </div>
              )}
            </div>

             <div className="p-6 sm:p-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-10">
               <div>
                 <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Outstanding</p>
                 <h4 className="text-2xl sm:text-3xl font-black text-slate-900">
                   Rp {totalOutstanding.toLocaleString()}
                 </h4>
               </div>
               <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3 w-full sm:w-auto">
                 {sessionPayments.length > 0 && (
                   <div className="flex flex-col sm:flex-row gap-3">
                     <button
                       onClick={() => previewReceiptPDF(student.id, sessionPayments)}
                       className="px-6 py-4 bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2 order-2 sm:order-1"
                     >
                       <FileText size={18} /> Lihat PDF
                     </button>
                     <button
                       onClick={() => sendConsolidatedReceipt(student.id, sessionPayments)}
                       className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 animate-in slide-in-from-right-4 duration-500 order-1 sm:order-2"
                     >
                       <CheckCircle2 size={18} /> Kirim Struk WA ({sessionPayments.length})
                     </button>
                   </div>
                 )}
                 <button onClick={onClose} className="px-10 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold text-[10px] sm:text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all text-center">Tutup Rincian</button>
               </div>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
