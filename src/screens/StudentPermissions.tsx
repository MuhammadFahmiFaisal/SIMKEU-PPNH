import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { printPermissionGatePass, printStudentIDCard, printPermissionExtensionPass } from '../lib/pdfGenerator';
import { checkPulangEligibility, EligibilityResult } from '../lib/permissionUtils';
import { PdfPreviewModal } from '../components/features/notifications/PdfPreviewModal';
import { usePermissions } from '../hooks/usePermissions';
import { useStudents } from '../hooks/useStudents';
import { useArrears } from '../hooks/useArrears';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { 
  UserCheck, Filter, Calendar, Users, Clock, AlertTriangle, 
  ArrowUpRight, Search, Plus, Eye, X, CheckCircle2, 
  SearchX, MapPin, User, FileText, ChevronRight, CreditCard, Printer
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Student, StudentPermission } from '../types';
import toast from 'react-hot-toast';

export function StudentPermissions() {
  const { permissions, addPermission, updatePermission } = usePermissions();
  const { students, updateStudent } = useStudents();
  const { arrears } = useArrears();
  const { user } = useAuth();
  const { confirm } = useConfirm();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua Status');
  const [filterMonth, setFilterMonth] = useState('Semua Bulan');
  const [filterYear, setFilterYear] = useState('Semua Tahun');

  // Modal control states
  const [selectedPermission, setSelectedPermission] = useState<StudentPermission | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPrintCardModal, setShowPrintCardModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [printCardSearch, setPrintCardSearch] = useState('');
  const [previewPdf, setPreviewPdf] = useState<{ url: string; fileName: string; blob: Blob } | null>(null);

  // Extend Permission states
  const [extendDateTime, setExtendDateTime] = useState('');
  const [extendNotes, setExtendNotes] = useState('');

  // Manual Permission Wizard states
  const [wizardStep, setWizardStep] = useState<1 | 2>(1); // 1: Select Student, 2: Fill Form
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Wizard Checkout Form state
  const [permitType, setPermitType] = useState<'Pulang' | 'Keluar Singkat' | 'Sakit' | 'Lainnya'>('Keluar Singkat');
  const [emergencyDispensation, setEmergencyDispensation] = useState(false);
  const [pulangEligibility, setPulangEligibility] = useState<EligibilityResult>({ isEligible: true, daysRemaining: 0, lastDate: null });
  const [permitReason, setPermitReason] = useState('');
  const [permitDurationHours, setPermitDurationHours] = useState('2');
  const [permitDurationMinutes, setPermitDurationMinutes] = useState('0');
  const [permitDurationDays, setPermitDurationDays] = useState('3');
  const [permitNotes, setPermitNotes] = useState('');

  // Derived Statistics
  const availableYears = useMemo(() => {
    const years = new Set(permissions.map(p => new Date(p.startDate).getFullYear()));
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [permissions]);

  const totalOutside = useMemo(() => students.filter(s => s.statusPerizinan === 'Di Luar').length, [students]);
  const totalPermissions = useMemo(() => permissions.length, [permissions]);
  const lateReturnCount = useMemo(() => permissions.filter(p => p.status === 'Terlambat').length, [permissions]);

  const breakdownOutside = useMemo(() => {
    const activePerms = permissions.filter(p => p.status === 'Aktif');
    let sick = 0;
    let home = 0;
    let short = 0;
    let other = 0;

    activePerms.forEach(p => {
      if (p.type === 'Sakit') sick++;
      else if (p.type === 'Pulang') home++;
      else if (p.type === 'Keluar Singkat') short++;
      else other++;
    });

    return { sick, home, short, other };
  }, [permissions]);

  // Filtered permission list
  const filteredPermissions = useMemo(() => {
    return permissions.filter(p => {
      const matchesSearch = p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.studentClass.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.reason && p.reason.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = filterStatus === 'Semua Status' || p.status === filterStatus;
      
      const pDate = new Date(p.startDate);
      const matchesMonth = filterMonth === 'Semua Bulan' || (pDate.getMonth() + 1).toString() === filterMonth;
      const matchesYear = filterYear === 'Semua Tahun' || pDate.getFullYear().toString() === filterYear;

      return matchesSearch && matchesStatus && matchesMonth && matchesYear;
    });
  }, [permissions, searchQuery, filterStatus, filterMonth, filterYear]);

  // Filtered student list for the manual search wizard
  const searchedStudentsForWizard = useMemo(() => {
    if (!studentSearch.trim()) return [];
    return students.filter(s => 
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.class.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.barcodeId && s.barcodeId.toLowerCase().includes(studentSearch.toLowerCase()))
    ).slice(0, 5); // limit to 5 suggestions
  }, [students, studentSearch]);

  // Filtered student list for the print card modal
  const searchedStudentsForPrintCard = useMemo(() => {
    if (!printCardSearch.trim()) return students.slice(0, 8);
    return students.filter(s => 
      s.name.toLowerCase().includes(printCardSearch.toLowerCase()) ||
      s.class.toLowerCase().includes(printCardSearch.toLowerCase()) ||
      (s.barcodeId && s.barcodeId.toLowerCase().includes(printCardSearch.toLowerCase()))
    ).slice(0, 8);
  }, [students, printCardSearch]);

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
      const blob = await printPermissionGatePass(student, selectedPermission, permissions, arrears);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GATEPASS_${student.name.replace(/\s+/g,'_')}_${selectedPermission.id}.pdf`;
      link.click();
    } catch (err) {
      console.error('Failed to print permit:', err);
    }
  };

  const handlePrintCard = async (student: Student) => {
    try {
      const blob = await printStudentIDCard(student);
      const url = URL.createObjectURL(blob);
      setPreviewPdf({
        url,
        fileName: `Kartu_ID_${student.name.replace(/\s+/g, '_')}.pdf`,
        blob
      });
    } catch (err) {
      console.error(err);
      toast.error('Gagal membuat kartu ID.');
    }
  };

  const handleDownloadPdf = () => {
    if (!previewPdf) return;
    const a = document.createElement('a');
    a.href = previewPdf.url;
    a.download = previewPdf.fileName;
    a.click();
  };

  // Select student in wizard
  const handleSelectStudentForWizard = (student: Student) => {
    // Check if they are already out
    if (student.statusPerizinan === 'Di Luar') {
      toast.error(`Santri ${student.name} sedang berada DI LUAR. Selesaikan kedatangan mereka di Portal Scan terlebih dahulu.`);
      return;
    }
    
    // Check if they have arrears
    const studentArrears = arrears.filter(a => a.studentId === student.id && a.status !== 'Lunas');
    const isBypassed = student.dispensationStatus === true;

    if (studentArrears.length > 0 && !isBypassed) {
      const totalAmt = studentArrears.reduce((sum, a) => sum + a.amount, 0);
      toast.error(`IZIN DITOLAK!\nSantri memiliki tunggakan sebesar Rp ${totalAmt.toLocaleString('id-ID')}.`, { duration: 6000 });
      return;
    }

    setSelectedStudent(student);
    setPermitType('Keluar Singkat');
    setPermitReason('');
    setPermitDurationHours('2');
    setPermitDurationMinutes('0');
    setPermitDurationDays('3');
    setPermitNotes('');
    
    // Check 100-day eligibility
    const eligibility = checkPulangEligibility(student.id, permissions);
    setPulangEligibility(eligibility);
    setEmergencyDispensation(false); // Reset emergency flag

    setWizardStep(2);
  };

  // Submit manual permission checkout
  const handleManualCheckoutSubmit = async () => {
    if (!selectedStudent) return;

    const confirmCheckout = await confirm({
      title: 'Konfirmasi Check-Out',
      message: `Apakah Anda yakin ingin memproses izin "${permitType}" secara manual untuk santri "${selectedStudent.name}"?`,
      type: 'warning'
    });
    if (!confirmCheckout) return;

    // Calculate expected return
    const expected = new Date();
    if (permitType === 'Keluar Singkat') {
      const hours = parseInt(permitDurationHours) || 0;
      const minutes = parseInt(permitDurationMinutes) || 0;
      expected.setHours(expected.getHours() + hours);
      expected.setMinutes(expected.getMinutes() + minutes);
    } else {
      const days = parseInt(permitDurationDays) || 3;
      expected.setDate(expected.getDate() + days);
    }

    try {
      const finalNotes = emergencyDispensation 
        ? `[DISPEN DARURAT 100 HARI] ${permitNotes}`.trim()
        : permitNotes;

      await addPermission({
        studentId: selectedStudent.id,
        type: permitType,
        reason: permitReason || `Izin ${permitType} (Manual)`,
        durationHours: permitType === 'Keluar Singkat' ? parseInt(permitDurationHours) : undefined,
        expectedReturnDate: expected.toISOString(),
        createdBy: user?.id || '',
        notes: finalNotes
      });

      if (selectedStudent.dispensationStatus) {
        await updateStudent(selectedStudent.id, { dispensationStatus: false, dispensationReason: '' });
      }

      setShowManualModal(false);
      // Reset Wizard states
      setWizardStep(1);
      setStudentSearch('');
      setSelectedStudent(null);
      toast.success('Izin berhasil ditambahkan!');
    } catch (err: any) {
      toast.error(`Gagal membuat izin: ${err.message || 'Error tidak dikenal'}`);
    }
  };

  const handleExtendSubmit = async () => {
    if (!selectedPermission) return;
    if (!extendNotes.trim() || !extendDateTime) {
      toast.error('Alasan dan Batas Waktu baru wajib diisi!');
      return;
    }
    const confirmExtend = await confirm({
      title: 'Perpanjangan Waktu',
      message: `Apakah Anda yakin ingin memperpanjang waktu kembali santri ini?`,
      type: 'warning'
    });
    if (!confirmExtend) return;
    try {
      const newExpected = new Date(extendDateTime);
      const currentExpected = new Date(selectedPermission.expectedReturnDate);
      
      // Calculate diff for PDF info
      const diffMs = newExpected.getTime() - currentExpected.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      const amountText = diffHours >= 24 ? `${Math.floor(diffHours/24)} Hari` : `${diffHours} Jam`;

      const extensionNote = `[Diperpanjang s/d ${newExpected.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}]: ${extendNotes}`;
      const newNotes = selectedPermission.notes 
        ? `${selectedPermission.notes} | ${extensionNote}`
        : extensionNote;

      await updatePermission(selectedPermission.id, {
        expectedReturnDate: newExpected.toISOString(),
        notes: newNotes,
        durationHours: selectedPermission.durationHours ? selectedPermission.durationHours + (diffHours) : undefined
      });

      // Generate PDF for extension
      const student = students.find(s => s.id === selectedPermission.studentId);
      if (student) {
        const blob = await printPermissionExtensionPass(
          student,
          { ...selectedPermission, expectedReturnDate: newExpected.toISOString(), notes: newNotes },
          amountText,
          extendNotes
        );
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }

      setShowExtendModal(false);
      setExtendDateTime('');
      setExtendNotes('');
      toast.success('Waktu izin berhasil diperpanjang!');
    } catch (err: any) {
      toast.error(`Gagal memperpanjang izin: ${err.message || 'Error tidak dikenal'}`);
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

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowPrintCardModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-sky-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] shadow-xl shadow-sky-200 hover:bg-sky-500 transition-all uppercase tracking-[0.2em]"
          >
            <CreditCard size={14} />
            Cetak Kartu Santri
          </button>
          <button
            onClick={() => {
              setWizardStep(1);
              setStudentSearch('');
              setSelectedStudent(null);
              setShowManualModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all uppercase tracking-[0.2em]"
          >
            <Plus size={14} />
            Tambah Izin Manual
          </button>
        </div>
      </div>

      {/* Analytics Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Santri di Luar</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tight">{totalOutside}</h3>
              <p className="text-[10px] font-medium text-slate-400 mt-1">Status aktif di luar kawasan</p>
            </div>
            <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
              <Users size={20} />
            </div>
          </div>
        </div>

        <div className="relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Keterlambatan</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tight">{lateReturnCount}</h3>
              <p className="text-[10px] font-medium text-slate-400 mt-1">Pelanggaran batas waktu</p>
            </div>
            <div className="w-12 h-12 bg-amber-50/50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
              <Clock size={20} />
            </div>
          </div>
        </div>

        <div className="relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Sesi</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tight">{totalPermissions}</h3>
              <p className="text-[10px] font-medium text-slate-400 mt-1">Seluruh riwayat terdaftar</p>
            </div>
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-slate-400 group-hover:text-white transition-all duration-500">
              <FileText size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Panel */}
      {totalOutside > 0 && (
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                <MapPin size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">
                  Status Distribusi Aktif
                </h4>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5 italic">Real-time monitoring santri di luar</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{totalOutside} Santri</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all duration-500">🩺</div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Sakit</p>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">{breakdownOutside.sick}</h4>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all duration-500">🏡</div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Pulang</p>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">{breakdownOutside.home}</h4>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all duration-500">⏱️</div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Singkat</p>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">{breakdownOutside.short}</h4>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all duration-500">📌</div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Lainnya</p>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">{breakdownOutside.other}</h4>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="bg-white p-6 md:p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          
          {/* Search text input */}
          <div className="md:col-span-2 space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
              <Search size={14} /> Cari Nama / Kelas / Keterangan
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ketik nama santri, kelas, atau kata kunci..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-touch w-full pr-12"
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
              className="input-touch w-full cursor-pointer"
            >
              <option value="Semua Status">Semua Status</option>
              <option value="Aktif">Aktif (Sedang di Luar)</option>
              <option value="Kembali">Kembali (Tepat Waktu)</option>
              <option value="Terlambat">Kembali (Terlambat)</option>
              <option value="Dibatalkan">Izin Dibatalkan</option>
            </select>
          </div>

          {/* Time filters */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
              <Calendar size={14} /> Waktu Izin
            </label>
            <div className="flex gap-2">
              <select
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                className="input-touch w-1/2 cursor-pointer !px-4"
              >
                <option value="Semua Bulan">Bulan</option>
                <option value="1">Jan</option>
                <option value="2">Feb</option>
                <option value="3">Mar</option>
                <option value="4">Apr</option>
                <option value="5">Mei</option>
                <option value="6">Jun</option>
                <option value="7">Jul</option>
                <option value="8">Agu</option>
                <option value="9">Sep</option>
                <option value="10">Okt</option>
                <option value="11">Nov</option>
                <option value="12">Des</option>
              </select>
              <select
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
                className="input-touch w-1/2 cursor-pointer !px-4"
              >
                <option value="Semua Tahun">Tahun</option>
                {availableYears.map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>
            </div>
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

        <div className="table-responsive max-h-[600px]">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-white sticky top-0 z-10 shadow-sm border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Santri & Kelas</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe & Keterangan</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu Keluar / Kembali</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
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
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group/row">
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-900 uppercase">{p.studentName}</p>
                      <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5">{p.studentClass}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-slate-700 uppercase">{p.type}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest truncate max-w-[120px]">{p.reason}</p>
                        {p.notes?.toLowerCase().includes('diperpanjang') && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black rounded uppercase tracking-tighter shrink-0">EXT</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-slate-700">
                        {new Date(p.startDate).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 italic">
                        Kembali: {new Date(p.expectedReturnDate).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={cn(
                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block",
                        p.status === 'Aktif' && !p.notes?.toLowerCase().includes('diperpanjang') && "bg-sky-50 text-sky-600 border border-sky-100",
                        p.status === 'Aktif' && p.notes?.toLowerCase().includes('diperpanjang') && "bg-amber-50 text-amber-600 border border-amber-100",
                        p.status === 'Kembali' && "bg-emerald-50 text-emerald-600 border border-emerald-100",
                        p.status === 'Terlambat' && "bg-amber-50 text-amber-600 border border-amber-100",
                        p.status === 'Dibatalkan' && "bg-slate-50 text-slate-600 border border-slate-100"
                      )}>
                        {p.status === 'Aktif' 
                          ? (p.notes?.toLowerCase().includes('diperpanjang') ? 'PERPANJANGAN' : 'DI LUAR') 
                          : p.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {p.notes?.toLowerCase().includes('diperpanjang') && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const student = students.find(s => s.id === p.studentId);
                              if (!student) return;
                              const noteLines = p.notes?.split('|') || [];
                              const extLine = [...noteLines].reverse().find(l => l.toLowerCase().includes('diperpanjang')) || '';
                              
                              try {
                                const currentExpected = new Date(p.expectedReturnDate);
                                // For reprint, we calculate from the first date if possible, but simplest is to just use the total duration or specific text
                                const blob = await printPermissionExtensionPass(student, p, "Terlampir", extLine);
                                const url = URL.createObjectURL(blob);
                                window.open(url, '_blank');
                              } catch (err) {
                                toast.error('Gagal cetak.');
                              }
                            }}
                            className="p-2 bg-amber-50 border border-amber-200 hover:bg-amber-500 hover:text-white rounded-xl text-amber-600 transition-all shadow-sm"
                            title="Cetak Ulang Surat Perpanjangan"
                          >
                            <Printer size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenDetail(p)}
                          className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-900 hover:text-white rounded-xl text-slate-500 hover:border-slate-950 transition-all inline-flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-widest"
                        >
                          <Eye size={12} /> Detail
                        </button>
                      </div>
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
                            onChange={e => {
                              setPermitType(e.target.value as any);
                              setEmergencyDispensation(false);
                            }}
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
                            <div className="flex gap-2">
                              <select
                                value={permitDurationHours}
                                onChange={e => setPermitDurationHours(e.target.value)}
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none"
                              >
                                {[...Array(13)].map((_, i) => (
                                  <option key={i} value={i}>{i} Jam</option>
                                ))}
                              </select>
                              <select
                                value={permitDurationMinutes}
                                onChange={e => setPermitDurationMinutes(e.target.value)}
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none"
                              >
                                {[0, 5, 10, 15, 20, 30, 45].map(m => (
                                  <option key={m} value={m}>{m} Menit</option>
                                ))}
                              </select>
                            </div>
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
                              <option value="14">14 Hari</option>
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
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan Tambahan (Opsional)</label>
                        <textarea
                          placeholder="Masukkan catatan pendukung administrasi..."
                          value={permitNotes}
                          onChange={e => setPermitNotes(e.target.value)}
                          rows={2}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                        />
                      </div>
                      
                      {/* 100 Day Rule Alert for Manual Entry */}
                      {permitType !== 'Keluar Singkat' && !pulangEligibility.isEligible && (
                        <div className={cn(
                          "p-4 rounded-2xl border flex flex-col gap-3 transition-all duration-500 mt-2",
                          emergencyDispensation ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
                        )}>
                          <div className="flex gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                              emergencyDispensation ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                            )}>
                              {emergencyDispensation ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
                            </div>
                            <div className="space-y-0.5">
                              <p className={cn("text-[9px] font-black uppercase tracking-wider", emergencyDispensation ? "text-emerald-700" : "text-rose-700")}>
                                {emergencyDispensation ? "Dispensasi Aktif" : "Aturan 100 Hari"}
                              </p>
                              <p className={cn("text-[10px] font-bold leading-tight", emergencyDispensation ? "text-emerald-600" : "text-rose-600")}>
                                {emergencyDispensation 
                                  ? "Izin diberikan atas pertimbangan darurat." 
                                  : `Belum 100 hari (Terakhir: ${pulangEligibility.lastDate}). Tersisa ${pulangEligibility.daysRemaining} hari.`}
                              </p>
                            </div>
                          </div>
                          {!emergencyDispensation && (
                            <button
                              onClick={() => setEmergencyDispensation(true)}
                              className="w-full py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                            >
                              Gunakan Dispensasi Darurat
                            </button>
                          )}
                        </div>
                      )}
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
                    disabled={permitType !== 'Keluar Singkat' && !pulangEligibility.isEligible && !emergencyDispensation}
                    className={cn(
                      "flex-1 py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg",
                      permitType !== 'Keluar Singkat' && !pulangEligibility.isEligible && !emergencyDispensation
                        ? "bg-slate-200 cursor-not-allowed"
                        : "bg-slate-900 hover:bg-slate-800"
                    )}
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

                <div className="flex flex-col sm:flex-row gap-3">
                  {selectedPermission.status === 'Aktif' && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowExtendModal(true);
                        setExtendDateTime('');
                        setExtendNotes('');
                      }}
                      className="btn-touch flex-1 bg-sky-50 border border-sky-200 text-sky-700 rounded-2xl"
                    >
                      Perpanjang
                    </button>
                  )}
                  {selectedPermission.notes?.toLowerCase().includes('diperpanjang') && (
                    <button
                      onClick={async () => {
                        const student = students.find(s => s.id === selectedPermission.studentId);
                        if (!student) return;
                        const noteLines = selectedPermission.notes?.split('|') || [];
                        const extLine = [...noteLines].reverse().find(l => l.toLowerCase().includes('diperpanjang')) || '';
                        
                        try {
                          const blob = await printPermissionExtensionPass(student, selectedPermission, "Terlampir", extLine);
                          const url = URL.createObjectURL(blob);
                          window.open(url, '_blank');
                        } catch (err) {
                          toast.error('Gagal cetak.');
                        }
                      }}
                      className="btn-touch flex-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl"
                    >
                      Cetak Perpanjangan
                    </button>
                  )}
                  <button
                    onClick={handlePrintTicket}
                    className="btn-touch flex-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl"
                  >
                    Cetak Tiket
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="btn-touch flex-1 bg-slate-900 text-white rounded-2xl"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* 🟠 EXTEND PERMISSION MODAL              */}
      {/* ======================================= */}
      <AnimatePresence>
        {showExtendModal && selectedPermission && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
                    <Clock size={18} />
                  </div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Perpanjang Izin</h3>
                </div>
                <button 
                  onClick={() => setShowExtendModal(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-950 transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-8 space-y-6 text-slate-800">
                <div className="text-center space-y-1">
                  <h4 className="text-lg font-black text-slate-900 uppercase truncate">{selectedPermission.studentName}</h4>
                  <p className="text-xs font-bold text-slate-500">
                    Batas Kembali Saat Ini: {new Date(selectedPermission.expectedReturnDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Pilih Tanggal & Jam Baru (Batas Kembali)
                    </label>
                    <input
                      type="datetime-local"
                      value={extendDateTime}
                      onChange={e => setExtendDateTime(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-4 focus:ring-sky-100 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alasan Perpanjangan (Wajib)</label>
                    <textarea
                      placeholder="Alasan perpanjangan waktu..."
                      value={extendNotes}
                      onChange={e => setExtendNotes(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowExtendModal(false)}
                    className="flex-1 py-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-center"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleExtendSubmit}
                    className="flex-1 py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-center shadow-lg shadow-sky-200"
                  >
                    Simpan Perpanjangan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPrintCardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPrintCardModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 space-y-6 max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cetak Kartu ID Santri</h3>
                  <p className="text-xs text-slate-500 font-medium">Cari dan cetak barcode kartu identitas santri untuk akses gerbang perizinan.</p>
                </div>
                <button onClick={() => setShowPrintCardModal(false)} className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl flex items-center justify-center transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Cari nama santri, kelas, atau barcode ID..."
                  value={printCardSearch}
                  onChange={e => setPrintCardSearch(e.target.value)}
                  className="w-full pl-13 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 outline-none focus:ring-4 focus:ring-slate-100 transition-all"
                />
              </div>

              <div className="overflow-y-auto space-y-3 flex-1 pr-2">
                {searchedStudentsForPrintCard.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-semibold italic">Santri tidak ditemukan.</div>
                ) : (
                  searchedStudentsForPrintCard.map(student => (
                    <div key={student.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-4 hover:bg-slate-100/80 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 text-white font-black text-lg rounded-xl flex items-center justify-center shadow-sm">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{student.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">{student.class}</span>
                            <span className="text-[10px] font-bold text-slate-500">{student.barcodeId || 'PPNH-' + student.id.substring(0,8).toUpperCase()}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePrintCard(student)}
                        className="px-5 py-3 bg-white border border-slate-200 hover:bg-sky-600 hover:text-white hover:border-sky-600 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
                      >
                        <Printer size={14} /> Cetak
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PdfPreviewModal
        previewPdf={previewPdf}
        title="Kartu ID Santri"
        onClose={() => {
          if (previewPdf) URL.revokeObjectURL(previewPdf.url);
          setPreviewPdf(null);
        }}
        onDownload={handleDownloadPdf}
      />

    </motion.div>
  );
}
