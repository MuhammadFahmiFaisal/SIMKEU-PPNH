import React from 'react';
import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown,
  Calendar,
  Wallet,
  Activity,
  History,
  CheckCircle2,
  BellRing,
  AlertCircle,
  X,
  Save,
  Plus,
  Trash2,
  Edit2,
  ArrowLeft,
  Bell
} from 'lucide-react';
import { StatsCard } from '../components/ui/StatsCard';
import { ArrearsChart } from '../components/features/dashboard/ArrearsChart';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export interface ReminderSchedule {
  id: string;
  active: boolean;
  name: string;
  type: 'Tagihan' | 'Tenggat' | 'Terakhir';
  dayOfMonth: string;
  time: string;
  category: string;
  autoBroadcast: boolean;
}

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { students, arrears, notifications, transactions } = useData();
  const { user } = useAuth();
  
  const [selectedYear, setSelectedYear] = React.useState(() => new Date().getFullYear());
  const [isReminderModalOpen, setIsReminderModalOpen] = React.useState(false);
  
  // State for multi-schedules
  const [reminderSchedules, setReminderSchedules] = React.useState<ReminderSchedule[]>(() => {
    const saved = localStorage.getItem('simkeu_reminder_schedules');
    return saved ? JSON.parse(saved) : [
      {
        id: 'sch-1',
        active: true,
        name: 'Pemberitahuan Tagihan Bulanan',
        type: 'Tagihan',
        dayOfMonth: '1',
        time: '08:00',
        category: 'Semua',
        autoBroadcast: true
      },
      {
        id: 'sch-2',
        active: true,
        name: 'Pemberitahuan Tenggat Pembayaran',
        type: 'Tenggat',
        dayOfMonth: '10',
        time: '12:00',
        category: 'Semua',
        autoBroadcast: true
      },
      {
        id: 'sch-3',
        active: true,
        name: 'Peringatan Terakhir (Kritis)',
        type: 'Terakhir',
        dayOfMonth: '20',
        time: '15:00',
        category: 'Semua',
        autoBroadcast: true
      }
    ];
  });

  const [isFormView, setIsFormView] = React.useState(false);
  const [currentEditingSchedule, setCurrentEditingSchedule] = React.useState<ReminderSchedule | null>(null);

  // Form states
  const [formName, setFormName] = React.useState('');
  const [formType, setFormType] = React.useState<'Tagihan' | 'Tenggat' | 'Terakhir'>('Tagihan');
  const [formDayOfMonth, setFormDayOfMonth] = React.useState('1');
  const [formTime, setFormTime] = React.useState('08:00');
  const [formCategory, setFormCategory] = React.useState('Semua');
  const [formAutoBroadcast, setFormAutoBroadcast] = React.useState(true);

  const [isSavingConfig, setIsSavingConfig] = React.useState(false);
  const [showConfigSuccess, setShowConfigSuccess] = React.useState(false);

  const availableYears = React.useMemo(() => {
    const years = arrears.map(a => {
      const parts = a.month.split(' ');
      return parts.length > 1 ? parseInt(parts[1], 10) : new Date().getFullYear();
    });
    const uniqueYears = (Array.from(new Set(years)) as number[]).filter(y => !isNaN(y)).sort((a, b) => b - a);
    return uniqueYears.length > 0 ? uniqueYears : [new Date().getFullYear()];
  }, [arrears]);

  const uniqueStudentsWithArrears = new Set(arrears.filter(a => a.status !== 'Lunas').map(a => a.studentId)).size;
  
  // Hitung jumlah siswa yang total tunggakannya >= 500,000 (Tunggakan Kritis)
  const arrearsPerStudent = arrears
    .filter(a => a.status !== 'Lunas')
    .reduce((acc, a) => {
      acc[a.studentId] = (acc[a.studentId] || 0) + a.amount;
      return acc;
    }, {} as Record<string, number>);
  const criticalCount = (Object.values(arrearsPerStudent) as number[]).filter(total => total >= 500000).length;

  const totalArrears = arrears.filter(a => a.status !== 'Lunas').reduce((sum, a) => sum + a.amount, 0);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const collectedThisMonth = transactions.filter(t => {
    if (t.type !== 'Pelunasan' && t.type !== 'Penyesuaian') return false;
    // Format date in transactions is usually localized, but assuming recent transactions
    // For a robust check, we parse the localized date string (e.g. DD/MM/YYYY)
    const dateParts = t.date.split(', ')[0].split('/');
    if (dateParts.length === 3) {
      const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
      const year = parseInt(dateParts[2], 10);
      return month === currentMonth && year === currentYear;
    }
    return true; // Fallback if format is unexpected
  }).reduce((sum, t) => sum + t.amount, 0);

  // Stats Data
  const stats = [
    { label: 'Total Tunggakan', value: `Rp ${totalArrears.toLocaleString()}`, icon: Wallet, trend: '+12.5%', trendType: 'up', color: 'blue' },
    { label: 'Siswa Menunggak', value: uniqueStudentsWithArrears.toString(), icon: Users, trend: '-2.4%', trendType: 'down', color: 'emerald' },
    { label: 'Tunggakan Kritis', value: criticalCount.toString(), icon: AlertTriangle, color: 'orange' },
    { label: 'Dana Terkumpul', value: `Rp ${collectedThisMonth.toLocaleString()}`, icon: CheckCircle2, trend: '+8.1%', trendType: 'up', color: 'purple' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight tracking-tight">
            Selamat Datang, <span className="text-blue-600">{user.name}</span>
          </h2>
          <p className="text-slate-500 text-sm font-medium italic">Monitor kesehatan finansial yayasan secara real-time.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
          <Calendar size={18} className="text-blue-600" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group relative bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden"
          >
            <div className={cn(
              "absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 group-hover:opacity-10 transition-opacity",
              stat.color === 'blue' ? "bg-blue-600" : stat.color === 'emerald' ? "bg-emerald-600" : stat.color === 'orange' ? "bg-orange-600" : "bg-purple-600"
            )} />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "p-4 rounded-2xl shadow-inner",
                  stat.color === 'blue' ? "bg-blue-50 text-blue-600" : stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" : stat.color === 'orange' ? "bg-orange-50 text-orange-600" : "bg-purple-50 text-purple-600"
                )}>
                  <stat.icon size={22} />
                </div>
                {stat.trend && (
                  <div className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase",
                    stat.trendType === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                  )}>
                    {stat.trendType === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.trend}
                  </div>
                )}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors uppercase">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Analitik Pembayaran</h3>
              <p className="text-xs text-slate-400 font-bold italic mt-1 uppercase tracking-widest">Perbandingan bulanan tahun {selectedYear}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {/* Year Selector Dropdown */}
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-700 outline-none transition-all cursor-pointer appearance-none pr-8"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>Tahun {year}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[8px]">▼</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-sm" />
                  <span className="text-[9px] font-black uppercase tracking-tighter text-slate-500">Tunggakan</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="w-2.5 h-2.5 bg-slate-200 rounded-sm" />
                  <span className="text-[9px] font-black uppercase tracking-tighter text-slate-500">Lunas</span>
                </div>
              </div>
            </div>
          </div>
          <div className="h-[340px]">
            <ArrearsChart selectedYear={selectedYear} />
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Notifikasi Terbaru</h3>
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl animate-pulse">
                <BellRing size={20} />
            </div>
          </div>
          
          <div className="space-y-6 flex-1">
            {notifications.slice(0, 5).map((notif, index) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                key={notif.id} 
                className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group"
              >
                <div className={cn(
                  "p-3 rounded-xl shadow-sm",
                  notif.status === 'Berhasil' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                )}>
                  {notif.status === 'Berhasil' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 truncate">WA: {notif.studentName}</p>
                    <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap ml-2 uppercase italic">{notif.date.split(' ')[0]}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-1 uppercase italic tracking-tighter truncate">Pesan dikirim ke {notif.parentName}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <button 
            onClick={() => onNavigate?.('notifications')}
            className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10"
          >
            Lihat Semua Aktivitas
          </button>
        </div>
      </div>

      {user?.role !== 'Auditor' && (
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 p-10 rounded-[4rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/5 rounded-full -ml-24 -mb-24 blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full mb-6">
                <Activity size={14} className="text-blue-400" />
                <span className="text-[9px] font-black text-blue-100 uppercase tracking-widest">Sistem Pintar SIMKEU NH</span>
              </div>
              <h3 className="text-3xl font-black text-white leading-tight uppercase tracking-tighter">Optimalkan Penagihan Anda Dengan <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Notifikasi WhatsApp</span></h3>
              <p className="text-blue-100/60 text-sm font-medium mt-4 leading-relaxed italic">
                "Kirim surat pemberitahuan digital yang profesional langsung ke genggaman orang tua murid hanya dengan satu klik."
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
              <button 
                onClick={() => onNavigate?.('notifications')}
                className="px-8 py-4 bg-white text-blue-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-blue-50 transition-all active:scale-95 shadow-2xl shadow-black/20 text-center"
              >
                Mulai Penagihan Massal
              </button>
              <button 
                onClick={() => setIsReminderModalOpen(true)}
                className="px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] transition-all active:scale-95 shadow-2xl shadow-blue-500/10 text-center"
              >
                Jadwal Pengingat
              </button>
              <button 
                onClick={() => onNavigate?.('settings')}
                className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-white/10 transition-all text-center"
              >
                Konfigurasi Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automated Reminder Scheduler Modal */}
      <AnimatePresence>
        {isReminderModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => {
                setIsReminderModalOpen(false);
                setIsFormView(false);
                setCurrentEditingSchedule(null);
              }} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                  {isFormView ? (
                    <button 
                      onClick={() => {
                        setIsFormView(false);
                        setCurrentEditingSchedule(null);
                      }}
                      className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl transition-all"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  ) : (
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <Clock size={24} />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase">
                      {isFormView ? (currentEditingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal') : 'Jadwal Pengingat'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 italic">
                      {isFormView ? 'Formulir Konfigurasi' : 'Konfigurasi Pengiriman Otomatis'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsReminderModalOpen(false);
                    setIsFormView(false);
                    setCurrentEditingSchedule(null);
                  }} 
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              
              {!isFormView ? (
                // LIST VIEW
                <div className="p-8 flex flex-col max-h-[65vh]">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Jadwal Penagihan ({reminderSchedules.length})</p>
                    <button
                      onClick={() => {
                        // Open empty form
                        setFormName('');
                        setFormType('Tagihan');
                        setFormDayOfMonth('1');
                        setFormTime('08:00');
                        setFormCategory('Semua');
                        setFormAutoBroadcast(true);
                        setCurrentEditingSchedule(null);
                        setIsFormView(true);
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all active:scale-95 shadow-lg"
                    >
                      <Plus size={14} /> Tambah Jadwal
                    </button>
                  </div>

                  <div className="space-y-4 overflow-y-auto flex-1 pr-1 -mr-2">
                    {reminderSchedules.length === 0 ? (
                      <div className="py-12 text-center space-y-3">
                        <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                          <Bell size={24} />
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Belum Ada Jadwal Aktif</p>
                      </div>
                    ) : (
                      reminderSchedules.map((schedule) => (
                        <div 
                          key={schedule.id}
                          className={cn(
                            "p-5 bg-slate-50 hover:bg-slate-100/70 border border-slate-150 rounded-2xl flex items-center justify-between gap-4 transition-all group",
                            !schedule.active && "opacity-60"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                              schedule.type === 'Tagihan' ? "bg-blue-50 text-blue-600" :
                              schedule.type === 'Tenggat' ? "bg-amber-50 text-amber-600" :
                              "bg-rose-50 text-rose-600"
                            )}>
                              {schedule.type === 'Tagihan' ? <Calendar size={18} /> :
                               schedule.type === 'Tenggat' ? <Clock size={18} /> :
                               <AlertCircle size={18} />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 line-clamp-1">{schedule.name}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                Setiap Tgl {schedule.dayOfMonth} • {schedule.time} WIB • {schedule.category}
                              </p>
                              <span className={cn(
                                "inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded mt-1.5",
                                schedule.type === 'Tagihan' ? "text-blue-700 bg-blue-100/60" :
                                schedule.type === 'Tenggat' ? "text-amber-700 bg-amber-100/60" :
                                "text-rose-700 bg-rose-100/60"
                              )}>
                                {schedule.type === 'Tagihan' ? 'Tagihan Baru' :
                                 schedule.type === 'Tenggat' ? 'Tenggat Pembayaran' :
                                 'Peringatan Terakhir'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                // Toggle active state and save
                                const updated = reminderSchedules.map(s => 
                                  s.id === schedule.id ? { ...s, active: !s.active } : s
                                );
                                setReminderSchedules(updated);
                                localStorage.setItem('simkeu_reminder_schedules', JSON.stringify(updated));
                              }}
                              className={cn(
                                "w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 focus:outline-none shrink-0",
                                schedule.active ? "bg-blue-600" : "bg-slate-200"
                              )}
                            >
                              <div 
                                className={cn(
                                  "w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300",
                                  schedule.active ? "translate-x-5" : "translate-x-0"
                                )}
                              />
                            </button>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  // Open form for edit
                                  setFormName(schedule.name);
                                  setFormType(schedule.type);
                                  setFormDayOfMonth(schedule.dayOfMonth);
                                  setFormTime(schedule.time);
                                  setFormCategory(schedule.category);
                                  setFormAutoBroadcast(schedule.autoBroadcast);
                                  setCurrentEditingSchedule(schedule);
                                  setIsFormView(true);
                                }}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                                title="Edit Jadwal"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Hapus jadwal "${schedule.name}"?`)) {
                                    const filtered = reminderSchedules.filter(s => s.id !== schedule.id);
                                    setReminderSchedules(filtered);
                                    localStorage.setItem('simkeu_reminder_schedules', JSON.stringify(filtered));
                                  }
                                }}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                                title="Hapus Jadwal"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-100 mt-6 flex justify-end">
                    <button 
                      type="button" 
                      onClick={() => setIsReminderModalOpen(false)}
                      className="px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              ) : (
                // FORM VIEW
                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Jadwal / Pemberitahuan</label>
                    <input 
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Contoh: Tagihan SPP Awal Bulan"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-slate-900 transition-all"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Jenis Pemberitahuan</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { type: 'Tagihan', label: 'Tagihan Baru', desc: 'Informasi tagihan awal bulan', color: 'border-blue-200 bg-blue-50/20 text-blue-600' },
                        { type: 'Tenggat', label: 'Tenggat Pembayaran', desc: 'Pengingat mendekati tenggat', color: 'border-amber-200 bg-amber-50/20 text-amber-600' },
                        { type: 'Terakhir', label: 'Peringatan Terakhir', desc: 'Teguran tegas penunggak', color: 'border-rose-200 bg-rose-50/20 text-rose-600' }
                      ].map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => {
                            setFormType(item.type as any);
                            if (!formName || formName.includes('Pemberitahuan')) {
                              setFormName(`Pemberitahuan ${item.label}`);
                            }
                          }}
                          className={cn(
                            "p-3.5 border rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all text-xs",
                            formType === item.type 
                              ? "border-slate-900 bg-slate-900 text-white font-bold shadow-lg scale-[1.02]" 
                              : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                          )}
                        >
                          <span className="font-bold text-[10px] uppercase tracking-wider">{item.label}</span>
                          <span className={cn(
                            "text-[8px] leading-snug opacity-85",
                            formType === item.type ? "text-slate-300" : "text-slate-400 font-medium"
                          )}>{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Frekuensi Kirim Bulanan</label>
                      <select 
                        value={formDayOfMonth}
                        onChange={(e) => setFormDayOfMonth(e.target.value)}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-slate-900 transition-all"
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day.toString()}>Setiap Tanggal {day}</option>
                        ))}
                        <option value="Monday">Setiap Hari Senin</option>
                        <option value="Friday">Setiap Hari Jumat</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Waktu Kirim (WIB)</label>
                      <input 
                        type="time"
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-slate-900 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kategori Filter Tagihan</label>
                    <select 
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-slate-900 transition-all"
                    >
                      <option value="Semua">Semua Kategori Pembayaran</option>
                      <option value="SPP">Hanya SPP</option>
                      <option value="Uang Makan">Hanya Uang Makan</option>
                    </select>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <input 
                      type="checkbox"
                      id="formAutoBroadcast"
                      checked={formAutoBroadcast}
                      onChange={(e) => setFormAutoBroadcast(e.target.checked)}
                      className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="formAutoBroadcast" className="text-[10px] text-slate-500 font-medium leading-relaxed cursor-pointer select-none">
                      Kirim langsung melalui server tanpa membuka tab WhatsApp web secara manual (memerlukan token gateway WA.team yang aktif).
                    </label>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsFormView(false);
                        setCurrentEditingSchedule(null);
                      }}
                      className="flex-1 py-4 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                    >
                      Batal
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        if (!formName.trim()) {
                          alert('Nama jadwal wajib diisi.');
                          return;
                        }

                        setIsSavingConfig(true);
                        setTimeout(() => {
                          setIsSavingConfig(false);
                          let updated: ReminderSchedule[];
                          if (currentEditingSchedule) {
                            // Update existing
                            updated = reminderSchedules.map(s => 
                              s.id === currentEditingSchedule.id ? {
                                ...s,
                                name: formName,
                                type: formType,
                                dayOfMonth: formDayOfMonth,
                                time: formTime,
                                category: formCategory,
                                autoBroadcast: formAutoBroadcast
                              } : s
                            );
                          } else {
                            // Create new
                            const newSchedule: ReminderSchedule = {
                              id: 'sch-' + Math.random().toString(36).substr(2, 9),
                              active: true,
                              name: formName,
                              type: formType,
                              dayOfMonth: formDayOfMonth,
                              time: formTime,
                              category: formCategory,
                              autoBroadcast: formAutoBroadcast
                            };
                            updated = [...reminderSchedules, newSchedule];
                          }

                          setReminderSchedules(updated);
                          localStorage.setItem('simkeu_reminder_schedules', JSON.stringify(updated));
                          
                          setShowConfigSuccess(true);
                          setIsFormView(false);
                          setCurrentEditingSchedule(null);
                          setTimeout(() => {
                            setShowConfigSuccess(false);
                          }, 1500);
                        }, 800);
                      }}
                      disabled={isSavingConfig}
                      className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                    >
                      {isSavingConfig ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Menyimpan...
                        </>
                      ) : 'Simpan Jadwal'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfigSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 right-8 z-[150] flex items-center gap-3 bg-emerald-600 text-white px-8 py-5 rounded-2xl shadow-2xl border border-emerald-500"
          >
            <CheckCircle2 size={18} />
            <span className="text-xs font-black uppercase tracking-[0.15em]">Jadwal Pengingat Berhasil Disimpan!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
