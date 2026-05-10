import React from 'react';
import { Search, Bell, HelpCircle, LogOut, Menu } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HeaderProps {
    onMenuToggle?: () => void;
    onNotificationClick?: () => void;
}

export function Header({ onMenuToggle, onNotificationClick }: HeaderProps) {
  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 md:h-20 border-b border-slate-200 bg-white/80 backdrop-blur-md z-50 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button 
            onClick={onMenuToggle}
            className="p-2.5 bg-white border border-slate-200 rounded-xl lg:hidden text-slate-900 shadow-sm transition-all active:scale-95"
        >
            <Menu size={20} />
        </button>

      </div>
      
      <div className="flex items-center gap-2 md:gap-5">
        <button 
          onClick={onNotificationClick}
          className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-xl hover:bg-slate-50 transition-all text-slate-400 relative border border-transparent hover:border-slate-100"
          title="Lihat Notifikasi"
        >
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden md:block"></div>
        
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl shadow-lg shadow-slate-200">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold text-[10px]">
            EP
          </div>
          <span className="text-xs font-bold text-white tracking-widest uppercase hidden md:inline">SIMKEU NH</span>
        </div>
      </div>
    </header>
  );
}
