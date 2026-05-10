import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, Arrear, StudentPermission } from '../types';

const indonesianMonths: Record<string, number> = {
  'januari': 1,
  'februari': 2,
  'maret': 3,
  'april': 4,
  'mei': 5,
  'juni': 6,
  'juli': 7,
  'agustus': 8,
  'september': 9,
  'oktober': 10,
  'november': 11,
  'desember': 12
};

const parseMonthYearString = (str: string) => {
  if (!str) return { month: 0, year: 0 };
  const parts = str.toLowerCase().trim().split(' ');
  if (parts.length === 2) {
    const monthIndex = indonesianMonths[parts[0]] || 0;
    const year = parseInt(parts[1], 10) || 0;
    return { month: monthIndex, year };
  }
  return { month: 0, year: 0 };
};

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

export const printClearanceLetter = async (studentInput: Student | Student[]) => {
  // Hanya proses 1 santri untuk format A4 Portrait
  const student = Array.isArray(studentInput) ? studentInput[0] : studentInput;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- 1. MODERN HEADER BANNER ---
  doc.setFillColor(30, 58, 138); // Dark Blue (bg-blue-900)
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  // Header left text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('SIMKEU NH', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(191, 219, 254); // Light Blue (bg-blue-200)
  doc.text('SISTEM INFORMASI MANAJEMEN KEUANGAN', 20, 34);
  doc.text('Pondok Pesantren Nurul Huda Malati', 20, 40);

  // Header right text (Doc No & Date)
  const dateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const docRef = 'REF-' + new Date().getFullYear() + Math.floor(1000 + Math.random() * 9000);
  
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('TANGGAL CETAK :', pageWidth - 20, 25, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(dateStr.toUpperCase(), pageWidth - 20, 30, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(191, 219, 254);
  doc.text('NO. DOKUMEN :', pageWidth - 20, 39, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(docRef, pageWidth - 20, 44, { align: 'right' });

  // --- 2. TITLE ---
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('IZIN PERPULANGAN SANTRI', pageWidth / 2, 85, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('Dokumen ini adalah verifikasi sah sistem bahwa santri berikut diizinkan pulang.', pageWidth / 2, 91, { align: 'center' });

  // --- 3. STUDENT INFO ---
  // We use autoTable to draw a clean bordered list
  autoTable(doc, {
    startY: 105,
    margin: { left: 20, right: 20 },
    tableWidth: pageWidth - 40,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240], // Slate 200
      lineWidth: 0.1,
      fillColor: [248, 250, 252] // Slate 50
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45, textColor: [100, 116, 139] },
      1: { cellWidth: 'auto', fontStyle: 'bold' }
    },
    body: [
      ['NAMA LENGKAP', ':  ' + student.name.toUpperCase()],
      ['KELAS', ':  ' + student.class],
      ['WALI SANTRI', ':  ' + student.parentName.toUpperCase()],
      ['STATUS MUKIM', ':  ' + student.residenceStatus.toUpperCase()]
    ]
  });

  let currentY = (doc as any).lastAutoTable.finalY + 15;

  // --- 4. CLEARANCE DECISION BLOCK ---
  const isClear = student.totalArrears === 0;
  const boxHeight = 35;
  
  doc.setFillColor(isClear ? 240 : 254, isClear ? 253 : 242, isClear ? 244 : 242); // Green 50 or Red 50
  doc.setDrawColor(isClear ? 134 : 248, isClear ? 239 : 113, isClear ? 172 : 113); // Green 300 or Red 300
  doc.setLineWidth(0.5);
  doc.roundedRect(20, currentY, pageWidth - 40, boxHeight, 4, 4, 'FD');

  doc.setTextColor(isClear ? 21 : 153, isClear ? 128 : 27, isClear ? 61 : 27); // Green 700 or Red 700
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('STATUS VERIFIKASI SISTEM:', 25, currentY + 10);
  
  doc.setFontSize(20);
  doc.text(isClear ? 'DIIZINKAN PULANG' : 'DIIZINKAN (DISPENSASI)', 25, currentY + 22);

  // Dispensasi Reason if any
  if (!isClear) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(153, 27, 27); // Red 700
    doc.text(`Telah mendapat izin khusus (Tunggakan: Rp ${student.totalArrears.toLocaleString('id-ID')}) | Alasan: ${student.dispensationReason || '-'}`, 25, currentY + 30);
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Telah melunasi seluruh tanggungan administrasi di pesantren.', 25, currentY + 30);
  }

  // --- 5. QR CODE VERIFICATION & SIGNATURE ---
  currentY += 45;

  try {
    const qrData = encodeURIComponent(`SIMKEU-NH|CLEARANCE|${docRef}|${student.name.replace(/\s+/g,'_')}|${isClear ? 'LUNAS' : 'DISPENSASI'}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;
    const qrImg = await loadImage(qrUrl);
    
    // Draw QR
    doc.addImage(qrImg, 'PNG', 20, currentY, 30, 30);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138); // Dark Blue
    doc.text('VALIDATED BY SYSTEM', 55, currentY + 10);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const qrDesc = doc.splitTextToSize('Dokumen ini diverifikasi secara digital oleh SIMKEU NH.\nScan QR Code untuk mengecek otentikasi data.', 80);
    doc.text(qrDesc, 55, currentY + 16);

  } catch (e) {
    console.error('Failed to load QR code', e);
  }

  // Right side 'Signature'
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Otorisasi Sistem Digital', pageWidth - 20, currentY + 10, { align: 'right' });
  
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138);
  doc.setFont('helvetica', 'bold');
  doc.text('SIMKEU NH', pageWidth - 20, currentY + 20, { align: 'right' });
  doc.setDrawColor(203, 213, 225);
  doc.line(pageWidth - 65, currentY + 23, pageWidth - 20, currentY + 23);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Sistem Administrasi Keuangan Terpusat', pageWidth - 20, currentY + 28, { align: 'right' });

  // --- 6. FOOTER ---
  doc.setDrawColor(226, 232, 240);
  doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Dokumen elektronik ini dihasilkan secara otomatis dan sah tanpa cap/stempel basah dan tanda tangan.', pageWidth / 2, pageHeight - 14, { align: 'center' });
  doc.text('Dicetak oleh sistem SIMKEU NH © ' + new Date().getFullYear(), pageWidth / 2, pageHeight - 10, { align: 'center' });

  return new Blob([doc.output('blob')], { type: 'application/pdf' });
};

export const generateReceiptPDF = async (
  student: Student, 
  payments: { type: string, month: string, amount: number }[],
  performedBy: string
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5' // Struk biasanya lebih kecil dari A4
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- 1. HEADER BANNER ---
  doc.setFillColor(30, 58, 138); // Dark Blue
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('SIMKEU NH', 15, 15);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(191, 219, 254);
  doc.text('SISTEM MANAJEMEN KEUANGAN', 15, 21);
  doc.text('Pondok Pesantren Nurul Huda Malati', 15, 25);

  const dateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  const docRef = 'RCP-' + Date.now().toString().slice(-8);
  
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('NO. REFERENSI', pageWidth - 15, 15, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(docRef, pageWidth - 15, 20, { align: 'right' });
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('TANGGAL BAYAR', pageWidth - 15, 27, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(dateStr, pageWidth - 15, 32, { align: 'right' });

  // --- 2. TITLE ---
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('BUKTI PEMBAYARAN RESMI', pageWidth / 2, 55, { align: 'center' });
  
  // --- 3. STUDENT INFO ---
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('PEMBAYARAN DARI SANTRI:', 15, 65);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(student.name.toUpperCase(), 15, 71);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`KELAS: ${student.class}`, 15, 76);

  // --- 4. PAYMENT TABLE ---
  const tableData = payments.map(p => [
    `${p.type} (${p.month})`,
    `Rp ${p.amount.toLocaleString('id-ID')}`
  ]);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  autoTable(doc, {
    startY: 85,
    margin: { left: 15, right: 15 },
    tableWidth: pageWidth - 30,
    theme: 'plain',
    head: [['URAIAN PEMBAYARAN', 'NOMINAL']],
    body: tableData,
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [71, 85, 105],
      fontSize: 8,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    columnStyles: {
      1: { halign: 'right', fontStyle: 'bold' }
    }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 5;

  // --- 5. TOTAL BLOCK ---
  doc.setFillColor(30, 58, 138);
  doc.rect(pageWidth - 65, currentY, 50, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('TOTAL DIBAYAR', pageWidth - 60, currentY + 5);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rp ${totalPaid.toLocaleString('id-ID')}`, pageWidth - 18, currentY + 9, { align: 'right' });

  // --- 6. FOOTER & QR ---
  currentY += 25;
  
  try {
    const qrData = encodeURIComponent(`SIMKEU-NH|RECEIPT|${docRef}|${student.name}|${totalPaid}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}`;
    const qrImg = await loadImage(qrUrl);
    doc.addImage(qrImg, 'PNG', 15, currentY, 20, 20);
  } catch (e) {}

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('DIVERIFIKASI OLEH SISTEM', 40, currentY + 8);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('SIMKEU NH DIGITAL', 40, currentY + 13);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('PETUGAS PENERIMA:', pageWidth - 15, currentY + 8, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(performedBy.toUpperCase(), pageWidth - 15, currentY + 13, { align: 'right' });

  // Legal Note
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  const footerText = 'Bukti pembayaran ini sah dan diterbitkan secara elektronik oleh sistem SIMKEU NH. Harap simpan dokumen ini sebagai bukti transaksi yang valid.';
  doc.text(doc.splitTextToSize(footerText, pageWidth - 30), pageWidth / 2, pageHeight - 10, { align: 'center' });

  return new Blob([doc.output('blob')], { type: 'application/pdf' });
};

export const generateArrearPdf = async (student: Student, studentArrears: Arrear[]) => {
  if (!student || studentArrears.length === 0) return null;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // --- 1. MODERN HEADER ---
  doc.setFillColor(79, 70, 229); // Indigo-600
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('STATEMENT TAGIHAN', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(199, 210, 254); // Indigo-200
  doc.text('SIMKEU NH - SISTEM MANAJEMEN KEUANGAN DIGITAL', 20, 32);
  doc.text('Pondok Pesantren Nurul Huda Pasirwangi', 20, 37);

  // TOTAL CARD (On Header)
  doc.setFillColor(255, 255, 255, 0.1);
  doc.roundedRect(pageWidth - 85, 15, 65, 30, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('TOTAL KEWAJIBAN:', pageWidth - 78, 25);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rp ${student.totalArrears.toLocaleString('id-ID')}`, pageWidth - 78, 35);
  
  // --- 2. STUDENT INFO CARD ---
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, 70, pageWidth - 40, 35, 4, 4, 'F');
  
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMASI SANTRI', 30, 80);
  doc.text('WALI MURID', pageWidth / 2 + 10, 80);
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.text(student.name, 30, 88);
  doc.text(student.parentName, pageWidth / 2 + 10, 88);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Kelas: ${student.class}`, 30, 94);
  doc.text(`WhatsApp: +${student.whatsapp}`, pageWidth / 2 + 10, 94);

  // --- 3. STATEMENT MESSAGE ---
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.text('Berikut adalah rincian kewajiban pembayaran administrasi pendidikan yang belum terselesaikan:', 20, 120);

  // --- 4. TABLE ---
  const sortedArrears = [...studentArrears].sort((a, b) => {
    const aVal = parseMonthYearString(a.month);
    const bVal = parseMonthYearString(b.month);
    if (aVal.year !== bVal.year) {
      return aVal.year - bVal.year;
    }
    return aVal.month - bVal.month;
  });

  autoTable(doc, {
    startY: 128,
    head: [['ITEM PEMBAYARAN', 'PERIODE', 'STATUS', 'NOMINAL']],
    body: [
      ...sortedArrears.map(a => [
        a.type,
        a.month,
        'MENUNGGU',
        `Rp ${a.amount.toLocaleString('id-ID')}`
      ])
    ] as any[],
    headStyles: { 
      fillColor: [79, 70, 229], 
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: { 
      fontSize: 9,
      cellPadding: 6,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: 20, right: 20 },
    theme: 'striped'
  });

  const finalY = (doc as any).lastAutoTable.finalY + 20;

  // --- 5. PAYMENT INSTRUCTIONS ---
  doc.setFillColor(238, 242, 255); // Indigo-50
  doc.roundedRect(20, finalY, pageWidth - 90, 40, 3, 3, 'F');
  
  doc.setTextColor(79, 70, 229);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('INSTRUKSI PEMBAYARAN:', 25, finalY + 10);
  
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text('1. Pembayaran dapat dilakukan via Transfer atau Cash ke Bendahara.', 25, finalY + 18);
  doc.text('2. Kirim bukti transfer melalui WhatsApp Admin SIMKEU NH.', 25, finalY + 24);
  doc.text('3. Simpan Statement ini sebagai bukti penagihan resmi.', 25, finalY + 30);

  // --- 6. DIGITAL VERIFICATION SEAL ---
  try {
    const qrData = encodeURIComponent(`SIMKEU-NH|VERIFIED|${student.name}|${student.totalArrears}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;
    const qrImg = await loadImage(qrUrl);
    
    // QR Circle Background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(pageWidth - 65, finalY, 45, 45, 5, 5, 'F');
    
    doc.addImage(qrImg, 'PNG', pageWidth - 55, finalY + 5, 25, 25);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text('VERIFIED BY', pageWidth - 42.5, finalY + 35, { align: 'center' });
    doc.text('SIMKEU NH', pageWidth - 42.5, finalY + 40, { align: 'center' });
  } catch (e) {
    console.error('Failed to load QR code', e);
  }

  // --- 7. FOOTER ---
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Dokumen ini dihasilkan secara otomatis oleh sistem keuangan digital Pondok Pesantren Nurul Huda Pasirwangi.', pageWidth / 2, 280, { align: 'center' });
  doc.text(`${new Date().getFullYear()} © SIMKEU NH Digital Assistant`, pageWidth / 2, 285, { align: 'center' });

  return doc;
};

export const printPermissionGatePass = async (student: Student, permission: StudentPermission) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a6'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Border
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.roundedRect(4, 4, pageWidth - 8, pageHeight - 8, 4, 4, 'D');

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(4, 4, pageWidth - 8, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('SURAT IZIN KELUAR', pageWidth / 2, 12, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Pondok Pesantren Nurul Huda Malati', pageWidth / 2, 17, { align: 'center' });

  // Student details
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(student.name.toUpperCase(), pageWidth / 2, 38, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Kelas: ${student.class} • Residence: ${student.residenceStatus}`, pageWidth / 2, 43, { align: 'center' });

  // Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.1);
  doc.line(10, 47, pageWidth - 10, 47);

  // Metadata block
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('JENIS IZIN:', 12, 54);
  doc.setFont('helvetica', 'normal');
  doc.text(permission.type.toUpperCase(), pageWidth - 12, 54, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('ALASAN IZIN:', 12, 60);
  doc.setFont('helvetica', 'normal');
  const reasonLines = doc.splitTextToSize(permission.reason || '-', pageWidth - 36);
  doc.text(reasonLines, pageWidth - 12, 60, { align: 'right' });

  const offsetReasonY = (reasonLines.length - 1) * 3;

  doc.setFont('helvetica', 'bold');
  doc.text('WAKTU KELUAR:', 12, 66 + offsetReasonY);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(permission.startDate).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }), pageWidth - 12, 66 + offsetReasonY, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('WAKTU KEMBALI S/D:', 12, 72 + offsetReasonY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28); // Red-700
  doc.text(new Date(permission.expectedReturnDate).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }), pageWidth - 12, 72 + offsetReasonY, { align: 'right' });

  // QR Code
  doc.setTextColor(15, 23, 42);
  const qrY = 80 + offsetReasonY;
  try {
    const qrData = encodeURIComponent(`PPNH-PERMIT|${permission.id}|${student.name.replace(/\s+/g,'_')}|${permission.type}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}`;
    const qrImg = await loadImage(qrUrl);
    doc.addImage(qrImg, 'PNG', pageWidth / 2 - 12, qrY, 24, 24);
  } catch (e) {}

  // Footer seal
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('TAMPILKAN BARCODE / SURAT INI DI GERBANG KEAMANAN', pageWidth / 2, qrY + 29, { align: 'center' });
  doc.text('SIMKEU NH Perizinan Digital PP Nurul Huda Malati', pageWidth / 2, qrY + 33, { align: 'center' });

  return new Blob([doc.output('blob')], { type: 'application/pdf' });
};
