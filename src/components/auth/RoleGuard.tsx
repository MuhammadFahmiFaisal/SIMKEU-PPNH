import React, { ReactNode } from 'react';
import { useAuth, Role } from '../../context/AuthContext';
import { Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: Role[];
}

/**
 * RoleGuard Component
 * Enforces Role-Based Access Control (RBAC) in the UI.
 * Standardized according to ISO/IEC 25010 security model.
 */
export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user } = useAuth();

  const isAuthorized = user && allowedRoles.includes(user.role);

  if (!isAuthorized) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100 shadow-sm"
      >
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-red-100/50">
          <Lock size={48} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Otoritas Terbatas</h2>
        <p className="text-slate-500 mt-4 font-medium italic max-w-md leading-relaxed">
          Maaf, akun Anda ({user?.role}) tidak memiliki izin akses untuk modul ini. 
          Silakan hubungi Super Admin untuk penyesuaian hak akses.
        </p>
        <div className="mt-8 px-6 py-2 bg-slate-50 rounded-full border border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ISO/IEC 27001 Security Policy</span>
        </div>
      </motion.div>
    );
  }

  return <>{children}</>;
}
