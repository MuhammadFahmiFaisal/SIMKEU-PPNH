import React from 'react';
import { Search } from 'lucide-react';

interface NotificationFiltersProps {
  activeTab: 'pending' | 'history';
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterClass: string;
  setFilterClass: (val: string) => void;
  filterResidence: string;
  setFilterResidence: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  sortBy: string;
  setSortBy: (val: any) => void;
  classes: string[];
}

export const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  activeTab,
  searchQuery,
  setSearchQuery,
  filterClass,
  setFilterClass,
  filterResidence,
  setFilterResidence,
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  classes
}) => {
  return (
    <div className="p-8 border-b border-slate-100 bg-slate-50/30">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari santri atau wali..." 
            className="w-full pl-16 pr-8 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 transition-all shadow-sm"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 lg:gap-6 w-full lg:w-auto mt-4 lg:mt-0">
          {activeTab === 'pending' ? (
            <>
              <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kelas:</span>
                <select 
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="w-[140px] sm:w-auto px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:border-blue-600 transition-all shadow-sm"
                >
                  <option value="Semua">Semua</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mukim:</span>
                <select 
                  value={filterResidence}
                  onChange={(e) => setFilterResidence(e.target.value)}
                  className="w-[140px] sm:w-auto px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:border-blue-600 transition-all shadow-sm"
                >
                  <option value="Semua">Semua</option>
                  <option value="Mondok">Mondok</option>
                  <option value="Ansor">Ansor</option>
                </select>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status WA:</span>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-[140px] sm:w-auto px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:border-blue-600 transition-all shadow-sm"
              >
                <option value="Semua">Semua</option>
                <option value="Berhasil">Berhasil</option>
                <option value="Gagal">Gagal</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Urutkan:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-[140px] sm:w-auto px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:border-blue-600 transition-all shadow-sm"
            >
              <option value="name">Nama (A-Z)</option>
              {activeTab === 'pending' ? (
                <>
                  <option value="class">Kelas</option>
                  <option value="amount_desc">Tagihan Terbesar</option>
                  <option value="amount_asc">Tagihan Terkecil</option>
                </>
              ) : (
                <>
                  <option value="date_desc">Terbaru</option>
                  <option value="date_asc">Terlama</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
