import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Student, Arrear, Notification, Transaction, AppUser, StudentPermission } from '../types';
import { databaseService } from '../services/database.service';
import { generateReceiptPDF } from '../lib/pdfGenerator';

interface DataContextType {
  students: Student[];
  arrears: Arrear[];
  notifications: Notification[];
  transactions: Transaction[];
  users: AppUser[];
  permissions: StudentPermission[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  addStudent: (student: Omit<Student, 'id' | 'totalArrears'>) => Promise<void>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  batchAddStudents: (students: Omit<Student, 'id' | 'totalArrears'>[]) => Promise<void>;
  addArrear: (arrear: Omit<Arrear, 'id' | 'status'>) => Promise<void>;
  updateArrear: (id: string, updates: Partial<Arrear>) => Promise<void>;
  deleteArrear: (id: string) => Promise<void>;
  batchAddArrears: (arrears: Omit<Arrear, 'id' | 'status'>[]) => Promise<void>;
  sendNotification: (studentId: string) => Promise<void>;
  sendBroadcastNotification: (studentIds: string[]) => Promise<void>;
  sendPaymentReceipt: (studentId: string, amount: number, paymentType: string, month: string) => Promise<void>;
  sendConsolidatedReceipt: (studentId: string, payments: { type: string, month: string, amount: number }[]) => Promise<void>;
  processPayment: (arrearId: string, paidAmount: number) => Promise<void>;
  updateUserRole: (userId: string, newRole: AppUser['role']) => Promise<void>;
  addDeposit: (amount: number, category: string, recipient: string, notes: string) => Promise<void>;
  previewReceiptPDF: (studentId: string, payments: { type: string, month: string, amount: number }[]) => Promise<void>;
  addPermission: (permission: Omit<StudentPermission, 'id' | 'startDate' | 'status'>) => Promise<StudentPermission>;
  checkInPermission: (permissionId: string, studentId: string, status: 'Kembali' | 'Terlambat', notes?: string) => Promise<void>;
  getStudentByBarcode: (barcodeId: string) => Promise<Student | null>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [arrears, setArrears] = useState<Arrear[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [permissions, setPermissions] = useState<StudentPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        studentsData,
        arrearsData,
        notificationsData,
        transactionsData,
        profilesData,
        permissionsData
      ] = await Promise.all([
        databaseService.getStudents(),
        databaseService.getArrears(),
        databaseService.getNotifications(),
        databaseService.getTransactions(),
        databaseService.getUsers(),
        databaseService.getPermissions()
      ]);

      setStudents(studentsData);
      setArrears(arrearsData);
      setNotifications(notificationsData);
      setTransactions(transactionsData);
      setUsers(profilesData);
      setPermissions(permissionsData);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data dari database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update totalArrears for students whenever arrears change
  useEffect(() => {
    setStudents(prev => prev.map(s => {
      const studentArrears = arrears.filter(a => a.studentId === s.id && a.status !== 'Lunas');
      return { ...s, totalArrears: studentArrears.reduce((sum, a) => sum + a.amount, 0) };
    }));
  }, [arrears]);

  const logAction = async (data: Omit<Transaction, 'id' | 'date'>) => {
    try {
      const res = await databaseService.logTransaction({
        ...data,
        performedBy: user?.name || 'Sistem'
      });
      if (res) {
        const newTx: Transaction = {
          id: res.id,
          studentId: res.student_id,
          studentName: res.student_name,
          type: res.type,
          amount: res.amount,
          paymentCategory: res.payment_category,
          description: res.description,
          date: new Date(res.created_at).toLocaleString('id-ID'),
          performedBy: res.performed_by || 'Sistem'
        };
        setTransactions(prev => [newTx, ...prev]);
      }
    } catch (err) {
      console.error('Failed to log transaction:', err);
      throw err;
    }
  };

  const addStudent = async (data: Omit<Student, 'id' | 'totalArrears'>) => {
    const res = await databaseService.addStudent(data);
    if (res) setStudents(prev => [...prev, { ...data, id: res.id, totalArrears: 0 }]);
  };

  const updateStudent = async (id: string, data: Partial<Student>) => {
    await databaseService.updateStudent(id, data);
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const deleteStudent = async (id: string) => {
    await databaseService.deleteStudent(id);
    setStudents(prev => prev.filter(s => s.id !== id));
    setArrears(prev => prev.filter(a => a.studentId !== id));
  };

  const batchAddStudents = async (newStudents: Omit<Student, 'id' | 'totalArrears'>[]) => {
    if (newStudents.length === 0) return;
    await databaseService.batchAddStudents(newStudents);
    await fetchData();
  };

  const addArrear = async (data: Omit<Arrear, 'id' | 'status'>) => {
    const res = await databaseService.addArrear(data);
    if (res) {
      setArrears(prev => [...prev, { ...data, id: res.id, status: 'Belum Lunas' }]);
      const s = students.find(x => x.id === data.studentId);
      await logAction({
        studentId: data.studentId,
        studentName: s?.name || 'Unknown',
        type: 'Penambahan',
        amount: data.amount,
        paymentCategory: data.type,
        description: `Tambah: ${data.type} (${data.month})`,
        performedBy: user?.name || 'Sistem'
      });
    }
  };

  const processPayment = async (id: string, paidAmount: number) => {
    const existing = arrears.find(a => a.id === id);
    if (!existing) return;

    const newAmount = Math.max(0, existing.amount - paidAmount);
    const isLunas = newAmount === 0;
    const updates: Partial<Arrear> = {
      amount: newAmount,
      status: isLunas ? 'Lunas' : existing.status
    };

    await databaseService.updateArrear(id, updates);
    setArrears(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));

    const s = students.find(x => x.id === existing.studentId);
    await logAction({
      studentId: existing.studentId,
      studentName: s?.name || 'Unknown',
      type: isLunas ? 'Pelunasan' : 'Penyesuaian',
      amount: paidAmount,
      paymentCategory: existing.type,
      description: `${isLunas ? 'Lunas' : 'Cicilan'}: ${existing.type} (${existing.month})`,
      performedBy: user?.name || 'Sistem'
    });
  };

  const updateArrear = async (id: string, data: Partial<Arrear>) => {
    await databaseService.updateArrear(id, data);
    setArrears(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  };

  const deleteArrear = async (id: string) => {
    const existing = arrears.find(a => a.id === id);
    await databaseService.deleteArrear(id);
    if (existing) {
      const s = students.find(x => x.id === existing.studentId);
      await logAction({
        studentId: existing.studentId,
        studentName: s?.name || 'Unknown',
        type: 'Penghapusan',
        amount: -existing.amount,
        paymentCategory: existing.type,
        description: `Hapus: ${existing.type} (${existing.month})`,
        performedBy: user?.name || 'Sistem'
      });
      setArrears(prev => prev.filter(a => a.id !== id));
    }
  };

  const batchAddArrears = async (newArrears: Omit<Arrear, 'id' | 'status'>[]) => {
    if (newArrears.length === 0) return;

    // Simpan ke database
    await databaseService.batchAddArrears(newArrears);

    // Refresh data agar state sinkron dengan database
    await fetchData();

    await logAction({
      studentId: null,
      studentName: 'Sistem (Massal)',
      type: 'Penambahan',
      amount: newArrears.reduce((sum, a) => sum + a.amount, 0),
      paymentCategory: newArrears[0]?.type || '',
      description: `Penambahan tagihan massal ${newArrears[0]?.type || ''} untuk ${newArrears.length} siswa`,
      performedBy: user?.name || 'Sistem'
    });
  };

  const sendNotification = async (studentId: string) => {
    const s = students.find(x => x.id === studentId);
    if (!s) return;

    // 1. Dapatkan tagihan yang belum lunas
    const studentArrears = arrears.filter(a => a.studentId === studentId && a.status !== 'Lunas');
    const totalAmount = studentArrears.reduce((sum, a) => sum + a.amount, 0);

    // Format rincian
    const details = studentArrears.map(a => `- ${a.type} (${a.month}): Rp ${a.amount.toLocaleString('id-ID')}`).join('\n');

    // 2. Format nomor HP (Ubah awalan 0 menjadi 62)
    let phone = s.whatsapp.replace(/\D/g, '');
    const isPhoneValid = phone.length >= 9 && phone.length <= 15 && (phone.startsWith('08') || phone.startsWith('62') || phone.startsWith('8') || phone.startsWith('02') || phone.startsWith('03'));

    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }

    // 3. Buat template pesan WhatsApp
    const message = `*SURAT TAGIHAN RESMI*\n*SIMKEU Nurul Huda*\n\nKepada Yth.\nBapak/Ibu Wali dari *${s.name}*\nKelas: ${s.class}\n\nAssalamu'alaikum wr. wb.\n\nMelalui pesan ini, kami ingin menginformasikan bahwa terdapat rincian tagihan administrasi yang belum diselesaikan sebagai berikut:\n\n${details}\n\n*Total Tagihan: Rp ${totalAmount.toLocaleString('id-ID')}*\n\nMohon kerjasamanya untuk segera melakukan penyelesaian pembayaran tersebut. Apabila Anda sudah melakukan pembayaran, mohon abaikan pesan ini.\n\nAtas perhatian dan kerjasamanya, kami ucapkan terima kasih.\n\nWassalamu'alaikum wr. wb.`;

    const finalStatus = isPhoneValid ? 'Berhasil' : 'Gagal';

    // 4. Log to database
    try {
      const res = await databaseService.logNotification({
        studentId: s.id,
        studentName: s.name,
        parentName: s.parentName,
        whatsapp: s.whatsapp,
        status: finalStatus
      });
      if (res) {
        const newNotif: Notification = {
          id: res.id,
          studentId: res.student_id,
          studentName: res.student_name,
          parentName: res.parent_name,
          whatsapp: res.whatsapp,
          status: res.status as 'Berhasil' | 'Gagal' | 'Pending',
          type: res.type || 'WhatsApp',
          date: new Date(res.created_at).toLocaleString('id-ID')
        };
        setNotifications(prev => [newNotif, ...prev]);
      }
    } catch (err) {
      console.error('Gagal menyimpan log notifikasi:', err);
    }

    // 5. Generate Link WhatsApp dan buka di tab baru jika nomor valid
    if (isPhoneValid) {
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
    } else {
      console.warn(`Nomor WhatsApp tidak valid: ${s.whatsapp}`);
    }
  };

  const sendBroadcastNotification = async (studentIds: string[]) => {
    if (studentIds.length === 0) return;

    // We will batch log notifications to the database history in order
    for (const studentId of studentIds) {
      const s = students.find(x => x.id === studentId);
      if (!s) continue;

      const phone = s.whatsapp.replace(/\D/g, '');
      const isPhoneValid = phone.length >= 9 && phone.length <= 15 && (phone.startsWith('08') || phone.startsWith('62') || phone.startsWith('8') || phone.startsWith('02') || phone.startsWith('03'));
      const finalStatus = isPhoneValid ? 'Berhasil' : 'Gagal';

      try {
        const res = await databaseService.logNotification({
          studentId: s.id,
          studentName: s.name,
          parentName: s.parentName,
          whatsapp: s.whatsapp,
          status: finalStatus
        });
        if (res) {
          const newNotif: Notification = {
            id: res.id,
            studentId: res.student_id,
            studentName: res.student_name,
            parentName: res.parent_name,
            whatsapp: res.whatsapp,
            status: res.status as 'Berhasil' | 'Gagal' | 'Pending',
            type: res.type || 'WhatsApp',
            date: new Date(res.created_at).toLocaleString('id-ID')
          };
          setNotifications(prev => [newNotif, ...prev]);
        }
      } catch (err) {
        console.error('Gagal merekam log siaran massal:', err);
      }
    }
  };

  const sendPaymentReceipt = async (studentId: string, amount: number, paymentType: string, month: string) => {
    const s = students.find(x => x.id === studentId);
    if (!s) return;

    // 1. Format nomor HP (Ubah awalan 0 menjadi 62)
    let phone = s.whatsapp.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }

    // 2. Format Waktu
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const dateString = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    // 3. Buat template pesan WhatsApp (Struk Teks)
    const message = `*BUKTI PEMBAYARAN RESMI*
*SIMKEU Nurul Huda*

Kami mengonfirmasi bahwa pembayaran telah diterima dengan rincian sebagai berikut:

Nama Siswa: *${s.name}*
Kelas: *${s.class}*
Jenis Pembayaran: ${paymentType} (${month})
*Nominal: Rp ${amount.toLocaleString('id-ID')}*
Tanggal: ${dateString} (${timeString})
Petugas: ${user?.name || 'Bendahara'}

_Keterangan:_
_Pesan ini merupakan bukti pembayaran digital yang sah. Harap simpan pesan ini sebagai dokumen arsip Anda._

Atas perhatiannya kami ucapkan terima kasih.
Wassalamu'alaikum wr. wb.`;

    // 4. Generate Link WhatsApp dan buka di tab baru
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const sendConsolidatedReceipt = async (studentId: string, payments: { type: string, month: string, amount: number }[]) => {
    const s = students.find(x => x.id === studentId);
    if (!s || payments.length === 0) return;

    // 1. Format nomor HP (Ubah awalan 0 menjadi 62)
    let phone = s.whatsapp.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }

    // 2. Format Waktu
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const dateString = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    // 3. Format Rincian Pembayaran
    const detailsList = payments.map(p => `- ${p.type} (${p.month}): Rp ${p.amount.toLocaleString('id-ID')}`).join('\n');
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    // 4. Buat template pesan WhatsApp (Struk Teks Konsolidasi)
    const message = `*BUKTI PEMBAYARAN RESMI*
*SIMKEU Nurul Huda*

Kami mengonfirmasi bahwa pembayaran telah diterima dengan rincian sebagai berikut:

Nama Siswa: *${s.name}*
Kelas: *${s.class}*

*Rincian Pembayaran:*
${detailsList}

*Total Dibayar: Rp ${totalPaid.toLocaleString('id-ID')}*
Tanggal: ${dateString} (${timeString})
Petugas: ${user?.name || 'Bendahara'}

_Keterangan:_
_Pesan ini merupakan bukti pembayaran digital yang sah. Harap simpan pesan ini sebagai dokumen arsip Anda._

Atas perhatiannya kami ucapkan terima kasih.
Wassalamu'alaikum wr. wb.`;

    // 5. Generate Link WhatsApp dan buka di tab baru
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const updateUserRole = async (userId: string, newRole: AppUser['role']) => {
    await databaseService.updateUserRole(userId, newRole);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const addDeposit = async (amount: number, category: string, recipient: string, notes: string) => {
    await logAction({
      studentId: null,
      studentName: 'Sistem (Setoran)',
      type: 'Setoran',
      amount: amount,
      paymentCategory: category,
      description: `Setor ke ${recipient}: ${notes}`,
      performedBy: user?.name || 'Sistem'
    });
  };

  const previewReceiptPDF = async (studentId: string, payments: { type: string, month: string, amount: number }[]) => {
    const s = students.find(x => x.id === studentId);
    if (!s || payments.length === 0) return;

    try {
      const blob = await generateReceiptPDF(s, payments, user?.name || 'Bendahara');

      // Menggunakan File object agar browser mendapatkan petunjuk nama file
      const fileName = `Struk_${s.name.replace(/\s+/g, '_')}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });
      const url = URL.createObjectURL(file);

      const newWindow = window.open(url, '_blank');

      if (newWindow) {
        // Berikan waktu sedikit agar tab terbuka sebelum mengubah judul
        setTimeout(() => {
          try {
            newWindow.document.title = fileName;
          } catch (e) {
            // Abaikan jika cross-origin policy menghalangi (biasanya terjadi di blob url)
          }
        }, 500);
      } else {
        // Fallback: download langsung jika popup diblokir!
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
      }
    } catch (err) {
      console.error('PDF Preview Error:', err);
    }
  };

  const addPermission = async (data: Omit<StudentPermission, 'id' | 'startDate' | 'status'>) => {
    try {
      const newPermission = await databaseService.addPermission(data);
      setPermissions(prev => [newPermission, ...prev]);
      
      // Update local state
      setStudents(prev => prev.map(s => s.id === data.studentId ? { ...s, statusPerizinan: 'Di Luar' } : s));
      
      return newPermission;
    } catch (err: any) {
      console.error('Failed to add permission:', err);
      throw err;
    }
  };

  const checkInPermission = async (permissionId: string, studentId: string, status: 'Kembali' | 'Terlambat', notes?: string) => {
    try {
      await databaseService.checkInPermission(permissionId, studentId, status, notes);
      
      // Update state locally
      setPermissions(prev => prev.map(p => p.id === permissionId ? { 
        ...p, 
        status, 
        actualReturnDate: new Date().toISOString(),
        notes: notes || p.notes
      } : p));
      
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, statusPerizinan: 'Di Dalam' } : s));
    } catch (err: any) {
      console.error('Failed to check in permission:', err);
      throw err;
    }
  };

  const getStudentByBarcode = async (barcodeId: string) => {
    try {
      return await databaseService.getStudentByBarcode(barcodeId);
    } catch (err: any) {
      console.error('Failed to query student by barcode:', err);
      throw err;
    }
  };


  return (
    <DataContext.Provider value={{
      students,
      arrears,
      transactions,
      notifications,
      users,
      permissions,
      loading,
      error,
      refreshData: fetchData,
      addStudent,
      updateStudent,
      deleteStudent,
      batchAddStudents,
      addArrear,
      updateArrear,
      deleteArrear,
      batchAddArrears,
      sendNotification,
      sendBroadcastNotification,
      sendPaymentReceipt,
      sendConsolidatedReceipt,
      updateUserRole,
      processPayment,
      addDeposit,
      previewReceiptPDF,
      addPermission,
      checkInPermission,
      getStudentByBarcode
    }}>
      {error ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-lg w-full space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Koneksi Database Gagal</h2>
            <p className="text-slate-500 text-sm">{error}</p>
            <button onClick={() => fetchData()} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all">Coba Lagi</button>
          </div>
        </div>
      ) : !loading ? children : (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sinkronisasi Cloud...</p>
          </div>
        </div>
      )}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};
