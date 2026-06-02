import { useAuth } from '../context/AuthContext';
import { useStudents } from './useStudents';
import { generatePaymentReceiptMessage, generateConsolidatedReceiptMessage, formatPhoneNumber } from '../lib/whatsapp';
import { generateReceiptPDF } from '../lib/pdfGenerator';

export function useReceipts() {
  const { user } = useAuth();
  const { students } = useStudents();

  const sendPaymentReceipt = async (studentId: string, amount: number, paymentType: string, month: string) => {
    const s = students.find(x => x.id === studentId);
    if (!s) return;

    const phone = formatPhoneNumber(s.whatsapp);
    const message = generatePaymentReceiptMessage(s.name, s.class, paymentType, month, amount, user?.name || 'Bendahara');
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const sendConsolidatedReceipt = async (studentId: string, payments: { type: string, month: string, amount: number }[]) => {
    const s = students.find(x => x.id === studentId);
    if (!s || payments.length === 0) return;

    const phone = formatPhoneNumber(s.whatsapp);
    const detailsList = payments.map(p => `- ${p.type} (${p.month}): Rp ${p.amount.toLocaleString('id-ID')}`).join('\n');
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    const message = generateConsolidatedReceiptMessage(s.name, s.class, detailsList, totalPaid, user?.name || 'Bendahara');
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const previewReceiptPDF = async (studentId: string, payments: { type: string, month: string, amount: number }[]) => {
    const s = students.find(x => x.id === studentId);
    if (!s || payments.length === 0) return;

    try {
      const blob = await generateReceiptPDF(s, payments, user?.name || 'Bendahara');
      const fileName = `Struk_${s.name.replace(/\s+/g, '_')}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });
      const url = URL.createObjectURL(file);
      const newWindow = window.open(url, '_blank');

      if (newWindow) {
        setTimeout(() => {
          try { newWindow.document.title = fileName; } catch (e) { }
        }, 500);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
      }
    } catch (err) {
      console.error('PDF Preview Error:', err);
    }
  };

  return { sendPaymentReceipt, sendConsolidatedReceipt, previewReceiptPDF };
}
