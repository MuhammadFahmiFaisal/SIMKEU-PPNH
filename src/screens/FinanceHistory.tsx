import React from 'react';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter,
  FileText,
  Calendar,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCcw,
  Download,
  HandCoins,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { DepositModal } from '../components/features/finance/DepositModal';

export function FinanceHistory() {
  const { transactions } = useData();
  const { user } = useAuth();
  const [showDepositModal, setShowDepositModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState('Semua');
  const [filterMonth, setFilterMonth] = React.useState(''); // format YYYY-MM
  const [isMonthPickerOpen, setIsMonthPickerOpen] = React.useState(false);
  const [pickerYear, setPickerYear] = React.useState(new Date().getFullYear());

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const displayMonth = filterMonth ? (() => {
    const [y, m] = filterMonth.split('-');
    return `${months[parseInt(m) - 1]} ${y}`;
  })() : 'Semua Bulan';
  
  const canWrite = user?.role === 'Super Admin' || user?.role === 'Bendahara';

  // Rekapitulasi Pemasukan dan Setoran berdasarkan kategori
  const incomeDetails = transactions
    .filter(t => t.type === 'Pelunasan' || t.type === 'Penyesuaian' || t.type === 'Setoran')
    .reduce((acc, t) => {
      const category = t.paymentCategory || 'Lainnya';
      if (!acc[category]) acc[category] = { terkumpul: 0, disetor: 0, saldo: 0 };
      
      if (t.type === 'Setoran') {
        acc[category].disetor += t.amount;
        acc[category].saldo -= t.amount;
      } else {
        acc[category].terkumpul += t.amount;
        acc[category].saldo += t.amount;
      }
      return acc;
    }, {} as Record<string, { terkumpul: number; disetor: number; saldo: number }>);

  const totalIncome = Object.values(incomeDetails).reduce((sum, data: any) => sum + data.terkumpul, 0);
  const totalDisetor = Object.values(incomeDetails).reduce((sum, data: any) => sum + data.disetor, 0);
  const totalSaldo = Object.values(incomeDetails).reduce((sum, data: any) => sum + data.saldo, 0);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.paymentCategory || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'Semua' || t.type === filterType;

    let matchesMonth = true;
    if (filterMonth) {
      const [fYear, fMonth] = filterMonth.split('-');
      const dateString = t.date.split(', ')[0]; // DD/MM/YYYY or D/M/YYYY
      // In JS, sometimes separator is '/' sometimes '-' depending on exact locale, but 'id-ID' uses '/' usually.
      const dateParts = dateString.includes('/') ? dateString.split('/') : dateString.split('-');
      
      if (dateParts.length === 3) {
        const tMonth = dateParts[1].padStart(2, '0');
        const tYear = dateParts[2];
        matchesMonth = (tMonth === fMonth && tYear === fYear);
      }
    }

    return matchesSearch && matchesType && matchesMonth;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'Penambahan': return <ArrowUpRight className="text-blue-600" size={18} />;
      case 'Pelunasan': return <CheckCircle2 className="text-emerald-600" size={18} />;
      case 'Penyesuaian': return <RefreshCcw className="text-amber-600" size={18} />;
      case 'Penghapusan': return <Trash2 className="text-red-600" size={18} />;
      case 'Setoran': return <HandCoins className="text-indigo-600" size={18} />;
      default: return <FileText size={18} />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Penambahan': return "bg-blue-50 text-blue-700 border-blue-100";
      case 'Pelunasan': return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case 'Penyesuaian': return "bg-amber-50 text-amber-700 border-amber-100";
      case 'Penghapusan': return "bg-red-50 text-red-700 border-red-100";
      case 'Setoran': return "bg-indigo-50 text-indigo-700 border-indigo-100";
      default: return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
            <History size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Audit Trail</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">Riwayat Finansial</h2>
          <p className="text-slate-500 font-medium italic text-sm">Rekam jejak seluruh aktivitas penambahan dan pelunasan tunggakan.</p>
        </div>
        {canWrite && (
          <button 
            onClick={() => setShowDepositModal(true)}
            className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
          >
            <HandCoins size={18} />
            Setor Dana
          </button>
        )}
      </div>

      {/* Income Summary by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-1">
        <div className="bg-emerald-600 text-white p-6 rounded-3xl shadow-xl shadow-emerald-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-xl"><Wallet size={20} className="text-white" /></div>
              <p className="text-sm font-bold opacity-90">Total Pemasukan</p>
            </div>
            <p className="text-3xl font-black">Rp {totalIncome.toLocaleString()}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-2 text-xs font-medium">
            <div>
              <p className="opacity-75">Telah Disetor</p>
              <p className="font-bold">Rp {totalDisetor.toLocaleString()}</p>
            </div>
            <div>
              <p className="opacity-75">Uang di Tangan</p>
              <p className="font-bold">Rp {totalSaldo.toLocaleString()}</p>
            </div>
          </div>
        </div>
        {Object.entries(incomeDetails).map(([category, data]: [string, any]) => (
          <div key={category} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 rounded-xl"><CheckCircle2 size={20} className="text-emerald-600" /></div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{category}</p>
              </div>
              <p className="text-2xl font-black text-slate-900">Rp {data.terkumpul.toLocaleString()}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px] font-bold">
              <div>
                <p className="text-slate-400 uppercase tracking-widest">Disetor</p>
                <p className="text-slate-700 text-sm mt-0.5">Rp {data.disetor.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase tracking-widest">Sisa Kas</p>
                <p className="text-emerald-600 text-sm mt-0.5">Rp {data.saldo.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col mx-1">
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama santri atau deskripsi..." 
              className="w-full pl-12 pr-6 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:border-slate-200 outline-none text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-2xl">
              <Filter size={16} className="text-slate-400" />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 py-1.5 cursor-pointer"
              >
                <option value="Semua">Semua Tipe</option>
                <option value="Penambahan">Penambahan</option>
                <option value="Pelunasan">Pelunasan</option>
                <option value="Penyesuaian">Penyesuaian</option>
                <option value="Penghapusan">Penghapusan</option>
                <option value="Setoran">Setoran</option>
              </select>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                className="flex items-center justify-between gap-3 px-4 py-2 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all min-w-[150px]"
              >
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">{displayMonth}</span>
                </div>
                {filterMonth && (
                  <div 
                    onClick={(e) => { e.stopPropagation(); setFilterMonth(''); }}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <X size={12} />
                  </div>
                )}
              </button>

              <AnimatePresence>
                {isMonthPickerOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMonthPickerOpen(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <button 
                          onClick={() => setPickerYear(y => y - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white border border-transparent hover:border-slate-200 text-slate-600 transition-all shadow-sm"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                        <span className="text-sm font-black text-slate-900">{pickerYear}</span>
                        <button 
                          onClick={() => setPickerYear(y => y + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white border border-transparent hover:border-slate-200 text-slate-600 transition-all shadow-sm"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                      </div>
                      <div className="p-4 grid grid-cols-3 gap-2">
                        {months.map((m, idx) => {
                          const monthValue = String(idx + 1).padStart(2, '0');
                          const valueToSet = `${pickerYear}-${monthValue}`;
                          const isSelected = filterMonth === valueToSet;
                          return (
                            <button
                              key={m}
                              onClick={() => {
                                setFilterMonth(valueToSet);
                                setIsMonthPickerOpen(false);
                              }}
                              className={cn(
                                "py-2.5 rounded-xl text-xs font-bold transition-all",
                                isSelected 
                                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20" 
                                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              )}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => {
                const ws = XLSX.utils.json_to_sheet(filteredTransactions);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Riwayat Transaksi");
                XLSX.writeFile(wb, `Laporan_Keuangan_${new Date().toLocaleDateString()}.xlsx`);
              }}
              className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all"
            >
              <Download size={16} />
              Ekspor Laporan
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu & Tanggal</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Santri</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kategori</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aktivitas</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nominal</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Admin</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <History size={32} />
                      </div>
                      <p className="text-slate-400 font-medium italic">
                        {transactions.length === 0 
                          ? "Belum ada riwayat transaksi yang tercatat."
                          : "Tidak ada transaksi yang sesuai dengan filter pencarian."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-slate-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{t.date.split(', ')[0]}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{t.date.split(', ')[1]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-slate-900">{t.studentName}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-lg border border-slate-200">
                        {t.paymentCategory || '-'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          {getIcon(t.type)}
                        </div>
                        <p className="text-xs font-medium text-slate-600">{t.description}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className={cn(
                        "text-sm font-bold",
                        t.type === 'Pelunasan' ? "text-emerald-600" : 
                        t.type === 'Penghapusan' ? "text-red-600" : 
                        t.type === 'Setoran' ? "text-indigo-600" : "text-slate-900"
                      )}>
                        {t.type === 'Pelunasan' || t.type === 'Penghapusan' || t.type === 'Setoran' ? '-' : '+'} Rp {Math.abs(t.amount).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{t.performedBy}</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Petugas</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        getBadgeColor(t.type)
                      )}>
                        {t.type}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DepositModal 
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />
    </motion.div>
  );
}
