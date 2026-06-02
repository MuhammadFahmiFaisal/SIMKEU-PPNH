export interface Arrear {
  id: string;
  studentId: string;
  type: string;
  month: string;
  amount: number;
  status: 'Lunas' | 'Belum Lunas' | 'Kritis';
  dueDate: string;
}

export interface Student {
  id: string;
  name: string;
  class: string;
  parentName: string;
  whatsapp: string;
  totalArrears: number;
  gender: 'L' | 'P';
  residenceStatus: 'Mondok' | 'Ansor';
  dispensationStatus?: boolean;
  dispensationReason?: string;
  barcodeId?: string;
  statusPerizinan?: 'Di Dalam' | 'Di Luar' | 'Skorsing';
  nisn?: string;
  alamat?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  photoUrl?: string;
}

export interface Notification {
  id: string;
  studentId: string;
  studentName: string;
  parentName: string;
  whatsapp: string;
  date: string;
  status: 'Berhasil' | 'Gagal' | 'Pending';
  type: 'WhatsApp' | 'Email';
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Bendahara' | 'Auditor' | 'Keamanan';
  status: 'Active' | 'Locked';
  lastActive: string;
}

export interface Transaction {
  id: string;
  studentId?: string | null;
  studentName: string;
  type: 'Penambahan' | 'Pelunasan' | 'Penyesuaian' | 'Penghapusan' | 'Setoran' | 'Penerimaan' | 'Pengeluaran';
  amount: number;
  paymentCategory?: string;
  description: string;
  date: string;
  performedBy: string;
}

export interface StudentPermission {
  id: string;
  studentId: string;
  studentName?: string;
  studentClass?: string;
  type: 'Pulang' | 'Keluar Singkat' | 'Sakit' | 'Lainnya';
  reason: string;
  durationHours?: number;
  startDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string | null;
  status: 'Aktif' | 'Kembali' | 'Terlambat' | 'Dibatalkan';
  createdBy: string;
  createdByName?: string;
  notes?: string;
}

export type UserRole = 'Super Admin' | 'Bendahara' | 'Auditor' | 'Keamanan';
export type ResidenceStatus = 'Mondok' | 'Ansor';
export type TransactionType = 'Penambahan' | 'Pelunasan' | 'Penyesuaian' | 'Penghapusan' | 'Setoran' | 'Penerimaan' | 'Pengeluaran';
export type NotificationStatus = 'Berhasil' | 'Gagal' | 'Pending';
export type PermissionType = 'Pulang' | 'Keluar Singkat' | 'Sakit' | 'Lainnya';
export type PermissionStatus = 'Aktif' | 'Kembali' | 'Terlambat' | 'Dibatalkan';

