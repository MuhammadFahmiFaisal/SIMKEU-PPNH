import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Bell,
  Settings,
  LogOut,
  GraduationCap,
  Shield,
  Briefcase,
  ChevronDown,
  X,
  History,
  FileSpreadsheet,
  QrCode,
  UserCheck
} from 'lucide-react';
import { useAuth, Role } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ activeTab, setActiveTab, isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  // App mode selection for Super Admins to segregate complex features
  const [appMode, setAppMode] = useState<'finance' | 'permission'>(() => {
    const saved = localStorage.getItem('appMode');
    if (saved === 'permission' || saved === 'finance') return saved;
    return user?.role === 'Keamanan' ? 'permission' : 'finance';
  });

  const handleModeChange = (mode: 'finance' | 'permission') => {
    setAppMode(mode);
    localStorage.setItem('appMode', mode);
    if (mode === 'finance') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('scan');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dasbor', icon: LayoutDashboard, roles: ['Super Admin', 'Bendahara', 'Auditor'], domain: 'finance' },
    { id: 'scan', label: 'Portal Scan Izin', icon: QrCode, roles: ['Super Admin', 'Keamanan'], domain: 'permission' },
    { id: 'permissions', label: 'Log Perizinan', icon: UserCheck, roles: ['Super Admin', 'Keamanan'], domain: 'permission' },
    { id: 'students', label: 'Manajemen Siswa', icon: Users, roles: ['Super Admin', 'Bendahara', 'Auditor'], domain: 'finance' },
    { id: 'arrears', label: 'Manajemen Tunggakan', icon: Wallet, roles: ['Super Admin', 'Bendahara', 'Auditor'], domain: 'finance' },
    { id: 'history', label: 'Riwayat Finansial', icon: History, roles: ['Super Admin', 'Auditor', 'Bendahara'], domain: 'finance' },
    { id: 'reports', label: 'Laporan Rekap', icon: FileSpreadsheet, roles: ['Super Admin', 'Bendahara', 'Auditor'], domain: 'both' },
    { id: 'notifications', label: 'Notifikasi', icon: Bell, roles: ['Super Admin', 'Bendahara', 'Auditor'], domain: 'finance' },
    { id: 'users', label: 'Manajemen Pengguna', icon: Settings, roles: ['Super Admin'], domain: 'both' },
    { id: 'settings', label: 'Pengaturan Sistem', icon: Shield, roles: ['Super Admin'], domain: 'both' },
  ].filter(item => {
    const hasRole = item.roles.includes(user?.role || '');
    if (!hasRole) return false;

    // Keamanan is strictly bound to permission flow
    if (user?.role === 'Keamanan') {
      return item.domain === 'permission' || item.domain === 'both';
    }

    // Super Admin can toggle between domains
    if (user?.role === 'Super Admin') {
      return item.domain === 'both' || item.domain === appMode;
    }

    // Others (Bendahara, Auditor) can only see finance
    return item.domain === 'finance' || item.domain === 'both';
  });

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed left-0 top-0 h-screen w-64 border-r border-slate-200 bg-white shadow-sm flex flex-col py-6 z-[60] transition-transform duration-300 transform lg:translate-x-0 overflow-y-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="px-6 mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center p-1 overflow-hidden shadow-lg shadow-slate-200">
              <img
                src="https://res.cloudinary.com/dnnuqxs7g/image/upload/v1765536057/logo355_deq4dd.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none tracking-tight">SIMKEU NH</h1>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Portal Admin</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-slate-900 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* App Domain Switcher for Super Admin */}
        {user?.role === 'Super Admin' && (
          <div className="px-4 mb-4">
            <div className="bg-slate-50 p-1 rounded-2xl border border-slate-150 flex gap-1 bg-slate-100/50">
              <button
                onClick={() => handleModeChange('finance')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer",
                  appMode === 'finance'
                    ? "bg-slate-900 text-white shadow-sm shadow-slate-950/20"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                )}
              >
                <Wallet size={12} />
                Keuangan
              </button>
              <button
                onClick={() => handleModeChange('permission')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer",
                  appMode === 'permission'
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-700/20"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                )}
              >
                <Shield size={12} />
                Perizinan
              </button>
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-semibold tracking-wide",
                  isActive
                    ? "text-slate-900 bg-slate-100 shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-colors",
                  isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 group-hover:text-slate-600"
                )}>
                  <Icon size={18} />
                </div>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 mt-auto pt-6 border-t border-slate-100">
          <div className="relative mb-4">
            <div className="w-full bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 text-white shadow-sm",
                user?.role === 'Super Admin' ? "bg-slate-900" : "bg-slate-700"
              )}>
                {user?.initial}
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-sm font-bold truncate text-slate-900 tracking-tight">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate font-semibold uppercase tracking-wider mt-0.5">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-5 py-3 text-[10px] font-black text-slate-400 hover:text-red-600 transition-colors uppercase tracking-[0.2em]"
          >
            <LogOut size={16} />
            Keluar Sistem
          </button>
        </div>
      </aside>
    </>
  );
}
