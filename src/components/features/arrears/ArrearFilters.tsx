import React from 'react';
import { Search } from 'lucide-react';

interface ArrearFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterClass: string;
  setFilterClass: (cls: string) => void;
  filterResidence: string;
  setFilterResidence: (res: string) => void;
  sortBy: string;
  setSortBy: (sort: 'highest' | 'lowest' | 'name') => void;
  classes: string[];
}

export const ArrearFilters: React.FC<ArrearFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  filterClass,
  setFilterClass,
  filterResidence,
  setFilterResidence,
  sortBy,
  setSortBy,
  classes
}) => {
  return (
    <div className="bg-white p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center gap-4 sm:gap-6 mx-4 sm:mx-1">
      <div className="relative flex-1 w-full lg:w-auto">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama siswa..." 
          className="w-full pl-14 sm:pl-16 pr-8 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-300 outline-none transition-all shadow-inner" 
        />
      </div>
      
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 w-full lg:w-auto">
        <div className="flex flex-col gap-1 w-full sm:w-auto">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelas</span>
          <select 
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase outline-none focus:border-slate-900"
          >
            <option value="Semua">Semua</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1 w-full sm:w-auto">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Mukim</span>
          <select 
            value={filterResidence}
            onChange={(e) => setFilterResidence(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase outline-none focus:border-slate-900"
          >
            <option value="Semua">Semua</option>
            <option value="Mondok">Mondok</option>
            <option value="Ansor">Ansor</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 col-span-2 sm:col-span-1 w-full sm:w-auto">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Urutkan</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase outline-none focus:border-slate-900"
          >
            <option value="highest">Tinggi ke Rendah</option>
            <option value="lowest">Rendah ke Tinggi</option>
            <option value="name">Nama (A-Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
