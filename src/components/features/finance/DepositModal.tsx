import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HandCoins } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useTransactions } from '../../../hooks/useTransactions';
import { useConfirm } from '../../../context/ConfirmContext';
import toast from 'react-hot-toast';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const { transactions, addDeposit } = useTransactions();
  const { confirm } = useConfirm();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    recipient: '',
    notes: ''
  });
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Get available categories + month from transactions that actually have balance
  const incomeDetails = transactions
    .filter(t => t.type === 'Pelunasan' || t.type === 'Penyesuaian' || t.type === 'Setoran' || t.type === 'Pengeluaran')
    .reduce((acc, t) => {
      const cat = t.paymentCategory || 'Lainnya';
      let month = 'Tanpa Bulan';
      
      // Extract month inside parentheses, e.g., "Lunas: SPP (Mei 2026)" -> "Mei 2026"
      const match = t.description.match(/\((.*?)\)/);
      if (match) month = match[1];

      const key = `${cat} | ${month}`;
      if (!acc[key]) acc[key] = { category: cat, month, saldo: 0 };
      
      if (t.type === 'Setoran' || t.type === 'Pengeluaran') {
        acc[key].saldo -= t.amount;
      } else {
        acc[key].saldo += t.amount;
      }
      return acc;
    }, {} as Record<string, { category: string, month: string, saldo: number }>);

  const availableOptions = Object.entries(incomeDetails)
    .filter(([_, data]: [string, any]) => data.saldo > 0)
    .map(([key, data]: [string, any]) => ({ key, ...data }));

  const handleToggleItem = (key: string, maxSaldo: number) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[key] !== undefined) delete next[key];
      else next[key] = maxSaldo;
      return next;
    });
  };

  const handleAmountChange = (key: string, amount: number, maxSaldo: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [key]: Math.min(Math.max(amount, 0), maxSaldo)
    }));
  };

  const handleSelectAll = () => {
    if (Object.keys(selectedItems).length === availableOptions.length) {
      setSelectedItems({});
    } else {
      const all: Record<string, number> = {};
      availableOptions.forEach(opt => { all[opt.key] = opt.saldo; });
      setSelectedItems(all);
    }
  };

  const totalAmount = Object.values(selectedItems).reduce((sum, val) => sum + (val || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const keys = Object.keys(selectedItems);
    if (keys.length === 0 || totalAmount <= 0 || !formData.recipient) return;

    const confirmDeposit = await confirm({
      title: 'Konfirmasi Setoran Massal',
      message: `Apakah Anda yakin ingin menyetor dana dari ${keys.length} sumber kategori dengan total keseluruhan Rp ${totalAmount.toLocaleString('id-ID')} kepada "${formData.recipient}"?`,
      type: 'info'
    });
    if (!confirmDeposit) return;

    setIsProcessing(true);
    try {
      for (const key of keys) {
        const selectedData = incomeDetails[key];
        const amount = selectedItems[key];
        if (selectedData && amount > 0) {
          const notesWithMonth = `[${selectedData.category}] Setor ke ${formData.recipient} (${selectedData.month}): ${formData.notes}`;
          await addDeposit(amount, selectedData.category, formData.recipient, notesWithMonth);
        }
      }
      toast.success(`Setoran kolektif total Rp ${totalAmount.toLocaleString('id-ID')} berhasil disimpan!`);
      onClose();
      setFormData({ recipient: '', notes: '' });
      setSelectedItems({});
      setFormError(null);
    } catch (error: any) {
      console.error('Failed to submit deposit', error);
      toast.error(`Gagal menyimpan setoran: ${error.message || 'Error tidak dikenal'}`);
      setFormError(`Gagal menyimpan setoran! Detail Error: ${error.message || 'Unknown'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                  <HandCoins size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase">Setor Dana</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 italic">Serahkan uang fisik ke pemegang dana</p>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-all"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 bg-white overflow-y-auto flex-1 custom-scrollbar">
              {formError && (
                <div className="p-5 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 leading-relaxed italic">
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1 mb-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pilih Kategori & Bulan</label>
                  <button type="button" onClick={handleSelectAll} className="text-[9px] font-black uppercase text-blue-600 hover:text-blue-700 tracking-widest bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all active:scale-95">
                    {Object.keys(selectedItems).length === availableOptions.length && availableOptions.length > 0 ? 'Batalkan Semua' : 'Pilih Semua'}
                  </button>
                </div>
                <div className="max-h-[220px] overflow-y-auto space-y-2 pr-2 border border-slate-100 rounded-2xl p-2 bg-slate-50 custom-scrollbar">
                  {availableOptions.length === 0 ? (
                    <div className="p-6 text-center text-xs font-bold text-slate-400">Tidak ada sisa dana kas yang tersedia untuk disetor.</div>
                  ) : availableOptions.map(opt => (
                    <div key={opt.key} className={cn("p-4 bg-white border rounded-[1.25rem] flex items-start gap-3 transition-all", selectedItems[opt.key] !== undefined ? "border-blue-300 ring-2 ring-blue-100/50 shadow-sm" : "border-slate-200")}>
                      <input type="checkbox" checked={selectedItems[opt.key] !== undefined} onChange={() => handleToggleItem(opt.key, opt.saldo)} className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer" onClick={() => handleToggleItem(opt.key, opt.saldo)}>
                          <span className="text-xs font-black text-slate-800 uppercase tracking-tighter">{opt.category} - {opt.month}</span>
                          <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 whitespace-nowrap">Sisa Kas: Rp {opt.saldo.toLocaleString()}</span>
                        </div>
                        <AnimatePresence>
                          {selectedItems[opt.key] !== undefined && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="flex items-center gap-2 pt-3 border-t border-slate-50 mt-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">Setorkan: Rp</span>
                                <input type="number" value={selectedItems[opt.key] || ''} onChange={(e) => handleAmountChange(opt.key, parseInt(e.target.value) || 0, opt.saldo)} max={opt.saldo} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all" />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-blue-50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between border border-blue-100 gap-2 shadow-inner">
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Total Nominal Disetor</span>
                <span className="text-2xl font-black text-blue-700">Rp {totalAmount.toLocaleString()}</span>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Penerima / Pemegang Dana</label>
                <input 
                  type="text" 
                  value={formData.recipient}
                  onChange={(e) => setFormData({...formData, recipient: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-slate-900 transition-all"
                  placeholder="Contoh: Ust. Budi (Bendahara Yayasan)"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Keterangan / Catatan Tambahan</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-slate-900 transition-all min-h-[100px] resize-none"
                  placeholder="Contoh: Setoran SPP bulan April minggu pertama..."
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={isProcessing || Object.keys(selectedItems).length === 0 || totalAmount <= 0 || !formData.recipient}
                className={cn(
                  "w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 mt-4",
                  isProcessing || Object.keys(selectedItems).length === 0 || totalAmount <= 0 || !formData.recipient 
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100"
                )}
              >
                {isProcessing ? 'Memproses...' : 'Simpan Bukti Setoran'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
