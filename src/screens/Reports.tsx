import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Download, Filter, FileSpreadsheet, SearchX, Layers, Search, ClipboardList } from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const indonesianMonths: Record<string, number> = {
  'januari': 1,
  'februari': 2,
  'maret': 3,
  'april': 4,
  'mei': 5,
  'juni': 6,
  'juli': 7,
  'agustus': 8,
  'september': 9,
  'oktober': 10,
  'november': 11,
  'desember': 12
};

const parseMonthYearString = (str: string) => {
  if (!str) return { month: 0, year: 0 };
  const parts = str.toLowerCase().trim().split(' ');
  if (parts.length === 2) {
    const monthIndex = indonesianMonths[parts[0]] || 0;
    const year = parseInt(parts[1], 10) || 0;
    return { month: monthIndex, year };
  }
  return { month: 0, year: 0 };
};

export function Reports() {
  const { students, arrears, transactions, permissions } = useData();
  const [activeTab, setActiveTab] = useState<'finance' | 'permission'>('finance');
  const [errorNotification, setErrorNotification] = useState<string | null>(null);

  // Financial Filter States
  const [selectedType, setSelectedType] = useState('Semua Kategori');
  const [selectedMonth, setSelectedMonth] = useState('Semua Bulan');
  const [selectedStatus, setSelectedStatus] = useState('Semua Status');

  // Permission Filter States
  const [permSearchQuery, setPermSearchQuery] = useState('');
  const [permFilterType, setPermFilterType] = useState('Semua Kategori');
  const [permFilterStatus, setPermFilterStatus] = useState('Semua Status');

  // Derive Finance categories and periods
  const types = useMemo(() => ['Semua Kategori', ...(Array.from(new Set(arrears.map(a => a.type))) as string[])], [arrears]);
  
  const months = useMemo(() => {
    const uniqueMonths = Array.from(new Set(arrears.map(a => a.month))) as string[];
    
    uniqueMonths.sort((a, b) => {
      const aVal = parseMonthYearString(a);
      const bVal = parseMonthYearString(b);
      if (aVal.year !== bVal.year) {
        return aVal.year - bVal.year;
      }
      return aVal.month - bVal.month;
    });
    
    return ['Semua Bulan', ...uniqueMonths];
  }, [arrears]);
  
  // Filtered Financial Data
  const filteredData = useMemo(() => {
    let result = arrears.map(arrear => {
      const student = students.find(s => s.id === arrear.studentId);
      
      let paymentTime = '-';
      let receiver = '-';
      let totalPaid = 0;
      
      const relatedTx = transactions.filter(t => 
         t.studentId === arrear.studentId && 
         t.paymentCategory === arrear.type && 
         t.description.includes(arrear.month) &&
         (t.type === 'Pelunasan' || t.type === 'Penyesuaian')
      );
      
      if (relatedTx.length > 0) {
        totalPaid = relatedTx.reduce((sum, t) => sum + t.amount, 0);
        const lastTx = relatedTx[0];
        paymentTime = lastTx.date;
        receiver = lastTx.performedBy;
      }
      
      const displayAmount = arrear.status === 'Lunas' ? totalPaid : arrear.amount;

      return {
        ...arrear,
        displayAmount,
        studentName: student?.name || 'Unknown',
        studentClass: student?.class || '-',
        parentName: student?.parentName || '-',
        paymentTime,
        receiver
      };
    });

    if (selectedType !== 'Semua Kategori') result = result.filter(r => r.type === selectedType);
    if (selectedMonth !== 'Semua Bulan') result = result.filter(r => r.month === selectedMonth);
    if (selectedStatus !== 'Semua Status') {
       if (selectedStatus === 'Sudah Lunas') result = result.filter(r => r.status === 'Lunas');
       if (selectedStatus === 'Belum Lunas') result = result.filter(r => r.status !== 'Lunas');
    }

    result.sort((a, b) => {
      const aVal = parseMonthYearString(a.month);
      const bVal = parseMonthYearString(b.month);
      if (aVal.year !== bVal.year) {
        return aVal.year - bVal.year;
      }
      if (aVal.month !== bVal.month) {
        return aVal.month - bVal.month;
      }
      return a.studentName.localeCompare(b.studentName);
    });

    return result;
  }, [arrears, students, transactions, selectedType, selectedMonth, selectedStatus]);

  // Filtered Permission Data
  const filteredPermissions = useMemo(() => {
    return permissions.filter(p => {
      const matchesSearch = p.studentName.toLowerCase().includes(permSearchQuery.toLowerCase()) || 
                            p.studentClass.toLowerCase().includes(permSearchQuery.toLowerCase()) ||
                            (p.reason && p.reason.toLowerCase().includes(permSearchQuery.toLowerCase()));
      const matchesType = permFilterType === 'Semua Kategori' || p.type === permFilterType;
      const matchesStatus = permFilterStatus === 'Semua Status' || p.status === permFilterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [permissions, permSearchQuery, permFilterType, permFilterStatus]);

  const handleExport = () => {
    if (activeTab === 'finance') {
      if (filteredData.length === 0) {
        setErrorNotification('Tidak ada data keuangan untuk diekspor!');
        setTimeout(() => setErrorNotification(null), 3000);
        return;
      }
      
      const excelData = filteredData.map((d, index) => ({
        'No': index + 1,
        'Nama Santri': d.studentName,
        'Kelas': d.studentClass,
        'Nama Wali': d.parentName,
        'Jenis Pembayaran': d.type,
        'Periode Bulan': d.month,
        'Nominal (Rp)': d.displayAmount,
        'Status': d.status === 'Lunas' ? 'LUNAS' : 'BELUM LUNAS',
        'Waktu Bayar': d.paymentTime,
        'Penerima (Admin)': d.receiver
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Keuangan");
      
      const fileName = `REKAP_KEUANGAN_SIMKEU_${selectedType.replace(/\s+/g,'_')}_${selectedMonth.replace(/\s+/g,'_')}_${new Date().getTime()}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } else {
      if (filteredPermissions.length === 0) {
        setErrorNotification('Tidak ada data perizinan untuk diekspor!');
        setTimeout(() => setErrorNotification(null), 3000);
        return;
      }

      const excelData = filteredPermissions.map((p, index) => ({
        'No': index + 1,
        'Nama Santri': p.studentName,
        'Kelas': p.studentClass,
        'Jenis Izin': p.type,
        'Alasan Izin': p.reason,
        'Tanggal Keluar': new Date(p.startDate).toLocaleString('id-ID'),
        'Tenggat Kembali': new Date(p.expectedReturnDate).toLocaleString('id-ID'),
        'Waktu Kembali Aktual': p.actualReturnDate ? new Date(p.actualReturnDate).toLocaleString('id-ID') : '-',
        'Status': p.status,
        'Disetujui Oleh': p.createdByName,
        'Catatan': p.notes || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Perizinan");
      
      const fileName = `REKAP_PERIZINAN_SIMKEU_${permFilterType.replace(/\s+/g,'_')}_${permFilterStatus.replace(/\s+/g,'_')}_${new Date().getTime()}.xlsx`;
      XLSX.writeFile(wb, fileName);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-10">
      <AnimatePresence>
        {errorNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 right-8 z-[150] flex items-center gap-3 bg-red-600 text-white px-8 py-5 rounded-2xl shadow-2xl border border-red-500 backdrop-blur-xl animate-bounce"
          >
            <SearchX size={20} />
            <span className="text-xs font-black uppercase tracking-[0.2em]">{errorNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200">
                <FileSpreadsheet size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Reporting Module</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tighter uppercase">Laporan Rekapitulasi</h2>
          <p className="text-slate-500 font-medium italic text-sm">Pilih tab laporan, gunakan saringan parameter, lalu unduh dokumen spreadsheet Excel Anda.</p>
        </div>
        
        <button 
          onClick={handleExport}
          className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all uppercase tracking-[0.2em] group"
        >
          <Download size={16} className="group-hover:-translate-y-1 transition-transform" />
          Export ke Excel
        </button>
      </div>

      {/* Modern Horizontal Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-8">
        <button
          onClick={() => setActiveTab('finance')}
          className={cn(
            "pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all inline-flex items-center gap-2",
            activeTab === 'finance'
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <Layers size={14} />
          Laporan Keuangan
        </button>
        <button
          onClick={() => setActiveTab('permission')}
          className={cn(
            "pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all inline-flex items-center gap-2",
            activeTab === 'permission'
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <ClipboardList size={14} />
          Laporan Perizinan Santri
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white p-6 md:p-8 rounded-[3rem] border border-slate-200 shadow-sm">
        {activeTab === 'finance' ? (
          /* Finance report Filters */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                <Layers size={14} /> Kategori Tagihan
              </label>
              <select 
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 outline-none focus:ring-4 focus:ring-slate-100 transition-all appearance-none cursor-pointer"
              >
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                <Filter size={14} /> Periode Bulan
              </label>
              <select 
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 outline-none focus:ring-4 focus:ring-slate-100 transition-all appearance-none cursor-pointer"
              >
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                <Filter size={14} /> Status Pembayaran
              </label>
              <select 
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 outline-none focus:ring-4 focus:ring-slate-100 transition-all appearance-none cursor-pointer"
              >
                <option value="Semua Status">Semua Status</option>
                <option value="Sudah Lunas">Telah Membayar (Lunas)</option>
                <option value="Belum Lunas">Belum Bayar (Menunggak)</option>
              </select>
            </div>
          </div>
        ) : (
          /* Permission report Filters */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                <Search size={14} /> Cari Santri / Kelas
              </label>
              <input
                type="text"
                placeholder="Ketik nama atau kelas..."
                value={permSearchQuery}
                onChange={e => setPermSearchQuery(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 outline-none focus:ring-4 focus:ring-slate-100 transition-all"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                <Layers size={14} /> Kategori Izin
              </label>
              <select
                value={permFilterType}
                onChange={e => setPermFilterType(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 outline-none focus:ring-4 focus:ring-slate-100 transition-all cursor-pointer"
              >
                <option value="Semua Kategori">Semua Kategori</option>
                <option value="Keluar Singkat">Keluar Singkat</option>
                <option value="Pulang">Pulang (Go Home)</option>
                <option value="Sakit">Sakit (Medis)</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                <Filter size={14} /> Status Kehadiran
              </label>
              <select
                value={permFilterStatus}
                onChange={e => setPermFilterStatus(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 outline-none focus:ring-4 focus:ring-slate-100 transition-all cursor-pointer"
              >
                <option value="Semua Status">Semua Status</option>
                <option value="Aktif">Sedang di Luar</option>
                <option value="Kembali">Kembali (Tepat Waktu)</option>
                <option value="Terlambat">Kembali (Terlambat)</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* DATA PRATINJAU PREVIEW TABLE */}
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        {activeTab === 'finance' ? (
          /* Financial Preview Table */
          <>
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Pratinjau Data Keuangan ({filteredData.length} Ditemukan)</h3>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left">
                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Santri & Kelas</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori & Bulan</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Nominal</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-32">
                        <div className="flex flex-col items-center justify-center text-center">
                          <SearchX size={48} className="text-slate-200 mb-4" />
                          <p className="text-lg font-black text-slate-900 uppercase tracking-tight">Data Tidak Ditemukan</p>
                          <p className="text-xs text-slate-400 font-bold mt-1">Ubah kriteria filter di atas.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <p className="text-sm font-black text-slate-900 uppercase">{d.studentName}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5">{d.studentClass}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs font-bold text-slate-700 uppercase">{d.type}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5">{d.month}</p>
                        </td>
                        <td className="px-8 py-5 text-right font-black text-slate-900">
                          Rp {d.displayAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className={cn(
                              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                              d.status === 'Lunas' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                            )}>
                              {d.status === 'Lunas' ? 'LUNAS' : 'MENUNGGAK'}
                            </span>
                            {d.status === 'Lunas' && d.paymentTime !== '-' && (
                              <div className="text-center mt-1">
                                <p className="text-[9px] font-bold text-slate-500 whitespace-nowrap">{d.paymentTime}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Oleh: {d.receiver}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* Permission Preview Table */
          <>
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Pratinjau Data Perizinan ({filteredPermissions.length} Ditemukan)</h3>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left">
                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Santri & Kelas</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori & Alasan</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu Berangkat / Tenggat</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Petugas</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPermissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-32">
                        <div className="flex flex-col items-center justify-center text-center">
                          <SearchX size={48} className="text-slate-200 mb-4" />
                          <p className="text-lg font-black text-slate-900 uppercase tracking-tight">Data Tidak Ditemukan</p>
                          <p className="text-xs text-slate-400 font-bold mt-1">Ubah kriteria filter perizinan di atas.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPermissions.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <p className="text-sm font-black text-slate-900 uppercase">{p.studentName}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5">{p.studentClass}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs font-bold text-slate-700 uppercase">{p.type}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5 max-w-[200px] truncate">{p.reason}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs font-bold text-slate-700">
                            {new Date(p.startDate).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5">
                            Tenggat: {new Date(p.expectedReturnDate).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </td>
                        <td className="px-8 py-5 text-center text-xs font-bold text-slate-600">
                          {p.createdByName}
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className={cn(
                            "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                            p.status === 'Aktif' && "bg-sky-50 text-sky-600 border border-sky-100",
                            p.status === 'Kembali' && "bg-emerald-50 text-emerald-600 border border-emerald-100",
                            p.status === 'Terlambat' && "bg-amber-50 text-amber-600 border border-amber-100",
                            p.status === 'Dibatalkan' && "bg-slate-50 text-slate-600 border border-slate-100"
                          )}>
                            {p.status === 'Aktif' ? 'DI LUAR' : p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
