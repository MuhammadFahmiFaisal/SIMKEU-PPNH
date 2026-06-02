import React, { useState } from 'react';
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useStudents } from '../hooks/useStudents';
import { useArrears } from '../hooks/useArrears';
import { useReceipts } from '../hooks/useReceipts';
import { useConfirm } from '../context/ConfirmContext';

// Sub-components
import { ArrearStats } from '../components/features/arrears/ArrearStats';
import { ArrearFilters } from '../components/features/arrears/ArrearFilters';
import { ArrearTable } from '../components/features/arrears/ArrearTable';
import { ArrearDetailModal } from '../components/features/arrears/ArrearDetailModal';
import { AddArrearModal } from '../components/features/arrears/AddArrearModal';
import { BulkArrearModal } from '../components/features/arrears/BulkArrearModal';
import { useArrearLogic } from '../components/features/arrears/useArrearLogic';
import { Arrear } from '../types';

export function ArrearsManagement() {
  const { students } = useStudents();
  const { arrears, batchAddArrears, deleteArrear, updateArrear, processPayment } = useArrears();
  const { sendPaymentReceipt, sendConsolidatedReceipt, previewReceiptPDF } = useReceipts();
  const { user } = useAuth();
  const { confirm } = useConfirm();

  const isSuperAdmin = user?.role === 'Super Admin';
  const isAuditor = user?.role === 'Auditor';
  const canWrite = user?.role === 'Super Admin' || user?.role === 'Bendahara';

  // State for UI control
  const [showModal, setShowModal] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<string | null>(null);
  const [showPaid, setShowPaid] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('Semua');
  const [filterResidence, setFilterResidence] = useState('Semua');
  const [sortBy, setSortBy] = useState<'highest' | 'lowest' | 'name'>('highest');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // State for partial payment
  const [partialPayingId, setPartialPayingId] = useState<string | null>(null);
  const [partialInput, setPartialInput] = useState('');

  // State for Add Modal
  const [arrearLines, setArrearLines] = useState<Omit<Arrear, 'id' | 'studentId' | 'status'>[]>([
    { type: 'SPP', month: 'Mei 2026', amount: 250000, dueDate: new Date().toISOString().split('T')[0] }
  ]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // State for Bulk Modal
  const [bulkData, setBulkData] = useState({
    type: 'SPP',
    month: `${new Date().toLocaleDateString('id-ID', { month: 'long' })} ${new Date().getFullYear()}`,
    amount: 250000,
    targetClass: 'Semua',
    targetResidence: 'mondok',
    dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0]
  });

  // Custom Logic Hook
  const { groupedData, classes, stats } = useArrearLogic({
    students,
    arrears,
    showPaid,
    searchQuery,
    filterClass,
    filterResidence,
    sortBy
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetStudents = bulkData.targetClass === 'Semua'
      ? students
      : students.filter(s => s.class === bulkData.targetClass);

    if (bulkData.targetResidence === 'mondok') {
      targetStudents = targetStudents.filter(s => s.residenceStatus !== 'Ansor');
    } else if (bulkData.targetResidence === 'ansor') {
      targetStudents = targetStudents.filter(s => s.residenceStatus === 'Ansor');
    }

    if (targetStudents.length === 0) {
      showToast('error', 'Tidak ada siswa terpilih untuk kriteria filter ini.');
      return;
    }

    const newArrears = targetStudents.map(s => ({
      studentId: s.id,
      type: bulkData.type,
      month: bulkData.month,
      amount: bulkData.amount,
      dueDate: bulkData.dueDate
    }));

    const confirmBulk = await confirm({
      title: 'Konfirmasi Tagihan Massal',
      message: `Apakah Anda yakin ingin membuat tagihan massal "${bulkData.type}" (${bulkData.month}) senilai Rp ${bulkData.amount.toLocaleString('id-ID')} untuk ${targetStudents.length} santri?`,
      type: 'warning'
    });
    if (!confirmBulk) return;

    setIsProcessing(true);
    try {
      await batchAddArrears(newArrears);
      showToast('success', `Berhasil membuat ${newArrears.length} tagihan baru.`);
      setIsBulkModalOpen(false);
    } catch (err) {
      showToast('error', 'Gagal membuat tagihan.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenAddModal = () => {
    setArrearLines([{
      type: 'SPP', month: 'Mei 2026', amount: 250000, dueDate: new Date().toISOString().split('T')[0]
    }]);
    setSelectedStudentId('');
    setStudentSearchQuery('');
    setShowModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedArrears = arrearLines.map(line => ({
      ...line,
      studentId: selectedStudentId
    }));

    setIsProcessing(true);
    try {
      await batchAddArrears(formattedArrears);
      showToast('success', 'Tagihan berhasil ditambahkan.');
      setShowModal(false);
    } catch (err) {
      showToast('error', 'Gagal menambah tagihan.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const arrear = arrears.find(a => a.id === id);
    const student = students.find(s => s.id === arrear?.studentId);
    const confirmDelete = await confirm({
      title: 'Hapus Tagihan',
      message: `Apakah Anda yakin ingin menghapus tagihan ${arrear?.type} (${arrear?.month}) senilai Rp ${arrear?.amount.toLocaleString('id-ID')} milik santri "${student?.name || 'terkait'}"?`,
      type: 'danger'
    });
    if (!confirmDelete) return;

    try {
      await deleteArrear(id);
      showToast('success', 'Tagihan berhasil dihapus.');
    } catch (err) {
      showToast('error', 'Gagal menghapus tagihan.');
    }
  };

  const handleProcessPayment = async (id: string, amount: number) => {
    try {
      await processPayment(id, amount);
      showToast('success', 'Pembayaran berhasil diproses.');
    } catch (err) {
      showToast('error', 'Gagal memproses pembayaran.');
    }
  };

  const handleUpdateArrear = async (id: string, data: Partial<Arrear>) => {
    try {
      await updateArrear(id, data);
      showToast('success', 'Tagihan berhasil diperbarui.');
    } catch (err) {
      showToast('error', 'Gagal memperbarui tagihan.');
    }
  };

  const handleSendConsolidatedReceipt = async (studentId: string, payments: { type: string, month: string, amount: number }[]) => {
    try {
      await sendConsolidatedReceipt(studentId, payments);
      showToast('success', 'Membuka WhatsApp untuk mengirim struk...');
    } catch (err) {
      showToast('error', 'Gagal memproses pengiriman struk.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={cn("fixed top-8 right-8 z-[150] flex items-center gap-3 px-8 py-5 rounded-2xl shadow-2xl border backdrop-blur-xl",
              notification.type === 'success' ? "bg-emerald-600 text-white border-emerald-500" : "bg-red-600 text-white border-red-500"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-xs font-black uppercase tracking-[0.2em]">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 sm:px-1">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-lg">
            <Wallet size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Financial Central</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight uppercase tracking-tighter">Manajemen Tunggakan</h2>
          <p className="text-slate-500 font-medium italic text-xs sm:text-sm">Pengelompokan data per siswa untuk verifikasi lebih cepat.</p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          <button
            onClick={() => setShowPaid(!showPaid)}
            className={cn(
              "inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-xs transition-all border shadow-sm",
              showPaid ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            {showPaid ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {showPaid ? "Semua Siswa" : "Hanya Belum Lunas"}
          </button>
          {canWrite && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleOpenAddModal}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 shadow-sm"
              >
                <PlusCircle size={18} /> Tambah Tunggakan
              </button>
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
              >
                <Users size={18} /> Tagihan Massal
              </button>
            </div>
          )}
        </div>
      </div>

      <ArrearStats
        totalUnpaidAll={stats.totalUnpaidAll}
        totalItemsUnpaid={stats.totalItemsUnpaid}
        canWrite={canWrite}
        isAuditor={isAuditor}
      />

      <ArrearFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterClass={filterClass}
        setFilterClass={setFilterClass}
        filterResidence={filterResidence}
        setFilterResidence={setFilterResidence}
        sortBy={sortBy}
        setSortBy={setSortBy}
        classes={classes}
      />

      <ArrearTable
        groupedData={groupedData}
        onDetailClick={setSelectedStudentForDetail}
      />

      {/* Modals */}
      <ArrearDetailModal
        isOpen={!!selectedStudentForDetail}
        onClose={() => setSelectedStudentForDetail(null)}
        student={students.find(s => s.id === selectedStudentForDetail)}
        arrears={arrears}
        showPaid={showPaid}
        canWrite={canWrite}
        isAuditor={isAuditor}
        partialPayingId={partialPayingId}
        setPartialPayingId={setPartialPayingId}
        partialInput={partialInput}
        setPartialInput={setPartialInput}
        processPayment={handleProcessPayment}
        deleteArrear={handleDelete}
        updateArrear={handleUpdateArrear}
        sendConsolidatedReceipt={handleSendConsolidatedReceipt}
        previewReceiptPDF={previewReceiptPDF}
      />

      <AddArrearModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        students={students}
        arrears={arrears}
        arrearLines={arrearLines}
        setArrearLines={setArrearLines}
        selectedStudentId={selectedStudentId}
        setSelectedStudentId={setSelectedStudentId}
        studentSearchQuery={studentSearchQuery}
        setStudentSearchQuery={setStudentSearchQuery}
        isProcessing={isProcessing}
        onSubmit={handleAddSubmit}
      />

      <BulkArrearModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        classes={classes}
        arrears={arrears}
        bulkData={bulkData}
        setBulkData={setBulkData}
        isProcessing={isProcessing}
        onSubmit={handleBulkSubmit}
      />
    </motion.div>
  );
}
