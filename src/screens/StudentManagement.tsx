import React, { useState, useRef } from 'react';
import { 
  Download, 
  UserPlus, 
  Filter, 
  Users,
  Search,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { useStudents } from '../hooks/useStudents';
import { Student } from '../types';
import * as XLSX from 'xlsx';

// Sub-components
import { StudentTable } from '../components/features/students/StudentTable';
import { StudentModal } from '../components/features/students/StudentModal';
import { useStudentLogic } from '../components/features/students/useStudentLogic';
import { printClearanceLetter, printStudentIDCard } from '../lib/pdfGenerator';
import { PdfPreviewModal } from '../components/features/notifications/PdfPreviewModal';

export function StudentManagement() {
  const { user } = useAuth();
  const { students, addStudent, updateStudent, deleteStudent, batchAddStudents } = useStudents();
  const { confirm } = useConfirm();
  const isSuperAdmin = user?.role === 'Super Admin';
  const isAuditor = user?.role === 'Auditor';
  const canWrite = user?.role === 'Super Admin' || user?.role === 'Bendahara' || user?.role === 'Keamanan';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('Semua Kelas');
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [previewPdf, setPreviewPdf] = useState<{ url: string; fileName: string; blob: Blob } | null>(null);
  
  // Promote Class State
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteOldClass, setPromoteOldClass] = useState('');
  const [promoteNewClass, setPromoteNewClass] = useState('');
  const [isPromoting, setIsPromoting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    parentName: '',
    whatsapp: '',
    gender: 'L' as 'L' | 'P',
    residenceStatus: 'Mondok' as 'Mondok' | 'Ansor',
    nisn: '',
    alamat: '',
    tempatLahir: '',
    tanggalLahir: '',
    photoUrl: ''
  });

  const uniqueClasses = Array.from(new Set(students.map(s => s.class))).sort();
  const { filteredStudents } = useStudentLogic({ students, searchQuery, selectedClass });

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        class: student.class,
        parentName: student.parentName,
        whatsapp: student.whatsapp,
        gender: student.gender,
        residenceStatus: student.residenceStatus,
        nisn: student.nisn || '',
        alamat: student.alamat || '',
        tempatLahir: student.tempatLahir || '',
        tanggalLahir: student.tanggalLahir || '',
        photoUrl: student.photoUrl || ''
      });
    } else {
      setEditingStudent(null);
      setFormData({ 
        name: '', 
        class: '', 
        parentName: '', 
        whatsapp: '',
        gender: 'L',
        residenceStatus: 'Mondok',
        nisn: '',
        alamat: '',
        tempatLahir: '',
        tanggalLahir: '',
        photoUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, formData);
        setUploadStatus({ type: 'success', message: 'Profil siswa berhasil diperbarui.' });
      } else {
        await addStudent(formData);
        setUploadStatus({ type: 'success', message: 'Siswa baru berhasil didaftarkan.' });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setUploadStatus({ type: 'error', message: err.message || 'Terjadi kesalahan sistem.' });
    }
    setTimeout(() => setUploadStatus(null), 3000);
  };

  const handleDelete = async (id: string) => {
    const student = students.find(s => s.id === id);
    const confirmDelete = await confirm({
      title: 'Hapus Santri',
      message: `Apakah Anda yakin ingin menghapus data santri "${student?.name || 'ini'}"? Seluruh riwayat perizinan dan tunggakan terkait santri ini juga akan ikut terhapus.`,
      type: 'danger'
    });
    if (!confirmDelete) return;

    try {
      await deleteStudent(id);
      setUploadStatus({ type: 'success', message: 'Siswa berhasil dihapus.' });
    } catch (err: any) {
      setUploadStatus({ type: 'error', message: err.message || 'Gagal menghapus siswa.' });
    }
    setTimeout(() => setUploadStatus(null), 3000);
  };

  const handlePrintClearance = async (student: Student) => {
    const blob = await printClearanceLetter(student);
    const url = URL.createObjectURL(blob);
    setPreviewPdf({
      url,
      fileName: `Surat_Izin_Pulang_${student.name.replace(/\s+/g, '_')}.pdf`,
      blob
    });
  };

  const handlePrintCard = async (student: Student) => {
    const blob = await printStudentIDCard(student);
    const url = URL.createObjectURL(blob);
    setPreviewPdf({
      url,
      fileName: `Kartu_ID_${student.name.replace(/\s+/g, '_')}.pdf`,
      blob
    });
  };

  const handleDownloadPdf = () => {
    if (!previewPdf) return;
    const a = document.createElement('a');
    a.href = previewPdf.url;
    a.download = previewPdf.fileName;
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const dataBuffer = evt.target?.result;
        if (!dataBuffer) throw new Error("File empty");
        
        const wb = XLSX.read(dataBuffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws) as any[];

        const formattedStudents = jsonData.map(row => ({
          name: String(row.Nama || row.nama || '').trim(),
          class: String(row.Kelas || row.kelas || row.Class || '').trim(),
          parentName: String(row['Nama Wali'] || row.Wali || row.Parent || 'Wali Siswa').trim(),
          whatsapp: String(row.WhatsApp || row.whatsapp || row.WA || '628').replace(/[^0-9]/g, ''),
          gender: (String(row.JK || row.jk || row.Gender || 'L')).toUpperCase().startsWith('P') ? 'P' : 'L' as 'L' | 'P',
          residenceStatus: (String(row.Status || row.status || row.Residence || 'Mondok')).toLowerCase().includes('ansor') ? 'Ansor' : 'Mondok' as 'Mondok' | 'Ansor'
        })).filter(s => s.name !== '');

        if (formattedStudents.length > 0) {
          const confirmImport = await confirm({
            title: 'Konfirmasi Import',
            message: `Apakah Anda yakin ingin mengimpor ${formattedStudents.length} santri dari file Excel ini?`,
            type: 'info'
          });
          if (!confirmImport) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }
          setUploadStatus({ type: 'info', message: `Sedang mengimpor ${formattedStudents.length} siswa...` });
          await batchAddStudents(formattedStudents);
          setUploadStatus({ type: 'success', message: `${formattedStudents.length} siswa berhasil diimpor.` });
        } else {
          setUploadStatus({ type: 'error', message: 'Data kosong atau kolom Nama tidak ditemukan.' });
        }
      } catch (err: any) {
        console.error("Excel Read Error:", err);
        setUploadStatus({ type: 'error', message: err.message || 'Gagal membaca atau mengimpor file Excel.' });
      }
      
      setTimeout(() => setUploadStatus(null), 5000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handlePromoteClass = async () => {
    if(!promoteOldClass || !promoteNewClass) return;
    const studentsToUpdate = students.filter(s => s.class === promoteOldClass);
    if (studentsToUpdate.length === 0) {
      setUploadStatus({ type: 'error', message: `Tidak ada santri di kelas "${promoteOldClass}".`});
      return;
    }
    const confirmPromote = await confirm({
      title: 'Konfirmasi Mutasi',
      message: `Apakah Anda yakin ingin memindahkan ${studentsToUpdate.length} santri dari kelas "${promoteOldClass}" ke "${promoteNewClass}" secara massal?`,
      type: 'warning'
    });
    if (!confirmPromote) return;

    setIsPromoting(true);
    try {
       await Promise.all(studentsToUpdate.map(s => updateStudent(s.id, { class: promoteNewClass })));
       setUploadStatus({ type: 'success', message: `${studentsToUpdate.length} santri berhasil dipindah kelas.`});
       setIsPromoteModalOpen(false);
       setPromoteOldClass('');
       setPromoteNewClass('');
    } catch(err) {
       setUploadStatus({ type: 'error', message: 'Gagal memindah kelas santri.'});
    }
    setIsPromoting(false);
    setTimeout(() => setUploadStatus(null), 3000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <AnimatePresence>
        {uploadStatus && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} 
            className={cn("fixed top-8 right-8 z-[100] flex items-center gap-3 px-8 py-5 rounded-2xl shadow-2xl border backdrop-blur-xl",
              uploadStatus.type === 'success' ? "bg-emerald-600 text-white border-emerald-500" : "bg-red-600 text-white border-red-500"
            )}
          >
            {uploadStatus.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            <span className="text-xs font-black uppercase tracking-[0.2em]">{uploadStatus.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-lg">
                <Users size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Master Data</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 leading-tight uppercase tracking-tighter">Profil Santri</h2>
          <p className="text-slate-600 text-sm font-medium italic">Kelola identitas akademik dan status mukim dengan tingkat kontras tinggi.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
          {isSuperAdmin && (
            <>
              <button 
                onClick={() => setIsPromoteModalOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-amber-100 transition-all shadow-sm active:scale-95"
              >
                <ArrowRightLeft size={16} /> Mutasi / Naik Kelas
              </button>
              <button 
                onClick={() => {
                  const template = [
                    { 'Nama': 'Ahmad Fauzi', 'Kelas': '10 KUI', 'Nama Wali': 'Suryono', 'WhatsApp': '628123456789', 'JK': 'L', 'Status': 'Mondok' },
                    { 'Nama': 'Siti Aminah', 'Kelas': '11 KUI', 'Nama Wali': 'Lukman', 'WhatsApp': '628987654321', 'JK': 'P', 'Status': 'Ansor' }
                  ];
                  const ws = XLSX.utils.json_to_sheet(template);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
                  XLSX.writeFile(wb, "Template_Data_Siswa.xlsx");
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all shadow-sm active:scale-95"
              >
                <Download size={16} /> Template
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
              >
                <FileSpreadsheet size={16} /> Upload Excel
              </button>
            </>
          )}
          {canWrite && (
            <button 
              onClick={() => handleOpenModal()} 
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
            >
              <UserPlus size={16} /> Siswa Baru
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6 mx-1">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-900" size={20} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari berdasarkan nama atau kelas akademik..." className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-black text-slate-900 focus:bg-white focus:border-slate-800 focus:ring-0 transition-all outline-none" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-auto">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
              <Filter size={18} className="text-slate-900" />
            </div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="appearance-none pl-14 pr-12 py-5 bg-slate-50 rounded-[1.5rem] border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-900 focus:border-slate-800 outline-none cursor-pointer transition-all w-full min-w-[200px]"
            >
              <option value="Semua Kelas">Semua Kelas</option>
              {uniqueClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>
      </div>

      <StudentTable 
        students={filteredStudents}
        canWrite={canWrite}
        isSuperAdmin={isSuperAdmin}
        isAuditor={isAuditor}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        onPrintClearance={handlePrintClearance}
        onPrintCard={handlePrintCard}
      />

      <StudentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingStudent={editingStudent}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
      />

      <PdfPreviewModal
        previewPdf={previewPdf}
        title="Surat Izin Pulang"
        onClose={() => {
          if (previewPdf) URL.revokeObjectURL(previewPdf.url);
          setPreviewPdf(null);
        }}
        onDownload={handleDownloadPdf}
      />

      <AnimatePresence>
        {isPromoteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPromoteModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ArrowRightLeft size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Kenaikan / Mutasi Kelas</h3>
                <p className="text-slate-500 font-medium text-sm">Pindahkan seluruh santri dari satu kelas ke kelas lainnya secara massal.</p>
              </div>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-2">Dari Kelas (Awal)</label>
                  <select value={promoteOldClass} onChange={(e) => setPromoteOldClass(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-50 transition-all cursor-pointer">
                    <option value="" disabled>Pilih Kelas Awal...</option>
                    {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="flex justify-center -my-2 relative z-10">
                  <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-2">Menuju Kelas (Baru)</label>
                  <input type="text" value={promoteNewClass} onChange={(e) => setPromoteNewClass(e.target.value)} placeholder="Contoh: 2 KUI A" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-50 transition-all" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsPromoteModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Batal</button>
                <button onClick={handlePromoteClass} disabled={isPromoting || !promoteOldClass || !promoteNewClass} className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-amber-200 disabled:opacity-50 disabled:pointer-events-none">
                  {isPromoting ? 'Memproses...' : 'Terapkan Mutasi'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
