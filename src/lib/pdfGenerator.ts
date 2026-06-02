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

export const getStudentAddress = (studentId: string): string => {
  const cities = ['Cirebon', 'Kuningan', 'Majalengka', 'Indramayu', 'Brebes', 'Tegal', 'Pemalang'];
  const districts = ['Lemahabang', 'Beber', 'Sindanglaut', 'Astanaajapura', 'Karangsembung', 'Sumber', 'Palimanan'];

  let sum = 0;
  for (let i = 0; i < studentId.length; i++) {
    sum += studentId.charCodeAt(i);
  }
  const city = cities[sum % cities.length];
  const district = districts[(sum + 3) % districts.length];

  return `${district}, ${city}`.toUpperCase();
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
  doc.text('Pondok Pesantren Nurul Huda Malati Pasirwangi', 20, 40);

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
    const qrData = encodeURIComponent(`SIMKEU-NH|CLEARANCE|${docRef}|${student.name.replace(/\s+/g, '_')}|${isClear ? 'LUNAS' : 'DISPENSASI'}`);
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

  // Optional: Add label if extended
  if (permission.notes?.toLowerCase().includes('diperpanjang')) {
    doc.setFontSize(10);
    doc.setTextColor(185, 28, 28); // Red 700
    doc.setFont('helvetica', 'bold');
    doc.text('*** IZIN INI TELAH DIPERPANJANG ***', pageWidth / 2, pageHeight - 25, { align: 'center' });
  }

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
  doc.text('Pondok Pesantren Nurul Huda Malati Pasirwangi', 15, 25);

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
  } catch (e) { }

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

export const printPermissionGatePass = async (
  student: Student,
  permission: StudentPermission,
  allPermissions: StudentPermission[] = [],
  allArrears: Arrear[] = []
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 148
  const pageHeight = doc.internal.pageSize.getHeight(); // 210

  // We will track curY. When adding a page or at the end, we draw borders and footers on all pages.
  let curY = 16;

  // Kop Surat (Letterhead)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(15, 23, 42);
  doc.text('PONDOK PESANTREN NURUL HUDA MALATI', pageWidth / 2, curY, { align: 'center' });
  curY += 5;

  doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  doc.text('DIVISI PERIZINAN & KEDISIPLINAN SANTRI', pageWidth / 2, curY, { align: 'center' });
  curY += 4;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139);
  doc.text('Jl. Pasirwangi Ds. Padaasih, Kp. Malati RT. 004 RW. 005, Kec. Pasirwangi, Kab. Garut, Jawa Barat', pageWidth / 2, curY, { align: 'center' });
  curY += 4;

  // Garis Pembatas Kop Surat (Official Double Divider)
  doc.setDrawColor(15, 23, 42); doc.setLineWidth(0.6);
  doc.line(12, curY, pageWidth - 12, curY);
  doc.setLineWidth(0.2);
  doc.line(12, curY + 1.2, pageWidth - 12, curY + 1.2);
  curY += 8;

  // Judul & Nomor Surat
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(15, 23, 42);
  doc.text('SURAT IZIN KELUAR PESANTREN', pageWidth / 2, curY, { align: 'center' });
  curY += 4;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(71, 85, 105);
  const refNo = `Nomor: PPNH/PERIZINAN/${permission.id.substring(0, 6).toUpperCase()}/${new Date(permission.startDate).getFullYear()}`;
  doc.text(refNo, pageWidth / 2, curY, { align: 'center' });
  curY += 8;

  // Paragraf Pengantar Formal (Wrapped perfectly within margins)
  doc.setFontSize(8.5); doc.setTextColor(15, 23, 42);
  const introText = doc.splitTextToSize('Berdasarkan permohonan dan hasil verifikasi sistem perizinan, diberikan izin keluar kepada santri:', pageWidth - 24);
  introText.forEach((line: string) => {
    doc.text(line, 12, curY);
    curY += 5;
  });
  curY += 2;

  // Tabel Data Identitas Santri & Rincian Izin (Grid Presisi)
  doc.setFont('helvetica', 'bold'); doc.text('Nama Lengkap', 15, curY); doc.setFont('helvetica', 'normal'); doc.text(': ' + student.name.toUpperCase(), 48, curY); curY += 5;
  doc.setFont('helvetica', 'bold'); doc.text('Kelas / Asrama', 15, curY); doc.setFont('helvetica', 'normal'); doc.text(': Kelas ' + student.class + ' (' + student.residenceStatus + ')', 48, curY); curY += 5;
  const studentPerms = allPermissions
    .filter(p => p.studentId === student.id)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const permitIndex = studentPerms.findIndex(p => p.id === permission.id);
  const permitSequenceNumber = permitIndex >= 0 ? permitIndex + 1 : studentPerms.length + 1;

  const unpaidArrearsTop = allArrears.filter(a => a.studentId === student.id && a.status !== 'Lunas');
  const hasArrears = unpaidArrearsTop.length > 0;
  const freqLabel = hasArrears ? `: Izin Ke-${permitSequenceNumber} (Jalur Dispensasi Bendahara)` : `: Izin Ke-${permitSequenceNumber} (Tercatat di Sistem)`;

  doc.setFont('helvetica', 'bold'); doc.text('Jenis Izin', 15, curY); doc.setFont('helvetica', 'normal'); doc.text(': ' + permission.type.toUpperCase(), 48, curY); curY += 5;
  doc.setFont('helvetica', 'bold'); doc.text('Frekuensi Izin', 15, curY); doc.setFont('helvetica', 'normal'); doc.text(freqLabel, 48, curY); curY += 5;

  doc.setFont('helvetica', 'bold'); doc.text('Waktu Keluar', 15, curY); doc.setFont('helvetica', 'normal'); doc.text(': ' + new Date(permission.startDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }), 48, curY); curY += 5;

  doc.setFont('helvetica', 'bold'); doc.text('Wajib Kembali s/d', 15, curY); doc.setFont('helvetica', 'bold'); doc.setTextColor(185, 28, 28); doc.text(': ' + new Date(permission.expectedReturnDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }), 48, curY); doc.setTextColor(15, 23, 42); curY += 5;

  doc.setFont('helvetica', 'bold'); doc.text('Alasan Keluar', 15, curY); doc.setFont('helvetica', 'normal');
  const reasonWrapped = doc.splitTextToSize(': ' + (permission.reason || '-'), pageWidth - 60);
  reasonWrapped.forEach((line: string) => {
    doc.text(line, 48, curY);
    curY += 5;
  });
  curY += 4;

  // Function to handle page break check
  const checkPageBreak = (neededHeight: number) => {
    if (curY + neededHeight > pageHeight - 16) {
      doc.addPage();
      curY = 16;
    }
  };

  // --- SEKSI RIWAYAT KEDISIPLINAN ---
  checkPageBreak(26);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(15, 23, 42);
  doc.text('A. CATATAN EVALUASI KEDISIPLINAN', 12, curY);
  curY += 4;

  const pastPerms = allPermissions
    .filter(p => p.studentId === student.id && p.id !== permission.id && (p.status === 'Kembali' || p.status === 'Terlambat'))
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const lastPerm = pastPerms[0];

  let histTitle = 'Status Riwayat: Bersih (Izin Perdana)';
  let histBody = 'Santri belum memiliki rekam jejak pelanggaran keterlambatan. Harap kembali ke pesantren tepat waktu sesuai jadwal.';
  let bgHist = [248, 250, 252]; // slate-50
  let borderHist = [226, 232, 240]; // slate-200
  let textHist = [51, 65, 85]; // slate-700

  if (lastPerm) {
    if (lastPerm.status === 'Kembali') {
      histTitle = 'Status Riwayat: Tepat Waktu (Disiplin Baik)';
      histBody = 'Apresiasi: Pada izin sebelumnya, santri kembali tepat waktu. Terima kasih telah mematuhi kedisiplinan dan menjaga amanah pesantren.';
      bgHist = [236, 253, 245]; // emerald-50
      borderHist = [167, 243, 208]; // emerald-200
      textHist = [6, 78, 59]; // emerald-900
    } else if (lastPerm.status === 'Terlambat') {
      histTitle = 'Status Riwayat: Terlambat (Dalam Pantauan)';
      histBody = 'Peringatan: Pada izin sebelumnya, santri tercatat terlambat kembali. Teguran keras diberikan agar tidak mengulangi pelanggaran batas waktu kembali.';
      bgHist = [255, 251, 235]; // amber-50
      borderHist = [253, 230, 138]; // amber-200
      textHist = [120, 53, 15]; // amber-900
    }
  }

  const histLines = doc.splitTextToSize(histBody, pageWidth - 28);
  const histBoxH = 10 + histLines.length * 4;

  doc.setFillColor(bgHist[0], bgHist[1], bgHist[2]);
  doc.setDrawColor(borderHist[0], borderHist[1], borderHist[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, curY, pageWidth - 24, histBoxH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(textHist[0], textHist[1], textHist[2]);
  doc.text(histTitle, 16, curY + 6);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  histLines.forEach((l: string, i: number) => {
    doc.text(l, 16, curY + 11 + i * 4);
  });

  curY += histBoxH + 8;

  // --- SEKSI STATUS ADMINISTRASI KEUANGAN ---
  const unpaidArrears = allArrears.filter(a => a.studentId === student.id && a.status !== 'Lunas');
  const totalArrears = unpaidArrears.reduce((sum, a) => sum + a.amount, 0);

  checkPageBreak(20);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(15, 23, 42);
  doc.text('B. STATUS ADMINISTRASI KEUANGAN', 12, curY);
  curY += 4;

  if (totalArrears === 0) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.setLineWidth(0.3);
    doc.roundedRect(12, curY, pageWidth - 24, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(6, 78, 59);
    doc.text('Status Administrasi: Lunas', 16, curY + 6);
    doc.setFont('helvetica', 'normal');
    doc.text('Seluruh kewajiban administrasi keuangan santri telah diselesaikan dengan lunas.', 16, curY + 11);
    doc.text('Akses perizinan diberikan sepenuhnya tanpa catatan tunggakan.', 16, curY + 15);
    curY += 26;
  } else {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.setLineWidth(0.3);
    doc.roundedRect(12, curY, pageWidth - 24, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(153, 27, 27);
    doc.text('Status Administrasi: Dispensasi Bendahara', 16, curY + 6);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(127, 29, 29);
    doc.text(`Alasan Dispensasi: ${student.dispensationReason || 'Telah mendapat izin khusus/dispensasi dari bendahara pesantren.'}`, 16, curY + 11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rincian Tunggakan Belum Dibayar (Total: Rp ${totalArrears.toLocaleString('id-ID')}):`, 16, curY + 16);

    curY += 24;

    const tableBody = unpaidArrears.map((a, idx) => [
      (idx + 1).toString(),
      a.type,
      a.month,
      `Rp ${a.amount.toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
      startY: curY,
      head: [['NO', 'JENIS TUNGGAKAN', 'PERIODE', 'NOMINAL']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [153, 27, 27], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
      margin: { left: 12, right: 12, top: 16, bottom: 16 },
      didDrawPage: () => { }
    });

    curY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Tanda Tangan Block & QR Code
  checkPageBreak(24);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(15, 23, 42);
  const dateStr = `Malati, ${new Date(permission.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  doc.text(dateStr, pageWidth - 16, curY, { align: 'right' });
  doc.text('Petugas Bagian Perizinan,', pageWidth - 16, curY + 4, { align: 'right' });

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(15, 23, 42);
  doc.text('( Ust. Yudiman)', pageWidth - 16, curY + 22, { align: 'right' });
  doc.setDrawColor(15, 23, 42); doc.setLineWidth(0.2);
  doc.line(pageWidth - 62, curY + 23, pageWidth - 16, curY + 23);

  try {
    const qrData = encodeURIComponent(`PPNH-PERMIT|${permission.id}|${student.name.replace(/\s+/g, '_')}|${permission.type}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}`;
    const qrImg = await loadImage(qrUrl);
    doc.addImage(qrImg, 'PNG', 16, curY - 2, 25, 25);
  } catch (e) { }

  // Apply Borders & Footers on ALL pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Outer Border
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.rect(6, 6, pageWidth - 12, pageHeight - 12);

    // Footer Security Warning
    if (p === totalPages) {
      doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
      doc.text('DOKUMEN INI SAH SECARA DIGITAL. WAJIB DITUNJUKKAN KEPADA PETUGAS PIKET POS ATAU BAGIAN PERIZINAN.', pageWidth / 2, pageHeight - 14, { align: 'center' });
      doc.text('SIMKEU NH Portal Administrasi & Perizinan PP Nurul Huda Malati', pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // Page Number
    doc.setFontSize(6);
    doc.text(`Halaman ${p} dari ${totalPages}`, pageWidth - 12, pageHeight - 8, { align: 'right' });
  }

  return new Blob([doc.output('blob')], { type: 'application/pdf' });
};

export const printPermissionExtensionPass = async (
  student: Student,
  permission: StudentPermission,
  durationText: string,
  extensionReason: string
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let curY = 16;

  // 1. Kop Surat
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(15, 23, 42);
  doc.text('PONDOK PESANTREN NURUL HUDA MALATI', pageWidth / 2, curY, { align: 'center' });
  curY += 5;

  doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  doc.text('DIVISI PERIZINAN & KEDISIPLINAN SANTRI', pageWidth / 2, curY, { align: 'center' });
  curY += 4;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139);
  doc.text('Jl. Pasirwangi Ds. Padaasih, Kp. Malati RT. 004 RW. 005, Kec. Pasirwangi, Kab. Garut, Jabar', pageWidth / 2, curY, { align: 'center' });
  curY += 4;

  // Lines
  doc.setDrawColor(15, 23, 42); doc.setLineWidth(0.6);
  doc.line(12, curY, pageWidth - 12, curY);
  doc.setLineWidth(0.2);
  doc.line(12, curY + 1.2, pageWidth - 12, curY + 1.2);
  curY += 10;

  // 2. Title
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(15, 23, 42);
  doc.text('SURAT KETERANGAN PERPANJANGAN IZIN', pageWidth / 2, curY, { align: 'center' });
  curY += 5;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(71, 85, 105);
  const refNo = `Nomor: ${new Date().getFullYear()}/EXT-IZIN/PPNH/${permission.id.substring(0, 5).toUpperCase()}`;
  doc.text(refNo, pageWidth / 2, curY, { align: 'center' });
  curY += 10;

  // 3. Statement Paragraph
  doc.setFontSize(8.5); doc.setTextColor(15, 23, 42);
  const introText = doc.splitTextToSize('Berdasarkan permohonan yang diajukan oleh wali santri dan hasil verifikasi sistem kedisplinan, maka Pengurus Pesantren memberikan persetujuan penambahan waktu izin kepada:', pageWidth - 30);
  introText.forEach((line: string) => {
    doc.text(line, 15, curY);
    curY += 4.5;
  });
  curY += 5;

  // 4. Student Data Table
  const drawRow = (label: string, value: string, y: number, isBoldValue = false) => {
    doc.setFont('helvetica', 'bold'); doc.text(label, 18, y);
    if (isBoldValue) doc.setFont('helvetica', 'bold'); else doc.setFont('helvetica', 'normal');
    doc.text(': ' + value, 55, y);
  };

  drawRow('Nama Lengkap', student.name.toUpperCase(), curY); curY += 5;
  drawRow('Kelas / Asrama', student.class + ' (' + student.residenceStatus + ')', curY); curY += 5;
  
  // Clean up main reason from system tags for display
  const displayMainReason = (permission.reason || '-').replace(/\[.*?\]\s*/g, '').trim();
  drawRow('Izin Utama', `${permission.type} (${displayMainReason})`, curY); curY += 5;
  drawRow('Tanggal Keluar', new Date(permission.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), curY); curY += 8;

  // 5. Extension Details (Highlighted)
  doc.setFillColor(248, 250, 252);
  doc.rect(15, curY - 4, pageWidth - 30, 26, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, curY - 4, pageWidth - 30, 26, 'D');

  // Clean up extension reason from system tags for display
  const displayExtReason = extensionReason.replace(/\[.*?\]\s*/g, '').replace(/:\s*/g, '').trim();
  
  drawRow('Tambahan Waktu', `+ ${durationText}`, curY); curY += 5.5;
  drawRow('Alasan Perpanjangan', displayExtReason, curY); curY += 5.5;
  
  doc.setTextColor(185, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.text('Wajib Kembali s/d', 18, curY);
  doc.text(': ' + new Date(permission.expectedReturnDate).toLocaleString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) + ' WIB', 55, curY);
  doc.setTextColor(15, 23, 42);
  curY += 12;

  // 6. Ketentuan & Sanksi
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  doc.text('KETENTUAN KHUSUS & SANKSI:', 15, curY);
  curY += 5;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  const points = [
    `1. Surat perpanjangan ini merupakan satu kesatuan dengan Surat Izin Utama nomor ${permission.id.substring(0, 6).toUpperCase()}.`,
    '2. Santri WAJIB melampirkan kedua surat (Utama + Perpanjangan) saat melapor di gerbang pesantren.',
    '3. Batas waktu pada surat izin utama dinyatakan GUGUR dan diganti dengan batas waktu pada surat ini.',
    '4. Apabila melampaui batas waktu di atas, santri dikenakan sanksi disiplin pembangunan berupa 1 SAK SEMEN.'
  ];

  points.forEach(point => {
    const lines = doc.splitTextToSize(point, pageWidth - 35);
    lines.forEach((line: string, i: number) => {
      doc.text(line, 18, curY);
      curY += 4;
    });
    curY += 1;
  });
  curY += 4;

  // 7. Signatures
  doc.setFontSize(8);
  const dateStr = `Garut, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  doc.text(dateStr, pageWidth - 15, curY, { align: 'right' });
  doc.text('Bagian Kesantrian,', pageWidth - 15, curY + 4, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('( Ust. Yudiman )', pageWidth - 15, curY + 22, { align: 'right' });
  doc.line(pageWidth - 55, curY + 23, pageWidth - 15, curY + 23);

  // 8. QR & Verification
  try {
    const qrData = encodeURIComponent(`PPNH-EXT|${permission.id}|${student.name}|EXTENDED`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${qrData}`;
    const qrImg = await loadImage(qrUrl);
    doc.addImage(qrImg, 'PNG', 15, curY + 2, 22, 22);
  } catch (e) {}
  
  doc.setFont('helvetica', 'italic'); doc.setFontSize(6); doc.setTextColor(148, 163, 184);
  doc.text('Scan untuk validasi data sistem', 15, curY + 26);

  // 9. Frame & Footer
  doc.setDrawColor(15, 23, 42); doc.setLineWidth(0.4);
  doc.rect(7, 7, pageWidth - 14, pageHeight - 14);
  
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
  doc.text('DOKUMEN RESMI PONDOK PESANTREN NURUL HUDA MALATI - SIMKEU NH SYSTEM', pageWidth / 2, pageHeight - 10, { align: 'center' });

  return new Blob([doc.output('blob')], { type: 'application/pdf' });
};

export const printStudentIDCard = async (student: Student) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [210, 70] // Exactly 21 cm x 7 cm (Portrait F4 width)
  });

  const pageHeight = 70;

  const cardW = 86.5;
  const cardH = 54.5;
  const cardY = (pageHeight - cardH) / 2; // 7.75 mm margin from top
  const frontX = 105 - cardW - 2; // 16.5 mm
  const backX = 105 + 2; // 107 mm

  // Draw elegant page center fold guide
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(105, 2, 105, pageHeight - 2);
  doc.setLineDashPattern([], 0); // reset dash

  // ==========================================
  // 🟢 FRONT CARD DESIGN
  // ==========================================

  // 1. Deep premium dark slate background (matching review card)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(frontX, cardY, cardW, cardH, 'F');

  // 2. Elegant dark emerald geometric glassmorphic polygons
  doc.setFillColor(6, 78, 59); // emerald-900
  doc.triangle(frontX + 25, cardY + cardH, frontX + cardW, cardY + cardH, frontX + cardW, cardY + 15, 'F');

  doc.setFillColor(4, 120, 87); // emerald-700
  doc.triangle(frontX + 45, cardY + cardH, frontX + cardW, cardY + cardH, frontX + cardW, cardY + 30, 'F');

  // 3. Header Section with Logos
  try {
    const logoYayasan = await loadImage('https://res.cloudinary.com/dnnuqxs7g/image/upload/v1765536057/logo355_deq4dd.png');
    const logoPondok = await loadImage('https://res.cloudinary.com/dnnuqxs7g/image/upload/v1765542749/LOGONH_jj5r9f.png');

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(frontX + 6, cardY + 5, 18, 9, 1.5, 1.5, 'F');
    doc.addImage(logoYayasan, 'PNG', frontX + 7, cardY + 6, 7, 7);
    doc.addImage(logoPondok, 'PNG', frontX + 16, cardY + 6, 7, 7);
  } catch (e) {
    console.error('Gagal meload logo:', e);
    doc.setFillColor(245, 158, 11);
    doc.triangle(frontX + 8, cardY + 9, frontX + 11, cardY + 5, frontX + 14, cardY + 9, 'F');
  }

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(245, 158, 11); // gold
  doc.text('PONDOK PESANTREN', frontX + 26, cardY + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5); // reduced from 8.5 to prevent touching pill badge!
  doc.setTextColor(255, 255, 255);
  doc.text('NURUL HUDA MALATI', frontX + 26, cardY + 12);

  // Pill badge at top right
  doc.setFillColor(217, 119, 6); // amber-600 gold
  doc.roundedRect(frontX + cardW - 24, cardY + 6, 18, 5, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.5);
  doc.setTextColor(255, 255, 255);
  doc.text('KARTU ID SANTRI', frontX + cardW - 15, cardY + 9.2, { align: 'center' });

  // 5. Photo Slot with Beautiful Matting Border
  const photoW = 18;
  const photoH = 24;
  const photoX = frontX + 6;
  const photoY = cardY + 18;

  if (student.photoUrl) {
    try {
      // Draw image inside with 0.5 mm padding to keep the crisp white frame perfect!
      doc.addImage(student.photoUrl, 'JPEG', photoX + 0.5, photoY + 0.5, photoW - 1, photoH - 1);
    } catch (e) {
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(photoX, photoY, photoW, photoH, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(student.name.substring(0, 2).toUpperCase(), photoX + (photoW / 2), photoY + 14, { align: 'center' });
    }
  } else {
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(photoX, photoY, photoW, photoH, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(student.name.substring(0, 2).toUpperCase(), photoX + (photoW / 2), photoY + 14, { align: 'center' });
  }

  // Draw outer rounded border frame to perfectly conceal sharp corners!
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.6);
  doc.roundedRect(photoX, photoY, photoW, photoH, 1.5, 1.5, 'D');

  // 6. Identity Details
  const detailX = frontX + 27;
  const textY = cardY + 22;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  const nameStr = student.name.toUpperCase();
  const truncatedName = nameStr.length > 22 ? nameStr.substring(0, 20) + '...' : nameStr;
  doc.text(truncatedName, detailX, textY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(160, 175, 195);
  doc.text('NISN', detailX, textY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(':  ' + (student.nisn || 'BELUM DI-SET').toUpperCase(), detailX + 13, textY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(160, 175, 195);
  doc.text('TTL', detailX, textY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const ttlStr = (student.tempatLahir && student.tanggalLahir) ? `${student.tempatLahir}, ${student.tanggalLahir}` : 'BELUM DI-SET';
  doc.text(':  ' + ttlStr.toUpperCase(), detailX + 13, textY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(160, 175, 195);
  doc.text('ALAMAT', detailX, textY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const alamatStr = student.alamat || 'BELUM DI-SET';
  const truncatedAlamat = alamatStr.length > 28 ? alamatStr.substring(0, 26) + '...' : alamatStr;
  doc.text(':  ' + truncatedAlamat.toUpperCase(), detailX + 13, textY + 16);

  // 7. Footer divider
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.line(frontX + 6, cardY + 44, frontX + cardW - 6, cardY + 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(160, 175, 195);
  doc.text('SISTEM INTEGRASI KEUANGAN', frontX + 6, cardY + 48);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(245, 158, 11); // gold
  doc.text('SIMKEU NH', frontX + 6, cardY + 51.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(160, 175, 195);
  doc.text('BARCODE KEY ID', frontX + cardW - 6, cardY + 48, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(student.barcodeId || 'PPNH-' + student.id.substring(0, 8).toUpperCase(), frontX + cardW - 6, cardY + 51.5, { align: 'right' });


  // ==========================================
  // 🔵 BACK CARD DESIGN
  // ==========================================

  // 1. Deep premium dark slate background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(backX, cardY, cardW, cardH, 'F');

  // 2. Elegant dark emerald wave accent at top left
  doc.setFillColor(6, 78, 59);
  doc.triangle(backX, cardY, backX + 40, cardY, backX, cardY + 25, 'F');

  // 3. Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(245, 158, 11); // gold
  doc.text('TATA TERTIB PERIZINAN SANTRI', backX + 8, cardY + 10);

  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.3);
  doc.line(backX + 8, cardY + 11.5, backX + 48, cardY + 11.5);

  // 5. Rules list
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(241, 245, 249);

  const rules = [
    '1. Kartu ini wajib dibawa saat izin keluar & kembali.',
    '2. Wajib melakukan scan di Pos Keamanan Gerbang.',
    '3. Terlambat kembali akan dikenakan sanksi disiplin.',
    '4. Kartu ID tidak boleh dipinjamkan / disalahgunakan.',
    '5. Kehilangan kartu harap lapor ke bagian keamanan.'
  ];

  rules.forEach((rule, idx) => {
    doc.text(rule, backX + 8, cardY + 17 + (idx * 5));
  });

  // 6. QR Code
  const qrBoxW = 21;
  const qrBoxH = 21;
  const qrBoxX = backX + cardW - qrBoxW - 8;
  const qrBoxY = cardY + 15;

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 2, 2, 'F');

  try {
    const qrData = encodeURIComponent(student.barcodeId || student.id);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}`;
    const qrImg = await loadImage(qrUrl);
    doc.addImage(qrImg, 'PNG', qrBoxX + 1.5, qrBoxY + 1.5, qrBoxW - 3, qrBoxH - 3);
  } catch (e) {
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(qrBoxX + 3, qrBoxY + 3, qrBoxX + qrBoxW - 3, qrBoxY + qrBoxH - 3);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text('SCAN UNTUK IZIN', qrBoxX + (qrBoxW / 2), qrBoxY + qrBoxH + 4, { align: 'center' });

  // 7. Footer Divider & Stamp
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.line(backX + 8, cardY + 44, backX + cardW - 8, cardY + 44);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(245, 158, 11);
  doc.text('SIMKEU NH', backX + 8, cardY + 48.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(160, 175, 195);
  doc.text('Sistem Administrasi Keuangan & Perizinan', backX + 8, cardY + 51.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(160, 175, 195);
  doc.text('OTORISASI SISTEM DIGITAL', backX + cardW - 8, cardY + 51.5, { align: 'right' });

  return new Blob([doc.output('blob')], { type: 'application/pdf' });
};

