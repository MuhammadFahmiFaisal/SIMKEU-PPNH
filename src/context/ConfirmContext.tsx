import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export type ConfirmType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmOptions {
  title: string;
  message: string;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolver) resolver(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolver) resolver(false);
  };

  const type = options?.type || 'warning';
  
  let Icon = AlertTriangle;
  let iconBg = 'bg-amber-100 text-amber-600';
  let confirmBtnBg = 'bg-amber-600 hover:bg-amber-700';
  let confirmBtnShadow = 'shadow-amber-600/20';

  if (type === 'danger') {
    iconBg = 'bg-red-100 text-red-600';
    confirmBtnBg = 'bg-red-600 hover:bg-red-700';
    confirmBtnShadow = 'shadow-red-600/20';
  } else if (type === 'info') {
    Icon = Info;
    iconBg = 'bg-blue-100 text-blue-600';
    confirmBtnBg = 'bg-blue-600 hover:bg-blue-700';
    confirmBtnShadow = 'shadow-blue-600/20';
  } else if (type === 'success') {
    Icon = CheckCircle2;
    iconBg = 'bg-emerald-100 text-emerald-600';
    confirmBtnBg = 'bg-emerald-600 hover:bg-emerald-700';
    confirmBtnShadow = 'shadow-emerald-600/20';
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {isOpen && options && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={handleCancel}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                <div className="flex gap-4 sm:gap-6">
                  <div className={cn("w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center shadow-inner", iconBg)}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 mt-1">
                    <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 tracking-tight">
                      {options.title}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">
                      {options.message}
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-5 sm:px-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all active:scale-95"
                >
                  {options.cancelText || 'Batal'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={cn(
                    "px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-xl active:scale-95",
                    confirmBtnBg,
                    confirmBtnShadow
                  )}
                >
                  {options.confirmText || 'Konfirmasi'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (context === undefined) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
