import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
import { printPermissionGatePass } from '../lib/pdfGenerator';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  QrCode, Play, AlertCircle, Volume2, VolumeX, ShieldAlert, 
  Search, CheckCircle2, XCircle, Clock, FileText, Calendar, 
  User, Check, AlertTriangle, MessageSquare, ShieldCheck, Camera
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Student, StudentPermission } from '../types';

export function PermissionScanner() {
  const { students, arrears, permissions, addPermission, checkInPermission } = useData();
  const { user } = useAuth();

  // Audio settings
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Scan input states
  const [scanInput, setScanInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentScans, setRecentScans] = useState<{
    id: string;
    studentName: string;
    studentClass: string;
    status: 'success' | 'warning' | 'error';
    type: 'Check-In' | 'Check-Out';
    time: string;
    message: string;
  }[]>([]);

  // Modals / Flow states
  const [scannedStudent, setScannedStudent] = useState<Student | null>(null);
  const [activePermission, setActivePermission] = useState<StudentPermission | null>(null);
  const [activeArrears, setActiveArrears] = useState<any[]>([]);
  
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [justCreatedPermission, setJustCreatedPermission] = useState<StudentPermission | null>(null);

  // Camera scanner states
  const [cameraActive, setCameraActive] = useState(false);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // Form Fields for Check-Out
  const [permitType, setPermitType] = useState<'Pulang' | 'Keluar Singkat' | 'Sakit' | 'Lainnya'>('Keluar Singkat');
  const [permitReason, setPermitReason] = useState('');
  const [permitDurationHours, setPermitDurationHours] = useState('2');
  const [permitDurationDays, setPermitDurationDays] = useState('3');
  const [permitNotes, setPermitNotes] = useState('');

  // Form Fields for Check-In
  const [checkInNotes, setCheckInNotes] = useState('');

  // Refs for auto-focus input
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus logic for USB scanners
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };
    
    focusInput();
    // Re-focus on page clicks to prevent losing keyboard input
    document.addEventListener('click', focusInput);
    return () => document.removeEventListener('click', focusInput);
  }, []);

  // HTML5 Camera QR Code Scanner lifecycle controller
  useEffect(() => {
    if (cameraActive) {
      const html5QrCode = new Html5Qrcode("reader");
      qrScannerRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: "environment" }, // back camera on mobile!
        {
          fps: 12,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.75;
            return { width: size, height: size };
          }
        },
        (decodedText) => {
          // Decode printed pass or raw ID
          let finalCode = decodedText;
          if (decodedText.includes('|')) {
            const parts = decodedText.split('|');
            if (parts.length > 2) {
              // Extract student name or permission ID
              const nameSegment = parts[2].replace(/_/g, ' ');
              finalCode = nameSegment;
            }
          }
          
          processScanCode(finalCode);
          setCameraActive(false);
        },
        () => {
          // Ignore scanning feedback noise
        }
      ).catch(err => {
        console.error("Camera start error:", err);
        setCameraActive(false);
        alert("Gagal mengaktifkan kamera. Pastikan Anda telah memberikan izin akses kamera pada peramban (browser) HP Anda.");
      });
    } else {
      if (qrScannerRef.current && qrScannerRef.current.isScanning) {
        qrScannerRef.current.stop().then(() => {
          qrScannerRef.current = null;
        }).catch(err => console.error("Scanner stop fail:", err));
      }
    }

    return () => {
      if (qrScannerRef.current && qrScannerRef.current.isScanning) {
        qrScannerRef.current.stop().then(() => {
          qrScannerRef.current = null;
        }).catch(err => console.error("Scanner cleanup fail:", err));
      }
    };
  }, [cameraActive]);

  // Web Audio API Synthesizer
  const playFeedbackSound = (type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (type === 'success') {
        // asc chime
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(783.99, now + 0.12); // G5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'warning') {
        // double alert beep
        const now = ctx.currentTime;
        [0, 0.15].forEach(delay => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(880, now + delay); // A5
          gain.gain.setValueAtTime(0.08, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.1);
          osc.start(now + delay);
          osc.stop(now + delay + 0.1);
        });
      } else if (type === 'error') {
        // harsh reject buzzer
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(130, now); // low buzz
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch (e) {
      console.error('Audio synthesizer error:', e);
    }
  };

  // Process manual entry or scanner enter
  const handleScanSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scanInput.trim()) return;

    processScanCode(scanInput.trim());
    setScanInput('');
  };

  // Main scan decision core engine
  const processScanCode = (code: string) => {
    setIsProcessing(true);

    // 1. Find student by Barcode ID or fall back to finding by UUID/Name
    const student = students.find(s => 
      s.barcodeId?.toUpperCase() === code.toUpperCase() || 
      s.id.toLowerCase() === code.toLowerCase() ||
      s.name.toUpperCase().includes(code.toUpperCase())
    );

    if (!student) {
      playFeedbackSound('error');
      addRecentLog({
        id: Math.random().toString(),
        studentName: code,
        studentClass: 'Tidak Terdaftar',
        status: 'error',
        type: 'Check-Out',
        time: new Date().toLocaleTimeString('id-ID'),
        message: 'Kode kartu tidak dikenali oleh sistem.'
      });
      setIsProcessing(false);
      return;
    }

    setScannedStudent(student);

    // 2. Fetch arrears (unpaid bills)
    const studentArrears = arrears.filter(a => a.studentId === student.id && a.status !== 'Lunas');
    setActiveArrears(studentArrears);

    // 3. Check Location Status (Check-In or Check-Out?)
    if (student.statusPerizinan === 'Di Luar') {
      // FLOW: CHECK-IN (Returning back to Pesantren)
      const activePerm = permissions.find(p => p.studentId === student.id && p.status === 'Aktif');
      setActivePermission(activePerm || null);
      
      playFeedbackSound('success');
      setShowCheckinModal(true);
    } else if (student.statusPerizinan === 'Skorsing') {
      // FLOW: DISCIPLINARY LOCK
      playFeedbackSound('error');
      addRecentLog({
        id: student.id,
        studentName: student.name,
        studentClass: student.class,
        status: 'error',
        type: 'Check-Out',
        time: new Date().toLocaleTimeString('id-ID'),
        message: 'Izin Ditolak! Santri sedang dalam masa skorsing pelanggaran.'
      });
      setShowBlockedModal(true);
    } else {
      // FLOW: CHECK-OUT (Requesting to leave)
      
      // Determine financial restriction
      const hasUnpaidBills = studentArrears.length > 0;
      const isBypassed = student.dispensationStatus === true;

      if (hasUnpaidBills && !isBypassed) {
        // BLOCKED: Arrears present, no bypass
        playFeedbackSound('warning');
        setShowBlockedModal(true);
      } else {
        // ALLOWED: Free or dispensation active
        playFeedbackSound('success');
        
        // Reset checkout form fields
        setPermitType('Keluar Singkat');
        setPermitReason('');
        setPermitDurationHours('2');
        setPermitDurationDays('3');
        setPermitNotes('');
        
        setShowCheckoutModal(true);
      }
    }

    setIsProcessing(false);
  };

  // Helper log stack
  const addRecentLog = (log: typeof recentScans[number]) => {
    setRecentScans(prev => [log, ...prev].slice(0, 5));
  };

  // Submit check-out permission creation
  const handleCheckoutSubmit = async () => {
    if (!scannedStudent) return;

    // Calculate expected return time
    const expected = new Date();
    if (permitType === 'Keluar Singkat') {
      const hours = parseInt(permitDurationHours) || 2;
      expected.setHours(expected.getHours() + hours);
    } else {
      const days = parseInt(permitDurationDays) || 3;
      expected.setDate(expected.getDate() + days);
    }

    try {
      const newPerm = await addPermission({
        studentId: scannedStudent.id,
        type: permitType,
        reason: permitReason || `Izin ${permitType}`,
        durationHours: permitType === 'Keluar Singkat' ? parseInt(permitDurationHours) : undefined,
        expectedReturnDate: expected.toISOString(),
        createdBy: user?.id || '',
        notes: permitNotes
      });

      addRecentLog({
        id: scannedStudent.id,
        studentName: scannedStudent.name,
        studentClass: scannedStudent.class,
        status: 'success',
        type: 'Check-Out',
        time: new Date().toLocaleTimeString('id-ID'),
        message: `Check-out berhasil (${permitType}). Kembali s/d ${expected.toLocaleString('id-ID')}`
      });

      // Show success modal with printing slip option
      setJustCreatedPermission(newPerm || {
        id: Math.random().toString(),
        studentId: scannedStudent.id,
        studentName: scannedStudent.name,
        studentClass: scannedStudent.class,
        type: permitType,
        reason: permitReason || `Izin ${permitType}`,
        durationHours: permitType === 'Keluar Singkat' ? parseInt(permitDurationHours) : undefined,
        startDate: new Date().toISOString(),
        expectedReturnDate: expected.toISOString(),
        status: 'Aktif',
        createdBy: user?.id || '',
        notes: permitNotes
      });
      setShowCheckoutModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit check-in permission settlement
  const handleCheckinSubmit = async () => {
    if (!scannedStudent || !activePermission) return;

    // Determine status (Late or Back)
    const expected = new Date(activePermission.expectedReturnDate);
    const now = new Date();
    const isLate = now > expected;
    const finalStatus = isLate ? 'Terlambat' : 'Kembali';

    try {
      await checkInPermission(
        activePermission.id,
        scannedStudent.id,
        finalStatus,
        checkInNotes
      );

      addRecentLog({
        id: scannedStudent.id,
        studentName: scannedStudent.name,
        studentClass: scannedStudent.class,
        status: isLate ? 'warning' : 'success',
        type: 'Check-In',
        time: now.toLocaleTimeString('id-ID'),
        message: isLate 
          ? `Kembali TERLAMBAT! Rencana: ${expected.toLocaleTimeString('id-ID')} (${checkInNotes || 'Tanpa keterangan'})` 
          : `Kembali tepat waktu. Selamat datang kembali.`
      });

      setShowCheckinModal(false);
      setScannedStudent(null);
      setActivePermission(null);
      setCheckInNotes('');
    } catch (err) {
      console.error(err);
    }
  };

  // Mock scan trigger (Quick-select for testing)
  const triggerMockScan = (student: Student) => {
    processScanCode(student.barcodeId || student.id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8 pb-10"
    >
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200">
              <QrCode size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              Perizinan Module
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tighter uppercase">
            Portal Scan Izin
          </h2>
          <p className="text-slate-500 font-medium italic text-sm">
            Gunakan scanner USB genggam, webcam, atau pencarian santri di bawah ini.
          </p>
        </div>

        {/* Audio feedback switches */}
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl border font-bold text-xs transition-all uppercase tracking-widest",
            soundEnabled 
              ? "bg-slate-950 text-white border-slate-950 shadow-md" 
              : "bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-900"
          )}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          Audio Feedback: {soundEnabled ? "AKTIF" : "SENYAP"}
        </button>
      </div>

      {/* Hidden Focus Input for hardware USB Scanners */}
      <form onSubmit={handleScanSubmit} className="opacity-0 absolute -top-40">
        <input
          ref={inputRef}
          type="text"
          value={scanInput}
          onChange={e => setScanInput(e.target.value)}
          placeholder="Hardware scanner input target"
          className="w-10 text-xs"
        />
      </form>

      {/* Main Grid: Live Scanner Simulation & Quick testing panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Section: Live Scanner Mock Screen (col-span-8) */}
        <div className="lg:col-span-8 bg-slate-900 text-white p-8 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[520px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#1e293b,transparent)] opacity-80" />
          
          {/* Header element inside scan screen */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scanner Online & Terfokus</span>
            </div>
            <div className="text-[10px] font-bold text-slate-500 italic">
              Klik di mana saja pada layar ini jika ketikan scanner terputus
            </div>
          </div>

          {/* Large Scanner Frame */}
          <div className="relative z-10 my-8 flex flex-col items-center text-center space-y-6">
            <div className="w-64 h-64 border-2 border-dashed border-white/10 rounded-[3rem] flex items-center justify-center relative overflow-hidden group hover:border-emerald-500/40 transition-all cursor-pointer bg-slate-950">
              
              {cameraActive ? (
                <div id="reader" className="w-full h-full object-cover z-10" />
              ) : (
                <>
                  {/* Animated green laser line */}
                  <div className="absolute left-0 right-0 h-[2px] bg-emerald-500 shadow-[0_0_15px_#10b981] animate-bounce top-0 bottom-0 z-20" />
                  
                  <div className="absolute inset-5 bg-white/5 rounded-[2.2rem] flex items-center justify-center">
                    <QrCode size={80} className="text-white/20 group-hover:text-emerald-400/60 transition-colors duration-500 animate-pulse" />
                  </div>
                </>
              )}

              {/* Edge corners */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl z-20" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl z-20" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl z-20" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl z-20" />
            </div>
            
            <div className="space-y-4 max-w-sm flex flex-col items-center">
              <button
                onClick={() => setCameraActive(!cameraActive)}
                className={cn(
                  "px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center gap-2 shadow-lg",
                  cameraActive 
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-red-900/10" 
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20"
                )}
              >
                <Camera size={14} />
                {cameraActive ? "Matikan Kamera HP" : "Buka Kamera Scan HP"}
              </button>

              <div className="space-y-1.5">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-100">Pindai Kartu Santri</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Arahkan kamera HP ke QR Code santri, atau dekatkan barcode kartu ke mesin laser scanner USB.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Manual Search (as fallback) */}
          <div className="relative z-10 border-t border-white/5 pt-5 flex flex-col sm:flex-row gap-4 items-center">
            <div className="text-left shrink-0">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pencarian Manual</p>
              <p className="text-[11px] text-slate-400 font-bold">Input NIS atau nama santri</p>
            </div>
            
            <form onSubmit={handleScanSubmit} className="flex-1 w-full relative">
              <input
                type="text"
                placeholder="Ketik nama / NIS santri lalu Enter..."
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-6 py-3.5 rounded-2xl font-bold text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all pr-12"
              />
              <button 
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <Search size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* Right Section: Testing Panel & Recent log stacked (col-span-4) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Quick Database Test (Demonstrasi Instan) */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <ShieldCheck className="text-slate-900" size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest">Alat Demo (Klik untuk Scan)</h3>
            </div>
            <p className="text-[11px] text-slate-400 font-bold">
              Klik nama santri di bawah ini untuk mensimulasikan scan dan menguji semua skenario keputusan:
            </p>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
              {students.slice(0, 5).map(student => {
                const hasArrears = arrears.some(a => a.studentId === student.id && a.status !== 'Lunas');
                const isBypassed = student.dispensationStatus === true;
                
                return (
                  <button
                    key={student.id}
                    onClick={() => triggerMockScan(student)}
                    className="w-full bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-left transition-all"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase">{student.name}</p>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{student.class} • {student.residenceStatus}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Location status badge */}
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                        student.statusPerizinan === 'Di Luar' 
                          ? "bg-sky-50 text-sky-600 border border-sky-100" 
                          : "bg-slate-200 text-slate-600"
                      )}>
                        {student.statusPerizinan === 'Di Luar' ? 'Out' : 'In'}
                      </span>

                      {/* Finance status indicator */}
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        isBypassed 
                          ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" 
                          : hasArrears 
                            ? "bg-amber-500" 
                            : "bg-emerald-500"
                      )} title={isBypassed ? "Dispensasi Aktif" : hasArrears ? "Ada Tunggakan" : "Lunas"} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Scans Stack */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <FileText size={16} /> Aktivitas Terakhir
            </h3>
            
            <div className="space-y-3">
              {recentScans.length === 0 ? (
                <div className="text-center py-8 text-slate-300">
                  <Clock size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Belum ada aktivitas</p>
                </div>
              ) : (
                recentScans.map(log => (
                  <div 
                    key={log.id} 
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 animate-in fade-in slide-in-from-right-3 duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-900 uppercase truncate max-w-[140px]">{log.studentName}</p>
                      <span className="text-[9px] font-black text-slate-400">{log.time}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                      <span>{log.studentClass}</span>
                      <span className={cn(
                        "font-black uppercase tracking-widest text-[8px] px-1.5 py-0.5 rounded",
                        log.type === 'Check-In' ? "bg-sky-50 text-sky-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {log.type}
                      </span>
                    </div>
                    <p className={cn(
                      "text-[10px] font-bold mt-1 border-t border-slate-200/50 pt-1 leading-relaxed",
                      log.status === 'success' && "text-emerald-600",
                      log.status === 'warning' && "text-amber-600",
                      log.status === 'error' && "text-red-500"
                    )}>
                      {log.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ======================================= */}
      {/* 🟢 CHECK-OUT (FORM KEBERANGKATAN) MODAL */}
      {/* ======================================= */}
      <AnimatePresence>
        {showCheckoutModal && scannedStudent && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-emerald-50/50">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Status: Diizinkan
                  </span>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-1">Formulir Keberangkatan</h3>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {/* Student profile snapshot */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center font-black text-slate-700 text-xs uppercase shrink-0">
                    {scannedStudent.name.substring(0, 2)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-black text-slate-900 uppercase truncate">{scannedStudent.name}</p>
                    <p className="text-[10px] font-bold text-slate-400">Kelas {scannedStudent.class} • Mukim: {scannedStudent.residenceStatus}</p>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Izin</label>
                      <select
                        value={permitType}
                        onChange={e => setPermitType(e.target.value as any)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none"
                      >
                        <option value="Keluar Singkat">Keluar Singkat</option>
                        <option value="Pulang">Pulang (Go Home)</option>
                        <option value="Sakit">Sakit (Medis)</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Durasi Izin</label>
                      {permitType === 'Keluar Singkat' ? (
                        <select
                          value={permitDurationHours}
                          onChange={e => setPermitDurationHours(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none"
                        >
                          <option value="1">1 Jam</option>
                          <option value="2">2 Jam</option>
                          <option value="3">3 Jam</option>
                          <option value="4">4 Jam</option>
                          <option value="6">6 Jam</option>
                        </select>
                      ) : (
                        <select
                          value={permitDurationDays}
                          onChange={e => setPermitDurationDays(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none"
                        >
                          <option value="1">1 Hari</option>
                          <option value="2">2 Hari</option>
                          <option value="3">3 Hari</option>
                          <option value="5">5 Hari</option>
                          <option value="7">7 Hari</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alasan Izin</label>
                    <input
                      type="text"
                      placeholder="Contoh: Belanja kebutuhan, hajatan keluarga..."
                      value={permitReason}
                      onChange={e => setPermitReason(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan Tambahan (Opsional)</label>
                    <textarea
                      placeholder="Masukkan catatan pendukung jika ada..."
                      value={permitNotes}
                      onChange={e => setPermitNotes(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-200 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                <button
                  onClick={() => {
                    setShowCheckoutModal(false);
                    setScannedStudent(null);
                  }}
                  className="flex-1 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  Batalkan
                </button>
                <button
                  onClick={handleCheckoutSubmit}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-200"
                >
                  Konfirmasi Keluar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* 🔵 CHECK-IN (KONFIRMASI KEMBALI) MODAL */}
      {/* ======================================= */}
      <AnimatePresence>
        {showCheckinModal && scannedStudent && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Check if student is returning late */}
              {(() => {
                const isLate = activePermission ? (new Date() > new Date(activePermission.expectedReturnDate)) : false;
                
                return (
                  <>
                    <div className={cn(
                      "p-8 border-b border-slate-100 flex items-center gap-4",
                      isLate ? "bg-amber-50/50" : "bg-sky-50/50"
                    )}>
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                        isLate ? "bg-amber-500 text-white shadow-amber-200" : "bg-sky-500 text-white shadow-sky-200"
                      )}>
                        <Clock size={24} />
                      </div>
                      <div>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                          isLate ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-sky-50 text-sky-600 border-sky-200"
                        )}>
                          Status: {isLate ? "Terlambat Kembali" : "Kembali Tepat Waktu"}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-1">Settle Kedatangan Santri</h3>
                      </div>
                    </div>

                    <div className="p-8 space-y-6">
                      {/* Profiles */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center font-black text-slate-700 text-xs uppercase shrink-0">
                          {scannedStudent.name.substring(0, 2)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-black text-slate-900 uppercase truncate">{scannedStudent.name}</p>
                          <p className="text-[10px] font-bold text-slate-400">Kelas {scannedStudent.class} • Mukim: {scannedStudent.residenceStatus}</p>
                        </div>
                      </div>

                      {/* Active permission record */}
                      {activePermission && (
                        <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Izin Aktif</span>
                            <span className="px-2 py-0.5 bg-sky-50 text-sky-600 rounded text-[9px] font-bold border border-sky-100">{activePermission.type}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-800">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Berangkat</p>
                              <p className="mt-0.5">{new Date(activePermission.startDate).toLocaleString('id-ID')}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Tenggat Kembali</p>
                              <p className={cn("mt-0.5", isLate && "text-red-500 font-extrabold")}>
                                {new Date(activePermission.expectedReturnDate).toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-2.5">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Alasan Izin</p>
                            <p className="text-xs text-slate-600 font-bold mt-0.5">{activePermission.reason}</p>
                          </div>
                        </div>
                      )}

                      {/* Late penalty warning banner */}
                      {isLate && (
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 text-amber-800">
                          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wider">Sanksi Keterlambatan Terdeteksi</p>
                            <p className="text-[10px] leading-relaxed mt-0.5">Santri ini melewati batas jam masuk kembali. Harap catat alasan keterlambatan untuk dilaporkan ke pembina kedisplinan.</p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan Tambahan / Alasan Terlambat</label>
                        <input
                          type="text"
                          placeholder="Masukkan alasan terlambat atau catatan khusus kedatangan..."
                          value={checkInNotes}
                          onChange={e => setCheckInNotes(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-sky-200 transition-all"
                        />
                      </div>
                    </div>

                    <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                      <button
                        onClick={() => {
                          setShowCheckinModal(false);
                          setScannedStudent(null);
                          setActivePermission(null);
                          setCheckInNotes('');
                        }}
                        className="flex-1 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                      >
                        Batalkan
                      </button>
                      <button
                        onClick={handleCheckinSubmit}
                        className={cn(
                          "flex-1 py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg",
                          isLate 
                            ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200" 
                            : "bg-sky-600 hover:bg-sky-700 shadow-sky-200"
                        )}
                      >
                        Konfirmasi Masuk
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* 🔴 BLOCKED (TUNGGAKAN / SKORSING) WARNING MODAL */}
      {/* ======================================= */}
      <AnimatePresence>
        {showBlockedModal && scannedStudent && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-red-50/50">
                <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <span className="text-[9px] font-black bg-red-100 text-red-600 uppercase tracking-widest px-2 py-0.5 rounded border border-red-200">
                    Sistem Perizinan Dikunci
                  </span>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-1">Izin Tidak Diizinkan</h3>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {/* Profiles */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center font-black text-slate-700 text-xs uppercase shrink-0">
                    {scannedStudent.name.substring(0, 2)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-black text-slate-900 uppercase truncate">{scannedStudent.name}</p>
                    <p className="text-[10px] font-bold text-slate-400">Kelas {scannedStudent.class} • Mukim: {scannedStudent.residenceStatus}</p>
                  </div>
                </div>

                {/* Block reasons */}
                {scannedStudent.statusPerizinan === 'Skorsing' ? (
                  <div className="bg-red-50 text-red-800 border border-red-100 p-5 rounded-2xl space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle size={16} /> Pelanggaran Disiplin Aktif
                    </h4>
                    <p className="text-xs leading-relaxed font-semibold">
                      Santri ini sedang dalam masa hukuman "Skorsing Perizinan" akibat melanggar peraturan pesantren. Santri tidak diperbolehkan mengajukan izin keluar pesantren hingga masa skors selesai.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-amber-50 text-amber-800 border border-amber-100 p-5 rounded-2xl space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle size={16} /> Tunggakan Keuangan Terdeteksi
                      </h4>
                      <p className="text-xs leading-relaxed font-semibold">
                        Akses perizinan diblokir otomatis oleh gerbang finansial **SIMKEU NH** karena santri memiliki kewajiban administrasi yang belum lunas.
                      </p>
                    </div>

                    {/* Arrear lists */}
                    <div className="border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/50">
                      <div className="px-4 py-3 bg-slate-100 border-b border-slate-150 flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Tagihan Tertunggak</span>
                        <span>Nominal</span>
                      </div>
                      <div className="divide-y divide-slate-150 max-h-[140px] overflow-y-auto">
                        {activeArrears.map((a, i) => (
                          <div key={i} className="px-4 py-2.5 flex justify-between text-xs font-bold text-slate-700">
                            <div>
                              <p className="text-slate-900">{a.type}</p>
                              <p className="text-[9px] text-slate-400 font-semibold">{a.month}</p>
                            </div>
                            <span className="text-red-500 font-black">Rp {a.amount.toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-3 bg-slate-100 border-t border-slate-150 flex justify-between text-xs font-black text-slate-800">
                        <span>TOTAL TUNGGAKAN</span>
                        <span className="text-red-600 text-sm">
                          Rp {activeArrears.reduce((sum, a) => sum + a.amount, 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-bold italic text-center">
                      *Silakan arahkan wali/santri ke kantor Bendahara untuk melakukan pembayaran atau mengajukan dispensasi izin darurat.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                <button
                  onClick={() => {
                    setShowBlockedModal(false);
                    setScannedStudent(null);
                    setActiveArrears([]);
                  }}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                >
                  Tutup & Kembali
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* 🎉 CHECKOUT SUCCESS & PRINT SLIP MODAL   */}
      {/* ======================================= */}
      <AnimatePresence>
        {justCreatedPermission && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden p-8 space-y-6"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Check className="stroke-[3]" size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Check-Out Berhasil!</h3>
                  <p className="text-xs text-slate-400 font-bold">Surat izin keluar digital telah diterbitkan oleh sistem.</p>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3 font-semibold text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase tracking-wider text-[9px]">Santri</span>
                  <span className="text-slate-900 uppercase font-black">{justCreatedPermission.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase tracking-wider text-[9px]">Kelas</span>
                  <span>{justCreatedPermission.studentClass}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase tracking-wider text-[9px]">Tipe Izin</span>
                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-black uppercase tracking-wider">{justCreatedPermission.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase tracking-wider text-[9px]">Kembali Sebelum</span>
                  <span className="text-red-600 font-black">
                    {new Date(justCreatedPermission.expectedReturnDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ({new Date(justCreatedPermission.expectedReturnDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={async () => {
                    if (!justCreatedPermission) return;
                    const student = students.find(s => s.id === justCreatedPermission.studentId);
                    if (!student) return;
                    try {
                      const blob = await printPermissionGatePass(student, justCreatedPermission);
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `GATEPASS_${student.name.replace(/\s+/g,'_')}_${justCreatedPermission.id}.pdf`;
                      link.click();
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-200 text-center"
                >
                  Cetak Surat Izin
                </button>
                <button
                  onClick={() => {
                    setJustCreatedPermission(null);
                    setScannedStudent(null);
                  }}
                  className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-center"
                >
                  Selesai
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
