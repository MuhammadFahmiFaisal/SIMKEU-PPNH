export const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  return cleaned;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 9 && 
         cleaned.length <= 15 && 
         (cleaned.startsWith('08') || cleaned.startsWith('62') || cleaned.startsWith('8') || cleaned.startsWith('02') || cleaned.startsWith('03'));
};

export const generateArrearNotificationMessage = (
  studentName: string, 
  studentClass: string, 
  details: string, 
  totalAmount: number
): string => {
  return `*SURAT TAGIHAN RESMI*
*SIMKEU Nurul Huda*

Kepada Yth.
Bapak/Ibu Wali dari *${studentName}*
Kelas: ${studentClass}

Assalamu'alaikum wr. wb.

Melalui pesan ini, kami ingin menginformasikan bahwa terdapat rincian tagihan administrasi yang belum diselesaikan sebagai berikut:

${details}

*Total Tagihan: Rp ${totalAmount.toLocaleString('id-ID')}*

Mohon kerjasamanya untuk segera melakukan penyelesaian pembayaran tersebut. Apabila Anda sudah melakukan pembayaran, mohon abaikan pesan ini.

Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.

Wassalamu'alaikum wr. wb.`;
};

export const generatePaymentReceiptMessage = (
  studentName: string,
  studentClass: string,
  paymentType: string,
  month: string,
  amount: number,
  officerName: string
): string => {
  const now = new Date();
  const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  const dateString = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  return `*BUKTI PEMBAYARAN RESMI*
*SIMKEU Nurul Huda*

Kami mengonfirmasi bahwa pembayaran telah diterima dengan rincian sebagai berikut:

Nama Siswa: *${studentName}*
Kelas: *${studentClass}*
Jenis Pembayaran: ${paymentType} (${month})
*Nominal: Rp ${amount.toLocaleString('id-ID')}*
Tanggal: ${dateString} (${timeString})
Petugas: ${officerName}

_Keterangan:_
_Pesan ini merupakan bukti pembayaran digital yang sah. Harap simpan pesan ini sebagai dokumen arsip Anda._

Atas perhatiannya kami ucapkan terima kasih.
Wassalamu'alaikum wr. wb.`;
};

export const generateConsolidatedReceiptMessage = (
  studentName: string,
  studentClass: string,
  detailsList: string,
  totalPaid: number,
  officerName: string
): string => {
  const now = new Date();
  const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  const dateString = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  return `*BUKTI PEMBAYARAN RESMI*
*SIMKEU Nurul Huda*

Kami mengonfirmasi bahwa pembayaran telah diterima dengan rincian sebagai berikut:

Nama Siswa: *${studentName}*
Kelas: *${studentClass}*

*Rincian Pembayaran:*
${detailsList}

*Total Dibayar: Rp ${totalPaid.toLocaleString('id-ID')}*
Tanggal: ${dateString} (${timeString})
Petugas: ${officerName}

_Keterangan:_
_Pesan ini merupakan bukti pembayaran digital yang sah. Harap simpan pesan ini sebagai dokumen arsip Anda._

Atas perhatiannya kami ucapkan terima kasih.
Wassalamu'alaikum wr. wb.`;
};
