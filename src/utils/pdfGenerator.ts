import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, Arrear } from '../types';

// Helper to load image from URL
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
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
  autoTable(doc, {
    startY: 128,
    head: [['ITEM PEMBAYARAN', 'PERIODE', 'STATUS', 'NOMINAL']],
    body: [
      ...studentArrears.map(a => [
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
