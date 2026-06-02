import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  printPermissionGatePass, 
  printStudentIDCard, 
  printPermissionExtensionPass 
} from '../lib/pdfGenerator';
import { checkPulangEligibility, EligibilityResult } from '../lib/permissionUtils';
import { usePermissions } from '../hooks/usePermissions';
import { useStudents } from '../hooks/useStudents';
import { useArrears } from '../hooks/useArrears';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import {
  QrCode, Play, AlertCircle, Volume2, VolumeX, ShieldAlert,
  Search, CheckCircle2, XCircle, Clock, FileText, Calendar,
  User, Check, AlertTriangle, MessageSquare, ShieldCheck, Camera, X, Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Student, StudentPermission } from '../types';
import toast from 'react-hot-toast';

export function PermissionScanner() {
  const { students, updateStudent } = useStudents();
  const { arrears } = useArrears();
  const { permissions, addPermission, checkInPermission, updatePermission } = usePermissions();
  const { user } = useAuth();
  const { confirm } = useConfirm();

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
  const [scanError, setScanError] = useState<string | null>(null);

  // Camera scanner states
  const [cameraActive, setCameraActive] = useState(false);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // Load saved custom categories and durations
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('PPNH_CUSTOM_PERMIT_CATEGORIES') || '["Pulang (Go Home)", "Keluar Singkat", "Sakit", "Libur Semester", "Libur Idul Fitri"]'); }
    catch(e) { return ["Pulang (Go Home)", "Keluar Singkat", "Sakit", "Libur Semester", "Libur Idul Fitri"]; }
  });

  const [customDurationsDays, setCustomDurationsDays] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('PPNH_CUSTOM_DURATIONS_DAYS') || '["1", "2", "3", "5", "7", "14", "30"]'); }
    catch(e) { return ["1", "2", "3", "5", "7", "14", "30"]; }
  });

  // Custom Modal States
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddDurationModal, setShowAddDurationModal] = useState(false);
  const [newDurationDays, setNewDurationDays] = useState('');

  // Form Fields for Check-Out (Persisted across batch scanning!)
  const [permitType, setPermitType] = useState<string>(() => localStorage.getItem('PPNH_LAST_PERMIT_TYPE') || 'Keluar Singkat');
  const [permitReason, setPermitReason] = useState(() => localStorage.getItem('PPNH_LAST_PERMIT_REASON') || '');
  const [permitDurationHours, setPermitDurationHours] = useState(() => localStorage.getItem('PPNH_LAST_DURATION_HOURS') || '2');
  const [permitDurationMinutes, setPermitDurationMinutes] = useState(() => localStorage.getItem('PPNH_LAST_DURATION_MINUTES') || '0');
  const [permitDurationDays, setPermitDurationDays] = useState(() => localStorage.getItem('PPNH_LAST_DURATION_DAYS') || '3');
  const [permitNotes, setPermitNotes] = useState('');
  
  // Rule Pulang 100 Hari States
  const [pulangEligibility, setPulangEligibility] = useState<{
    isEligible: boolean;
    daysRemaining: number;
    lastDate: string | null;
  }>({ isEligible: true, daysRemaining: 0, lastDate: null });
  const [emergencyDispensation, setEmergencyDispensation] = useState(false);

  const handlePermitTypeChange = (val: string) => {
    if (val === 'CUSTOM_ADD') {
      setShowAddCategoryModal(true);
      setNewCategoryName('');
      setPermitType(customCategories[0]);
    } else {
      setPermitType(val);
      localStorage.setItem('PPNH_LAST_PERMIT_TYPE', val);
    }
  };

  const handlePermitDurationDaysChange = (val: string) => {
    if (val === 'CUSTOM_ADD') {
      setShowAddDurationModal(true);
      setNewDurationDays('');
      setPermitDurationDays(customDurationsDays[0]);
    } else {
      setPermitDurationDays(val);
      localStorage.setItem('PPNH_LAST_DURATION_DAYS', val);
    }
  };

  const handleAddCategorySubmit = () => {
    if (newCategoryName && newCategoryName.trim()) {
      const updated = [...customCategories, newCategoryName.trim()];
      setCustomCategories(updated);
      localStorage.setItem('PPNH_CUSTOM_PERMIT_CATEGORIES', JSON.stringify(updated));
      setPermitType(newCategoryName.trim());
      localStorage.setItem('PPNH_LAST_PERMIT_TYPE', newCategoryName.trim());
      setShowAddCategoryModal(false);
      setNewCategoryName('');
    }
  };

  const handleAddDurationSubmit = () => {
    const days = parseInt(newDurationDays);
    if (!isNaN(days) && days > 0) {
      const updated = [...customDurationsDays, days.toString()];
      setCustomDurationsDays(updated);
      localStorage.setItem('PPNH_CUSTOM_DURATIONS_DAYS', JSON.stringify(updated));
      setPermitDurationDays(days.toString());
      localStorage.setItem('PPNH_LAST_DURATION_DAYS', days.toString());
      setShowAddDurationModal(false);
      setNewDurationDays('');
    }
  };

  const handlePermitDurationHoursChange = (val: string) => {
    setPermitDurationHours(val);
    localStorage.setItem('PPNH_LAST_DURATION_HOURS', val);
  };

  const handlePermitDurationMinutesChange = (val: string) => {
    setPermitDurationMinutes(val);
    localStorage.setItem('PPNH_LAST_DURATION_MINUTES', val);
  };

  const handlePermitReasonChange = (val: string) => {
    setPermitReason(val);
    localStorage.setItem('PPNH_LAST_PERMIT_REASON', val);
  };

  // Form Fields for Check-In
  const [checkInNotes, setCheckInNotes] = useState('');

  // Extension States
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendDateTime, setExtendDateTime] = useState('');
  const [extendReason, setExtendReason] = useState('');
  const [isExtending, setIsExtending] = useState(false);

  // Refs for auto-focus input
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus logic for USB scanners
  useEffect(() => {
    const focusInput = (e?: MouseEvent) => {
      // Jika ada modal yang terbuka, jangan curi fokus agar pengguna bisa mengetik dengan normal
      if (showCheckoutModal || showCheckinModal || showBlockedModal) {
        return;
      }

      // Cegah pencurian fokus jika pengguna sengaja mengklik elemen interaktif lainnya
      if (e?.target) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'BUTTON' ||
          target.closest('button') ||
          target.closest('input') ||
          target.closest('select') ||
          target.closest('textarea')
        ) {
          return;
        }
      }

      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    focusInput();
    // Re-focus on page clicks to prevent losing keyboard input
    document.addEventListener('click', focusInput);
    return () => document.removeEventListener('click', focusInput);
  }, [showCheckoutModal, showCheckinModal, showBlockedModal]);

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
          // Decode printed pass or raw ID (supports URI decoding for URL-encoded characters like %7C)
          let finalCode = decodedText;
          try {
            finalCode = decodeURIComponent(decodedText);
          } catch (e) {
            console.error("Decode error:", e);
          }

          if (finalCode.includes('|')) {
            const parts = finalCode.split('|');
            if (parts.length > 2) {
              // Extract student name or permission ID
              const nameSegment = parts[2].replace(/_/g, ' ');
              finalCode = nameSegment;
            }
          }

          // Stop scanner FIRST to prevent DOM element unmounting race-conditions!
          if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
              qrScannerRef.current = null;
              setCameraActive(false);
              processScanCode(finalCode);
            }).catch(err => {
              console.error("Scanner stop fail inside callback:", err);
              setCameraActive(false);
              processScanCode(finalCode);
            });
          } else {
            setCameraActive(false);
            processScanCode(finalCode);
          }
        },
        () => {
          // Ignore scanning feedback noise
        }
      ).catch(err => {
        console.error("Camera start error:", err);
        setCameraActive(false);
        toast.error("Gagal mengaktifkan kamera. Pastikan Anda telah memberikan izin akses kamera pada peramban (browser) HP Anda.", { duration: 6000 });
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

    // 0. Check if this is a Gatepass Barcode (PPNH-PERMIT|id|name|type)
    if (code.toUpperCase().startsWith('PPNH-PERMIT|')) {
      const parts = code.split('|');
      const permId = parts[1];
      const existingPerm = permissions.find(p => p.id === permId);

      if (existingPerm) {
        const student = students.find(s => s.id === existingPerm.studentId);
        if (!student) {
          playFeedbackSound('error');
          setScanError(code);
          setIsProcessing(false);
          return;
        }

        // Check if this permission is ALREADY completed!
        if (existingPerm.status === 'Kembali' || existingPerm.status === 'Terlambat') {
          playFeedbackSound('warning');
          addRecentLog({
            id: student.id,
            studentName: student.name,
            studentClass: student.class,
            status: 'warning',
            type: 'Check-In',
            time: new Date().toLocaleTimeString('id-ID'),
            message: `Izin Ditolak: Surat izin ini sudah berstatus ${existingPerm.status}.`
          });
          toast.error(`PERHATIAN:\nSurat Izin ini sudah selesai dengan status "${existingPerm.status}".\nSantri atas nama ${student.name} telah tercatat kembali ke pesantren.`, { duration: 6000 });
          setIsProcessing(false);
          return;
        }

        if (existingPerm.status === 'Aktif') {
          // Proceed with Check-In!
          setScannedStudent(student);
          setActivePermission(existingPerm);
          const studentArrears = arrears.filter(a => a.studentId === student.id && a.status !== 'Lunas');
          setActiveArrears(studentArrears);
          playFeedbackSound('success');
          setShowCheckinModal(true);
          setIsProcessing(false);
          return;
        }
      }
    }

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
      setScanError(code);
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

        // Reset checkout form fields (Hanya reset catatan, biarkan preset kategori & durasi bertahan!)
        setPermitNotes('');
        setEmergencyDispensation(false);

        // 4. Check 100-day Pulang Eligibility using utility
        if (permitType !== 'Keluar Singkat') {
          const eligibility = checkPulangEligibility(student.id, permissions);
          setPulangEligibility(eligibility);
        } else {
          setPulangEligibility({ isEligible: true, daysRemaining: 0, lastDate: null });
        }

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

    const confirmCheckout = await confirm({
      title: 'Konfirmasi Check-Out',
      message: `Apakah Anda yakin ingin memproses Check-Out "${permitType}" untuk santri "${scannedStudent.name}"?`,
      type: 'warning'
    });
    if (!confirmCheckout) return;

    // Calculate expected return time
    const expected = new Date();
    if (permitType === 'Keluar Singkat') {
      const hours = parseInt(permitDurationHours) || 0;
      const minutes = parseInt(permitDurationMinutes) || 0;
      expected.setHours(expected.getHours() + hours);
      expected.setMinutes(expected.getMinutes() + minutes);
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
        notes: emergencyDispensation 
          ? `[DISPEN DARURAT 100 HARI] ${permitNotes}`.trim() 
          : permitNotes
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

      if (scannedStudent.dispensationStatus) {
        await updateStudent(scannedStudent.id, { dispensationStatus: false, dispensationReason: '' });
      }

      // Show success modal with printing slip option
      setJustCreatedPermission(newPerm || {
        id: Math.random().toString(),
        studentId: scannedStudent.id,
        studentName: scannedStudent.name,
        studentClass: scannedStudent.class,
        type: permitType,
        reason: permitReason || `Izin ${permitType}`,
        durationHours: permitType === 'Keluar Singkat' ? (parseInt(permitDurationHours) + (parseInt(permitDurationMinutes) / 60)) : undefined,
        startDate: new Date().toISOString(),
        expectedReturnDate: expected.toISOString(),
        status: 'Aktif',
        createdBy: user?.id || '',
        notes: permitNotes
      });
      setShowCheckoutModal(false);
      toast.success('Check-out berhasil diproses!');
    } catch (err: any) {
      console.error(err);
      toast.error(`Gagal memproses check-out: ${err.message || 'Error tidak dikenal'}`);
    }
  };

  // Submit check-in permission settlement
  const handleCheckinSubmit = async () => {
    if (!scannedStudent || !activePermission) return;

    const confirmCheckin = await confirm({
      title: 'Konfirmasi Check-In',
      message: `Apakah Anda yakin ingin memproses Check-In (Kembali) untuk santri "${scannedStudent.name}"?`,
      type: 'info'
    });
    if (!confirmCheckin) return;

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
      toast.success('Check-in berhasil diproses!');
    } catch (err: any) {
      console.error(err);
      toast.error(`Gagal memproses check-in: ${err.message || 'Error tidak dikenal'}`);
    }
  };

  // Submit permission extension
  const handleExtendSubmit = async () => {
    if (!scannedStudent || !activePermission || !extendReason.trim() || !extendDateTime) {
      toast.error('Alasan dan Batas Waktu baru wajib diisi!');
      return;
    }

    const confirmExtend = await confirm({
      title: 'Konfirmasi Perpanjangan',
      message: `Apakah Anda yakin ingin memperpanjang waktu kembali untuk santri "${scannedStudent.name}"?`,
      type: 'warning'
    });
    if (!confirmExtend) return;

    setIsExtending(true);
    try {
      const newExpected = new Date(extendDateTime);
      const currentExpected = new Date(activePermission.expectedReturnDate);
      
      // Calculate diff for PDF info
      const diffMs = newExpected.getTime() - currentExpected.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      const amountText = diffHours >= 24 ? `${Math.floor(diffHours/24)} Hari` : `${diffHours} Jam`;

      const extensionNote = `[Diperpanjang s/d ${newExpected.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}]: ${extendReason}`;
      const updatedNotes = activePermission.notes 
        ? `${activePermission.notes}\n${extensionNote}`
        : extensionNote;

      await updatePermission(activePermission.id, {
        expectedReturnDate: newExpected.toISOString(),
        notes: updatedNotes
      });

      // Generate PDF for extension
      const blob = await (await import('../lib/pdfGenerator')).printPermissionExtensionPass(
        scannedStudent,
        { ...activePermission, expectedReturnDate: newExpected.toISOString(), notes: updatedNotes },
        amountText,
        extendReason
      );
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      toast.success('Izin berhasil diperpanjang!');
      setShowExtendModal(false);
      setShowCheckinModal(false);
      setScannedStudent(null);
      setActivePermission(null);
      setExtendReason('');
      setExtendDateTime('');
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperpanjang izin.');
    } finally {
      setIsExtending(false);
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
          inputMode="none"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          value={scanInput}
          onChange={e => setScanInput(e.target.value)}
          placeholder="Hardware scanner input target"
          className="w-10 text-xs"
        />
      </form>

      {/* Main Grid: Live Scanner Simulation & Quick testing panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Section: Live Scanner Mock Screen (col-span-8) */}
        <div className="lg:col-span-8 bg-slate-950 text-white p-8 rounded-[3rem] border border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col justify-between min-h-[580px]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0f172a,transparent_80%)] opacity-80 pointer-events-none" />

          {/* Header element inside scan screen */}
          <div className="relative z-10 flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800 backdrop-blur-sm">
              <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_#22d3ee]" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400">Scanner Online & Terfokus</span>
            </div>
            <div className="text-[9px] font-bold text-slate-500 italic uppercase tracking-wider hidden sm:block">
              // Klik area manapun untuk merebut fokus alat
            </div>
          </div>

          {/* Enhanced Large Scanner Frame */}
          <div className="relative z-10 my-10 flex flex-col items-center text-center space-y-8">
            <div className="relative group cursor-pointer w-72 h-72 sm:w-80 sm:h-80">
              {/* Sci-fi Outer Glow */}
              <div className="absolute inset-0 bg-cyan-500/5 rounded-3xl blur-2xl group-hover:bg-cyan-500/20 transition-all duration-700 pointer-events-none" />
              
              <div className="absolute inset-0 border border-slate-700/50 rounded-3xl overflow-hidden bg-slate-950/80 backdrop-blur-md shadow-2xl flex items-center justify-center">
                {cameraActive ? (
                  <div id="reader" className="w-full h-full object-cover z-10 scale-105" />
                ) : (
                  <>
                    {/* Grid Pattern Background */}
                    <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
                    
                    {/* Sweeping Laser Effect */}
                    <motion.div 
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="absolute left-0 right-0 h-[3px] bg-cyan-400 shadow-[0_0_20px_#22d3ee] z-20 opacity-80" 
                    />

                    <div className="absolute inset-6 bg-slate-900/50 rounded-[2rem] border border-slate-800 flex items-center justify-center">
                      <QrCode size={80} className="text-cyan-500/30 group-hover:text-cyan-400/80 transition-colors duration-500 animate-pulse" />
                    </div>
                  </>
                )}

                {/* HUD Elements */}
                <div className="absolute top-4 left-4 text-[8px] font-black tracking-widest text-cyan-500/50 uppercase">
                  [SYS_RDY]
                </div>
                <div className="absolute bottom-4 right-4 text-[8px] font-black tracking-widest text-cyan-500/50 uppercase">
                  SCAN_WAIT...
                </div>

                {/* Cyberpunk Edge Corners */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cyan-400 rounded-tl-3xl z-20 pointer-events-none" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-cyan-400 rounded-tr-3xl z-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-cyan-400 rounded-bl-3xl z-20 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-cyan-400 rounded-br-3xl z-20 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-5 max-w-md flex flex-col items-center">
              <button
                onClick={() => setCameraActive(!cameraActive)}
                className={cn(
                  "btn-touch w-full max-w-[280px] rounded-2xl shadow-2xl relative overflow-hidden group/btn",
                  cameraActive
                    ? "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20"
                    : "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-cyan-500/20"
                )}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                <Camera size={16} className="relative z-10" />
                <span className="relative z-10">{cameraActive ? "MATIKAN KAMERA" : "AKTIFKAN KAMERA"}</span>
              </button>

              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-[0.15em] text-cyan-400">Autentikasi ID Santri</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-semibold px-4">
                  Hadapkan <span className="text-slate-200">QR Code</span> ke kamera pintar atau dekatkan kartu fisik pada mesin laser scan USB.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Manual Search (as fallback) */}
          <div className="relative z-10 border-t border-slate-800 pt-6 flex flex-col sm:flex-row gap-5 items-center">
            <div className="text-left shrink-0">
              <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Input Manual</p>
              <p className="text-[11px] text-slate-400 font-bold">Gunakan Nama / NIS</p>
            </div>

            <form onSubmit={handleScanSubmit} className="flex-1 w-full relative group">
              <input
                type="text"
                placeholder="Identitas santri / Enter..."
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 px-6 py-4 rounded-2xl font-bold text-sm text-cyan-50 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all pr-12 placeholder:text-slate-600 min-h-[56px]"
              />
              <button
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors"
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
                    className="w-full bg-slate-50 hover:bg-slate-100 p-4 rounded-xl border border-slate-100 flex items-center justify-between text-left transition-all min-h-[64px]"
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
          <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <FileText size={16} className="text-cyan-400" /> Live Feed Log
              </h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Realtime</span>
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              {recentScans.length === 0 ? (
                <div className="text-center py-10 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <Clock size={24} className="mx-auto mb-3 text-slate-600" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Menunggu Aktivitas...</p>
                </div>
              ) : (
                recentScans.map(log => (
                  <div
                    key={log.id}
                    className="relative pl-4 py-2 border-l-[3px] animate-in fade-in slide-in-from-right-4 duration-300 group"
                    style={{
                      borderColor: log.status === 'success' ? '#10b981' : log.status === 'warning' ? '#f59e0b' : '#ef4444'
                    }}
                  >
                    {/* Glowing dot on the border */}
                    <div 
                      className="absolute left-[-5.5px] top-6 w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: log.status === 'success' ? '#10b981' : log.status === 'warning' ? '#f59e0b' : '#ef4444',
                        boxShadow: `0 0 8px ${log.status === 'success' ? '#10b981' : log.status === 'warning' ? '#f59e0b' : '#ef4444'}`
                      }}
                    />

                    <div className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-4 rounded-xl transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="text-xs font-black text-white uppercase truncate">{log.studentName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{log.studentClass}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={cn(
                            "inline-block font-black uppercase tracking-[0.2em] text-[8px] px-2 py-1 rounded bg-slate-900 border border-slate-700 shadow-inner",
                            log.type === 'Check-In' ? "text-cyan-400" : "text-emerald-400"
                          )}>
                            {log.type}
                          </span>
                          <p className="text-[8px] font-black text-slate-500 mt-1.5">{log.time}</p>
                        </div>
                      </div>

                      <p className={cn(
                        "text-[10px] font-bold mt-2 pt-2 border-t border-slate-700/50 leading-relaxed",
                        log.status === 'success' && "text-emerald-400",
                        log.status === 'warning' && "text-amber-400",
                        log.status === 'error' && "text-red-400"
                      )}>
                        {log.message}
                      </p>
                    </div>
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
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-emerald-50/50 shrink-0">
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

              <div className="p-8 space-y-6 overflow-y-auto flex-1">
                {/* Student profile snapshot */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center font-black text-slate-700 text-xs uppercase shrink-0">
                    {scannedStudent.name.substring(0, 2)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-black text-slate-900 uppercase truncate">{scannedStudent.name}</p>
                    <p className="text-[10px] font-bold text-slate-400">Kelas {scannedStudent.class} • Status: {scannedStudent.residenceStatus}</p>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Izin</label>
                      <select
                        value={permitType}
                        onChange={e => handlePermitTypeChange(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                      >
                        {customCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="CUSTOM_ADD">➕ Tambah Kategori Kustom...</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Durasi Izin</label>
                      {permitType === 'Keluar Singkat' ? (
                        <div className="flex gap-2">
                          <select
                            value={permitDurationHours}
                            onChange={e => handlePermitDurationHoursChange(e.target.value)}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                          >
                            {[...Array(13)].map((_, i) => (
                              <option key={i} value={i}>{i} Jam</option>
                            ))}
                          </select>
                          <select
                            value={permitDurationMinutes}
                            onChange={e => handlePermitDurationMinutesChange(e.target.value)}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                          >
                            {[0, 5, 10, 15, 20, 30, 45].map(m => (
                              <option key={m} value={m}>{m} Menit</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <select
                          value={permitDurationDays}
                          onChange={e => handlePermitDurationDaysChange(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                        >
                          {customDurationsDays.map(d => (
                            <option key={d} value={d}>{d} Hari</option>
                          ))}
                          <option value="CUSTOM_ADD">➕ Custom Hari...</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alasan Izin</label>
                    <input
                      type="text"
                      placeholder="Contoh: Belanja kebutuhan, hajatan keluarga, libur semester..."
                      value={permitReason}
                      onChange={e => handlePermitReasonChange(e.target.value)}
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

                  {/* 100 Day Rule Alert & Emergency Bypass */}
                  {permitType !== 'Keluar Singkat' && !pulangEligibility.isEligible && (
                    <div className={cn(
                      "p-5 rounded-2xl border flex flex-col gap-4 transition-all duration-500",
                      emergencyDispensation 
                        ? "bg-emerald-50 border-emerald-100 shadow-inner" 
                        : "bg-rose-50 border-rose-100"
                    )}>
                      <div className="flex gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md",
                          emergencyDispensation ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                        )}>
                          {emergencyDispensation ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
                        </div>
                        <div className="space-y-1">
                          <p className={cn(
                            "text-[10px] font-black uppercase tracking-wider",
                            emergencyDispensation ? "text-emerald-700" : "text-rose-700"
                          )}>
                            {emergencyDispensation ? "Dispensasi Darurat Aktif" : "Aturan 100 Hari Terdeteksi"}
                          </p>
                          <p className={cn(
                            "text-xs font-bold leading-relaxed",
                            emergencyDispensation ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {emergencyDispensation 
                              ? "Akses dibuka khusus untuk keperluan darurat. Harap pastikan alasan sudah diverifikasi." 
                              : `Santri terakhir izin pulang pada ${pulangEligibility.lastDate}. Masih tersisa ${pulangEligibility.daysRemaining} hari lagi sebelum diizinkan pulang kembali.`}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setEmergencyDispensation(!emergencyDispensation)}
                        className={cn(
                          "w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border-2",
                          emergencyDispensation
                            ? "bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                            : "bg-white border-rose-200 text-rose-600 hover:bg-rose-100"
                        )}
                      >
                        {emergencyDispensation ? (
                          <>
                            <Check size={14} /> BATALKAN DISPEN DARURAT
                          </>
                        ) : (
                          <>
                            <Plus size={14} /> AKTIFKAN DISPEN DARURAT
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
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
                  disabled={permitType !== 'Keluar Singkat' && !pulangEligibility.isEligible && !emergencyDispensation}
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg",
                    permitType !== 'Keluar Singkat' && !pulangEligibility.isEligible && !emergencyDispensation
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                  )}
                >
                  Konfirmasi Keluar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* 🔮 MODAL TAMBAH KATEGORI KUSTOM          */}
      {/* ======================================= */}
      <AnimatePresence>
        {showAddCategoryModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Kategori Izin Baru</h3>
                    <p className="text-[10px] font-bold text-slate-500">Tambahkan opsi preset ke dalam sistem</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddCategoryModal(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-950 transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Kategori</label>
                  <input
                    type="text"
                    placeholder="Contoh: Libur Semester, Libur Idul Fitri..."
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    autoFocus
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-900 outline-none focus:ring-4 focus:ring-slate-100 transition-all"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddCategorySubmit();
                    }}
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => setShowAddCategoryModal(false)}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-center"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleAddCategorySubmit}
                    className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg text-center"
                  >
                    Simpan & Pilih
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* 🔮 MODAL TAMBAH DURASI KUSTOM            */}
      {/* ======================================= */}
      <AnimatePresence>
        {showAddDurationModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Durasi Izin Baru</h3>
                    <p className="text-[10px] font-bold text-slate-500">Tambahkan jumlah hari kustom</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddDurationModal(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-950 transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah Hari</label>
                  <input
                    type="number"
                    placeholder="Contoh: 14"
                    value={newDurationDays}
                    onChange={e => setNewDurationDays(e.target.value)}
                    autoFocus
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-900 outline-none focus:ring-4 focus:ring-slate-100 transition-all"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddDurationSubmit();
                    }}
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => setShowAddDurationModal(false)}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-center"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleAddDurationSubmit}
                    className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg text-center"
                  >
                    Simpan & Pilih
                  </button>
                </div>
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
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Check if student is returning late */}
              {(() => {
                const isLate = activePermission ? (new Date() > new Date(activePermission.expectedReturnDate)) : false;

                return (
                  <>
                    <div className={cn(
                      "p-8 border-b border-slate-100 flex items-center gap-4 shrink-0",
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
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-1">Bukti Kedatangan Santri</h3>
                      </div>
                    </div>

                    <div className="p-8 space-y-6 overflow-y-auto flex-1">
                      {/* Profiles */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center font-black text-slate-700 text-xs uppercase shrink-0">
                          {scannedStudent.name.substring(0, 2)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-black text-slate-900 uppercase truncate">{scannedStudent.name}</p>
                          <p className="text-[10px] font-bold text-slate-400">Kelas {scannedStudent.class} • Status: {scannedStudent.residenceStatus}</p>
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

                          <div className="border-t border-slate-100 pt-2.5 space-y-2">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Alasan Izin</p>
                              <p className="text-xs text-slate-600 font-bold mt-0.5">{activePermission.reason}</p>
                            </div>
                            
                            {activePermission.notes?.includes('[PERPANJANGAN') && (
                              <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                <p className="text-[9px] text-emerald-700 font-black uppercase tracking-widest">Catatan Perpanjangan</p>
                                <p className="text-[10px] text-emerald-600 font-bold mt-0.5 italic">
                                  {activePermission.notes.split('\n').find(l => l.includes('[PERPANJANGAN'))}
                                </p>
                              </div>
                            )}
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
                            
                            {activePermission?.notes?.includes('[PERPANJANGAN') && (
                              <div className="mt-3 p-3 bg-red-600 text-white rounded-lg shadow-lg border border-red-400 animate-pulse">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1">⚠️ PELANGGARAN BERLAPIS</p>
                                <p className="text-[10px] font-bold leading-tight">
                                  Santri terlambat meskipun telah diberi perpanjangan waktu. 
                                  Sanksi: Wajib memberikan 1 SAK SEMEN ke pondok untuk pembangunan.
                                </p>
                              </div>
                            )}
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

                    <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 shrink-0">
                      <button
                        onClick={() => {
                          setShowCheckinModal(false);
                          setScannedStudent(null);
                          setActivePermission(null);
                          setCheckInNotes('');
                        }}
                        className="flex-1 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all min-w-[100px]"
                      >
                        Batalkan
                      </button>
                      {activePermission?.notes?.toLowerCase().includes('diperpanjang') && (
                        <button
                          onClick={async () => {
                            if (!scannedStudent || !activePermission) return;
                            const noteLines = activePermission.notes?.split('\n') || [];
                            const extLine = [...noteLines].reverse().find(l => l.toLowerCase().includes('diperpanjang')) || '';
                            
                            try {
                              const blob = await (await import('../lib/pdfGenerator')).printPermissionExtensionPass(
                                scannedStudent, 
                                activePermission, 
                                "Terlampir", 
                                extLine
                              );
                              const url = URL.createObjectURL(blob);
                              window.open(url, '_blank');
                            } catch (err) {
                              toast.error('Gagal mencetak ulang surat perpanjangan.');
                            }
                          }}
                          className="flex-1 py-4 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-center min-w-[120px]"
                        >
                          Cetak Perpanjangan
                        </button>
                      )}
                      <button
                        onClick={handleCheckinSubmit}
                        className={cn(
                          "flex-1 py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg min-w-[120px]",
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
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-red-50/50 shrink-0">
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

              <div className="p-8 space-y-6 overflow-y-auto flex-1">
                {/* Profiles */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center font-black text-slate-700 text-xs uppercase shrink-0">
                    {scannedStudent.name.substring(0, 2)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-black text-slate-900 uppercase truncate">{scannedStudent.name}</p>
                    <p className="text-[10px] font-bold text-slate-400">Kelas {scannedStudent.class} • Status: {scannedStudent.residenceStatus}</p>
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

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
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
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl max-w-md w-full p-8 space-y-6 overflow-y-auto my-auto max-h-[90vh]"
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
                      const blob = await printPermissionGatePass(student, justCreatedPermission, permissions, arrears);
                      const url = URL.createObjectURL(blob);
                      window.open(url, '_blank');
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-200 text-center"
                >
                  Review & Cetak
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

      {/* ======================================= */}
      {/* 🔮 MODAL PERPANJANGAN IZIN               */}
      {/* ======================================= */}
      <AnimatePresence>
        {showExtendModal && scannedStudent && activePermission && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 bg-emerald-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Perpanjang Izin</h3>
                    <p className="text-[10px] font-bold text-slate-500">Ajukan tambahan waktu keberangkatan</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExtendModal(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Tenggat Saat Ini</p>
                  <p className="text-sm font-black text-slate-900">{new Date(activePermission.expectedReturnDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Tanggal & Jam Baru (Batas Kembali)</label>
                  <input
                    type="datetime-local"
                    value={extendDateTime}
                    onChange={e => setExtendDateTime(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-900 outline-none focus:ring-4 focus:ring-sky-100 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alasan Perpanjangan (Wajib)</label>
                  <textarea
                    placeholder="Contoh: Sakit bertambah parah, kendaraan rusak, acara keluarga belum selesai..."
                    value={extendReason}
                    onChange={e => setExtendReason(e.target.value)}
                    rows={3}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-900 outline-none focus:ring-4 focus:ring-emerald-50 transition-all resize-none"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                  <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest mb-1 italic">SANKSI PENYALAHGUNAAN:</p>
                  <p className="text-[9px] text-amber-700 font-bold leading-relaxed">
                    Apabila telah diberikan perpanjangan namun masih terlambat, santri dikenakan sanksi disiplin pembangunan berupa **1 Sak Semen**.
                  </p>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => setShowExtendModal(false)}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleExtendSubmit}
                    disabled={isExtending || !extendReason.trim() || !extendDateTime}
                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-200 disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {isExtending ? "Memproses..." : "Konfirmasi & Cetak"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* 🔴 SCAN ERROR / NOT FOUND MODAL */}
      {/* ======================================= */}
      <AnimatePresence>
        {scanError && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-red-50/50 shrink-0">
                <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                  <X size={24} className="stroke-[3]" />
                </div>
                <div>
                  <span className="text-[9px] font-black bg-red-100 text-red-600 uppercase tracking-widest px-2 py-0.5 rounded border border-red-200">
                    Gagal Mengidentifikasi
                  </span>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-1">Kartu Tidak Dikenali</h3>
                </div>
              </div>

              <div className="p-8 space-y-4 overflow-y-auto flex-1">
                <p className="text-slate-600 font-bold text-xs leading-relaxed">
                  Sistem pemindai tidak menemukan kecocokan data santri untuk kode berikut:
                </p>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-xs text-slate-800 font-bold break-all text-center">
                  {scanError}
                </div>
                <p className="text-[10px] text-slate-400 font-semibold italic">
                  *Pastikan Anda men-scan QR Code / Barcode resmi SIMKEU NH yang valid dan sudah di-input ke profil santri.
                </p>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
                <button
                  onClick={() => setScanError(null)}
                  className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg text-center"
                >
                  Tutup & Scan Ulang
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
