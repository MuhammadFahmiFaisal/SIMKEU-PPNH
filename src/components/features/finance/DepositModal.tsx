import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HandCoins } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useData } from '../../../context/DataContext';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const { transactions, addDeposit } = useData();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    amount: 0,
    recipient: '',
    notes: '',
    selectedKey: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Get available categories + month from transactions that actually have balance
  const incomeDetails = transactions
    .filter(t => t.type === 'Pelunasan' || t.type === 'Penyesuaian' || t.type === 'Setoran')
    .reduce((acc, t) => {
      const cat = t.paymentCategory || 'Lainnya';
      let month = 'Tanpa Bulan';
      
      // Extract month inside parentheses, e.g., "Lunas: SPP (Mei 2026)" -> "Mei 2026"
      const match = t.description.match(/\((.*?)\)/);
      if (match) month = match[1];

      const key = `${cat} | ${month}`;
      if (!acc[key]) acc[key] = { category: cat, month, saldo: 0 };
      
      if (t.type === 'Setoran') {
        acc[key].saldo -= t.amount;
      } else {
        acc[key].saldo += t.amount;
      }
      return acc;
    }, {} as Record<string, { category: string, month: string, saldo: number }>);

  const availableOptions = Object.entries(incomeDetails)
    .filter(([_, data]: [string, any]) => data.saldo > 0)
    .map(([key, data]: [string, any]) => ({ key, ...data }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.selectedKey || formData.amount <= 0 || !formData.recipient) return;

    const selectedData = incomeDetails[formData.selectedKey];
    if (!selectedData) return;

    setIsProcessing(true);
    try {
      const notesWithMonth = `[${selectedData.category}] Setor ke ${formData.recipient} (${selectedData.month}): ${formData.notes}`;
      await addDeposit(formData.amount, selectedData.category, formData.recipient, notesWithMonth);
      onClose();
      setFormData({ category: '', amount: 0, recipient: '', notes: '', selectedKey: '' });
    } catch (error: any) {
      console.error('Failed to submit deposit', error);
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
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
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
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
              {formError && (
                <div className="p-5 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 leading-relaxed italic">
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kategori & Bulan Target</label>
                <select 
                  value={formData.selectedKey}
                  onChange={(e) => setFormData({...formData, selectedKey: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-slate-900 transition-all cursor-pointer"
                  required
                >
                  <option value="" disabled>Pilih spesifik kategori dan bulan yang mau disetor...</option>
                  {availableOptions.map(opt => (
                    <option key={opt.key} value={opt.key}>{opt.category} - {opt.month} (Sisa Kas: Rp {opt.saldo.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nominal Disetor (Rp)</label>
                <input 
                  type="number" 
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value) || 0})}
                  max={formData.selectedKey ? incomeDetails[formData.selectedKey].saldo : undefined}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-slate-900 transition-all"
                  placeholder="Berapa rupiah yang diserahkan?"
                  required
                />
                {formData.selectedKey && formData.amount > incomeDetails[formData.selectedKey].saldo && (
                  <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">Nominal melebihi sisa kas untuk bulan tersebut!</p>
                )}
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
                disabled={isProcessing || !formData.selectedKey || formData.amount <= 0 || !formData.recipient || (formData.selectedKey ? formData.amount > incomeDetails[formData.selectedKey].saldo : false)}
                className={cn(
                  "w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 mt-4",
                  isProcessing || !formData.selectedKey || formData.amount <= 0 || !formData.recipient 
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
