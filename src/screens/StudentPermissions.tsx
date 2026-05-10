import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { printPermissionGatePass } from '../lib/pdfGenerator';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  UserCheck, Filter, Calendar, Users, Clock, AlertTriangle, 
  ArrowUpRight, Search, Plus, Eye, X, CheckCircle2, 
  SearchX, MapPin, User, FileText, ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Student, StudentPermission } from '../types';

export function StudentPermissions() {
  const { permissions, students, arrears, addPermission, checkInPermission } = useData();
  const { user } = useAuth();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua Status');

  // Modal control states
  const [selectedPermission, setSelectedPermission] = useState<StudentPermission | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Manual Permission Wizard states
  const [wizardStep, setWizardStep] = useState<1 | 2>(1); // 1: Select Student, 2: Fill Form
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Wizard Checkout Form state
  const [permitType, setPermitType] = useState<'Pulang' | 'Keluar Singkat' | 'Sakit' | 'Lainnya'>('Keluar Singkat');
  const [permitReason, setPermitReason] = useState('');
  const [permitDurationHours, setPermitDurationHours] = useState('2');
  const [permitDurationDays, setPermitDurationDays] = useState('3');
  const [permitNotes, setPermitNotes] = useState('');

  // Derived Statistics
  const totalOutside = useMemo(() => students.filter(s => s.statusPerizinan === 'Di Luar').length, [students]);
  const totalPermissions = useMemo(() => permissions.length, [permissions]);
  const lateReturnCount = useMemo(() => permissions.filter(p => p.status === 'Terlambat').length, [permissions]);

  // Filtered permission list
  const filteredPermissions = useMemo(() => {
    return permissions.filter(p => {
      const matchesSearch = p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.studentClass.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.reason && p.reason.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = filterStatus === 'Semua Status' || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [permissions, searchQuery, filterStatus]);

  // Filtered student list for the manual search wizard
  const searchedStudentsForWizard = useMemo(() => {
    if (!studentSearch.trim()) return [];
    return students.filter(s => 
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.class.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.barcodeId && s.barcodeId.toLowerCase().includes(studentSearch.toLowerCase()))
    ).slice(0, 5); // limit to 5 suggestions
  }, [students, studentSearch]);

  // Open inspection detail
  const handleOpenDetail = (p: StudentPermission) => {
    setSelectedPermission(p);
    setShowDetailModal(true);
  };

  const handlePrintTicket = async () => {
    if (!selectedPermission) return;
    const student = students.find(s => s.id === selectedPermission.studentId);
    if (!student) return;
    try {
      const blob = await printPermissionGatePass(student, selectedPermission);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GATEPASS_${student.name.replace(/\s+/g,'_')}_${selectedPermission.id}.pdf`;
      link.click();
    } catch (err) {
      console.error('Failed to print permit:', err);
    }
  };

  // Select student in wizard
  const handleSelectStudentForWizard = (student: Student) => {
    // Check if they are already out
    if (student.statusPerizinan === 'Di Luar') {
      alert(`Santri ${student.name} sedang berada DI LUAR. Selesaikan kedatangan mereka di Portal Scan terlebih dahulu.`);
      return;
    }
    
    // Check if they have arrears
    const studentArrears = arrears.filter(a => a.studentId === student.id && a.status !== 'Lunas');
    const isBypassed = student.dispensationStatus === true;

    if (studentArrears.length > 0 && !isBypassed) {
      const totalAmt = studentArrears.reduce((sum, a) => sum + a.amount, 0);
      alert(`IZIN DITOLAK! Santri ${student.name} memiliki tunggakan SPP/administrasi sebesar Rp ${totalAmt.toLocaleString('id-ID')}.\n\nWali santri harus menyelesaikan kewajiban keuangan di kantor Bendahara atau meminta kebijakan dispensasi terlebih dahulu.`);
      return;
    }

    setSelectedStudent(student);
    setPermitType('Keluar Singkat');
    setPermitReason('');
    setPermitDurationHours('2');
    setPermitDurationDays('3');
    setPermitNotes('');
    setWizardStep(2);
  };

  // Submit manual permission checkout
  const handleManualCheckoutSubmit = async () => {
    if (!selectedStudent) return;

    // Calculate expected return
    const expected = new Date();
    if (permitType === 'Keluar Singkat') {
      const hours = parseInt(permitDurationHours) || 2;
      expected.setHours(expected.getHours() + hours);
    } else {
      const days = parseInt(permitDurationDays) || 3;
      expected.setDate(expected.getDate() + days);
    }

    try {
      await addPermission({
        studentId: selectedStudent.id,
        type: permitType,
        reason: permitReason || `Izin ${permitType} (Manual)`,
        durationHours: permitType === 'Keluar Singkat' ? parseInt(permitDurationHours) : undefined,
        expectedReturnDate: expected.toISOString(),
        createdBy: user?.id || '',
        notes: permitNotes
      });

      setShowManualModal(false);
      // Reset Wizard states
      setWizardStep(1);
      setStudentSearch('');
      setSelectedStudent(null);
    } catch (err: any) {
      alert(`Gagal membuat izin: ${err.message || 'Error tidak dikenal'}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8 pb-10"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200">
              <UserCheck size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              Logs Module
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tighter uppercase">
            Log Perizinan
          </h2>
          <p className="text-slate-500 font-medium italic text-sm">
            Pantau status lokasi santri, kelola dispensasi keluar-masuk, dan telusuri riwayat perizinan lengkap.
          </p>
        </div>

        {/* Add manual permission button */}
        <button
          onClick={() => {
            setWizardStep(1);
            setStudentSearch('');
            setSelectedStudent(null);
            setShowManualModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all uppercase tracking-[0.2em]"
        >
          <Plus size={14} />
          Tambah Izin Manual
        </button>
      </div>

      {/* Analytics Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Santri di Luar</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{totalOutside}</h3>
            <p className="text-[10px] font-bold text-slate-400">Sedang di luar kawasan pesantren</p>
          </div>
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm group-hover:scale-110 transition-transform">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterlambatan Kembali</p>
            <h3 className="text-3xl font-black text-amber-600 tracking-tight">{lateReturnCount}</h3>
            <p className="text-[10px] font-bold text-slate-400">Total pelanggaran keterlambatan</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sesi Izin</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{totalPermissions}</h3>
            <p className="text-[10px] font-bold text-slate-400">Seluruh pengajuan terdaftar</p>
          </div>
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm group-hover:scale-110 transition-transform">
            <ArrowUpRight size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white p-6 md:p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          
          {/* Search text input */}
          <div className="md:col-span-2 space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
              <Search size={14} /> Cari Nama / Kelas / Keterangan
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ketik nama santri, kelas, atau kata kunci alasan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 outline-none focus:ring-4 focus:ring-slate-100 transition-all pr-12"
              />
              <Search size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Status Select filter */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
              <Filter size={14} /> Status Keberadaan
            </label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 outline-none focus:ring-4 focus:ring-slate-100 transition-all cursor-pointer"
            >
              <option value="Semua Status">Semua Status</option>
              <option value="Aktif">Aktif (Sedang di Luar)</option>
              <option value="Kembali">Kembali (Tepat Waktu)</option>
              <option value="Terlambat">Kembali (Terlambat)</option>
              <option value="Dibatalkan">Izin Dibatalkan</option>
            </select>
          </div>

        </div>
      </div>

      {/* Log History Table */}
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
            Pratinjau Data ({filteredPermissions.length} Log Ditemukan)
          </h3>
        </div>

        <div className="overflow-x-auto max-h-[550px]">
          <table className="w-full text-left">
            <thead className="bg-white sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Santri & Kelas</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe & Keterangan</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Keluar / Batas Kembali</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPermissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32">
                    <div className="flex flex-col items-center justify-center text-center">
                      <SearchX size={48} className="text-slate-200 mb-4" />
                      <p className="text-lg font-black text-slate-900 uppercase tracking-tight">Log Izin Tidak Ditemukan</p>
                      <p className="text-xs text-slate-400 font-bold mt-1">Ubah kriteria filter atau buat sesi perizinan baru.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPermissions.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
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
                        {new Date(p.startDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        Tenggat: {new Date(p.expectedReturnDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={cn(
                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block",
                        p.status === 'Aktif' && "bg-sky-50 text-sky-600 border border-sky-100",
                        p.status === 'Kembali' && "bg-emerald-50 text-emerald-600 border border-emerald-100",
                        p.status === 'Terlambat' && "bg-amber-50 text-amber-600 border border-amber-100",
                        p.status === 'Dibatalkan' && "bg-slate-50 text-slate-600 border border-slate-100"
                      )}>
                        {p.status === 'Aktif' ? 'DI LUAR' : p.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button
                        onClick={() => handleOpenDetail(p)}
                        className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-900 hover:text-white rounded-xl text-slate-500 hover:border-slate-950 transition-all inline-flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-widest"
                      >
                        <Eye size={12} /> Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================= */}
      {/* 🔴 WIZARD: TAMBAH IZIN MANUAL MODAL     */}
      {/* ======================================= */}
      <AnimatePresence>
        {showManualModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">WIZARD STEP {wizardStep} OF 2</span>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-0.5">Tambah Izin Manual</h3>
                  </div>
                </div>
                <button 
                  onClick={() => setShowManualModal(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-950 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {wizardStep === 1 ? (
                /* STEP 1: Search & Select Student */
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cari Nama Santri</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ketik NIS, kelas, atau nama santri..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-slate-400"
                      />
                      <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  {/* Suggestions list */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hasil Pencarian</span>
                    {studentSearch.trim() === '' ? (
                      <div className="text-center py-10 text-slate-300">
                        <User size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Mulai ketik nama santri di atas</p>
                      </div>
                    ) : searchedStudentsForWizard.length === 0 ? (
                      <div className="text-center py-10 text-slate-300">
                        <SearchX size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Santri tidak ditemukan</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto">
                        {searchedStudentsForWizard.map(student => (
                          <button
                            key={student.id}
                            onClick={() => handleSelectStudentForWizard(student)}
                            className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-150 flex items-center justify-between text-left transition-all group"
                          >
                            <div>
                              <p className="text-xs font-black text-slate-900 uppercase">{student.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5">{student.class} • Mukim: {student.residenceStatus}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* STEP 2: Fill Checkout Form */
                selectedStudent && (
                  <div className="p-8 space-y-6">
                    {/* Snap profile */}
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase">{selectedStudent.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">Kelas {selectedStudent.class} • Mukim: {selectedStudent.residenceStatus}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedStudent(null);
                          setWizardStep(1);
                        }}
                        className="text-[10px] font-bold text-emerald-600 hover:underline bg-emerald-50 px-3 py-1 rounded-lg"
                      >
                        Ganti
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Izin</label>
                          <select
                            value={permitType}
                            onChange={e => setPermitType(e.target.value as any)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none"
                          >
                            <option value="Keluar Singkat">Keluar Singkat</option>
                            <option value="Pulang">Pulang (Go Home)</option>
                            <option value="Sakit">Sakit (Medis)</option>
                            <option value="Lainnya">Lainnya</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Durasi Izin</label>
                          {permitType === 'Keluar Singkat' ? (
                            <select
                              value={permitDurationHours}
                              onChange={e => setPermitDurationHours(e.target.value)}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none"
                            >
                              <option value="1">1 Jam</option>
                              <option value="2">2 Jam</option>
                              <option value="3">3 Jam</option>
                              <option value="4">4 Jam</option>
                              <option value="6">6 Jam</option>
                            </select>
                          ) : (
                            <select
                              value={permitDurationDays}
                              onChange={e => setPermitDurationDays(e.target.value)}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none"
                            >
                              <option value="1">1 Hari</option>
                              <option value="2">2 Hari</option>
                              <option value="3">3 Hari</option>
                              <option value="5">5 Hari</option>
                              <option value="7">7 Hari</option>
                            </select>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alasan Izin</label>
                        <input
                          type="text"
                          placeholder="Masukkan alasan izin keluar..."
                          value={permitReason}
                          onChange={e => setPermitReason(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan Internal</label>
                        <textarea
                          placeholder="Masukkan catatan pendukung administrasi..."
                          value={permitNotes}
                          onChange={e => setPermitNotes(e.target.value)}
                          rows={2}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )
              )}

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                <button
                  onClick={() => {
                    if (wizardStep === 2) {
                      setWizardStep(1);
                    } else {
                      setShowManualModal(false);
                    }
                  }}
                  className="flex-1 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  {wizardStep === 2 ? 'Sebelumnya' : 'Batal'}
                </button>
                {wizardStep === 2 && (
                  <button
                    onClick={handleManualCheckoutSubmit}
                    className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg"
                  >
                    Konfirmasi Checkout
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* 🟢 DETAIL LOG INSPECTION MODAL          */}
      {/* ======================================= */}
      <AnimatePresence>
        {showDetailModal && selectedPermission && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                    <FileText size={18} />
                  </div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Rincian Tiket Izin</h3>
                </div>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-950 transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Receipt Body */}
              <div className="p-8 space-y-6 text-slate-800">
                
                {/* Header ticket identity */}
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">PESANTREN DARUL ULUM NH</p>
                  <h4 className="text-lg font-black text-slate-900 uppercase truncate">{selectedPermission.studentName}</h4>
                  <p className="text-xs font-bold text-slate-500">Kelas: {selectedPermission.studentClass}</p>
                </div>

                <div className="border-t-2 border-dashed border-slate-200 my-4" />

                {/* Specific records */}
                <div className="space-y-4 text-xs font-bold">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Kategori Izin</span>
                    <span className="px-2 py-1 bg-slate-100 rounded uppercase font-black tracking-widest text-[9px]">
                      {selectedPermission.type}
                    </span>
                  </div>

                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider shrink-0 mt-0.5">Alasan Pergi</span>
                    <span className="text-right text-slate-700 font-semibold leading-relaxed max-w-[220px]">
                      {selectedPermission.reason}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Tanggal Keluar</span>
                    <span className="text-slate-700">
                      {new Date(selectedPermission.startDate).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Tenggat Kembali</span>
                    <span className="text-slate-700">
                      {new Date(selectedPermission.expectedReturnDate).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {selectedPermission.actualReturnDate && (
                    <div className="flex justify-between items-center border-t border-slate-100 pt-2.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Tanggal Kembali</span>
                      <span className="text-slate-800 font-black">
                        {new Date(selectedPermission.actualReturnDate).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Status Akhir</span>
                    <span className={cn(
                      "px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider",
                      selectedPermission.status === 'Aktif' && "bg-sky-50 text-sky-600 border border-sky-100",
                      selectedPermission.status === 'Kembali' && "bg-emerald-50 text-emerald-600 border border-emerald-100",
                      selectedPermission.status === 'Terlambat' && "bg-amber-50 text-amber-600 border border-amber-100",
                      selectedPermission.status === 'Dibatalkan' && "bg-slate-50 text-slate-600 border border-slate-100"
                    )}>
                      {selectedPermission.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Disetujui Oleh</span>
                    <span className="text-slate-600">
                      {selectedPermission.createdByName || 'Sistem'}
                    </span>
                  </div>

                  {selectedPermission.notes && (
                    <div className="border-t border-slate-100 pt-2.5">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Catatan Tambahan</p>
                      <p className="p-3 bg-slate-50 rounded-xl text-slate-600 leading-relaxed font-semibold italic text-[11px]">
                        "{selectedPermission.notes}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t-2 border-dashed border-slate-200 my-4" />

                <div className="flex gap-4">
                  <button
                    onClick={handlePrintTicket}
                    className="flex-1 py-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-center"
                  >
                    Cetak Tiket
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-center"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
