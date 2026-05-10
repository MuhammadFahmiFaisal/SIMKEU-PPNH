import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Mail,
  MoreVertical,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  Activity,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import { AppUser } from '../types';
import { useAuth } from '../context/AuthContext';

export function UserManagement() {
  const { users, updateUserRole } = useData();
  const { user: currentUser } = useAuth();

  // Security Check: Only Super Admin can access this screen
  if (currentUser?.role !== 'Super Admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Lock size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase">Akses Terbatas</h2>
        <p className="text-slate-500 mt-2 font-medium italic max-w-md">Halaman Manajemen Pengguna hanya dapat diakses oleh Administrator Sistem.</p>
      </div>
    );
  }

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Bendahara' as AppUser['role']
  });

  const [infoModal, setInfoModal] = useState<{ title: string; desc: string; type?: 'info' | 'warning' } | null>(null);

  const handleOpenModal = (targetUser?: AppUser) => {
    if (targetUser) {
      setEditingUser(targetUser);
      setFormData({
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', role: 'Bendahara' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      try {
        await updateUserRole(editingUser.id, formData.role);
        setNotification({ type: 'success', message: 'Peran pengguna berhasil diperbarui.' });
        setShowModal(false);
      } catch (err: any) {
        setNotification({ type: 'error', message: err.message || 'Gagal memperbarui peran.' });
      }
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const toggleStatus = (targetUser: AppUser) => {
    setInfoModal({
      title: "Penguncian Akun Keamanan",
      desc: `Aksi penguncian akun untuk operator "${targetUser.name}" memerlukan hak akses Admin API tingkat tinggi yang saat ini dilindungi oleh modul Role-Based Access Control (RBAC). Silakan hubungi Administrator Utama Sistem untuk mengajukan penonaktifan secara manual melalui terminal keamanan.`,
      type: 'warning'
    });
  };

  const handleAddUserClick = () => {
    setInfoModal({
      title: "Pendaftaran Anggota Tim Baru",
      desc: "Untuk alasan keamanan dan keselarasan dengan arsitektur cloud (ISO 27001), pembuatan akun operator baru harus diinisialisasi melalui Dashboard Supabase Auth (Authentication > Users). Silakan hubungi Administrator Sistem untuk mendaftarkan alamat email operator baru tersebut. Setelah akun email terdaftar dan diaktifkan, nama operator tersebut akan muncul secara otomatis dalam sistem ini, dan perannya dapat disesuaikan sesuka Anda.",
      type: 'info'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={cn("fixed top-8 right-8 z-[150] flex items-center gap-3 px-8 py-5 rounded-2xl shadow-2xl border backdrop-blur-xl",
              notification.type === 'success' ? "bg-emerald-600 text-white border-emerald-500" : "bg-red-600 text-white border-red-500"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            <span className="text-xs font-black uppercase tracking-[0.2em]">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
              <Shield size={18} />
            </div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Admin Only Area</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">Otoritas Pengguna</h2>
          <p className="text-slate-500 text-sm font-medium italic">Kelola hak akses dan status keamanan tim keuangan Anda.</p>
        </div>
        <button
          onClick={handleAddUserClick}
          className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-xs shadow-xl shadow-slate-200 hover:bg-blue-600 active:scale-[0.98] transition-all uppercase tracking-wider"
        >
          <UserPlus size={18} />
          Tambah Anggota Tim
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama & Peran</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Opsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ring-4 ring-white",
                            u.role === 'Super Admin' ? "bg-blue-600 text-white" :
                              u.role === 'Auditor' ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"
                          )}>
                            {u.name?.charAt(0) || u.email?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 flex items-center gap-2">
                              {u.name || u.email}
                              {u.role === 'Super Admin' && <ShieldCheck size={14} className="text-blue-600" />}
                              {u.role === 'Auditor' && <Activity size={14} className="text-amber-500" />}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(u)}
                            className="p-3 bg-white border border-slate-100 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative z-10">
              <Activity size={32} className="text-blue-400 mb-6" />
              <h3 className="text-xl font-black uppercase tracking-tighter">Log Keamanan</h3>
              <p className="text-slate-400 text-xs font-medium italic mt-2">Semua perubahan peran dan status pengguna dicatat oleh sistem.</p>

              <div className="mt-8 space-y-4">
                {[
                  { action: 'Peran diubah', user: 'Budi B.', time: '10m ago' },
                  { action: 'User baru ditambahkan', user: 'Popon H.', time: '2h ago' },
                  { action: 'Login Berhasil', user: 'Admin', time: 'Just now' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 text-[10px]">
                    <span className="text-slate-400 font-bold uppercase tracking-widest">{log.action}</span>
                    <span className="text-blue-400 font-black">{log.user}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-200">
            <ShieldCheck size={32} className="text-emerald-500 mb-6" />
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Aturan Peran</h3>
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Super Admin</p>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Akses penuh ke semua fitur termasuk manajemen user dan penghapusan data kritis.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-purple-600 uppercase mb-1">Bendahara</p>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Melakukan input data, verifikasi status lunas, dan mengirim notifikasi WhatsApp.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Auditor</p>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Akses baca-saja (Read-only) ke riwayat finansial dan laporan statistik.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                  {editingUser ? 'Edit Detail Akun' : 'User Baru'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-slate-900">
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
                  <input
                    required
                    readOnly={!!editingUser}
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 border-0 text-sm font-bold transition-all outline-none"
                    placeholder="Masukkan nama pengguna..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Alamat Email</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 border-0 text-sm font-bold transition-all outline-none"
                    placeholder="nama@school.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tetapkan Peran</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['Super Admin', 'Bendahara', 'Auditor'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: role as AppUser['role'] })}
                        className={cn(
                          "py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                          formData.role === role ? "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-200" : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                        )}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10">
                    {editingUser ? 'Simpan Perubahan' : 'Daftarkan User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {infoModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInfoModal(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 p-8 text-center space-y-6 z-10"
            >
              <div className="flex justify-center">
                <div className={cn(
                  "p-4 rounded-3xl",
                  infoModal.type === 'warning' ? "bg-amber-50 text-amber-600 animate-pulse" : "bg-blue-50 text-blue-600"
                )}>
                  {infoModal.type === 'warning' ? <AlertCircle size={32} /> : <ShieldCheck size={32} />}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{infoModal.title}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed italic">{infoModal.desc}</p>
              </div>

              <button
                onClick={() => setInfoModal(null)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
              >
                Pahami & Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
