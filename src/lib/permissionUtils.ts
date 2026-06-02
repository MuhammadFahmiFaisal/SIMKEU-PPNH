import { StudentPermission } from '../types';

export interface EligibilityResult {
  isEligible: boolean;
  daysRemaining: number;
  lastDate: string | null;
}

/**
 * Mendapatkan status kelayakan santri untuk izin pulang (Aturan 100 Hari)
 */
export const checkPulangEligibility = (
  studentId: string, 
  allPermissions: StudentPermission[]
): EligibilityResult => {
  // Filter izin yang bersifat "Pulang" atau Kustom (Bukan Keluar Singkat)
  // Dan pastikan izin tersebut sudah terjadi (bukan dibatalkan)
  const pulangPerms = allPermissions.filter(p => 
    p.studentId === studentId && 
    p.type !== 'Keluar Singkat' && 
    p.status !== 'Dibatalkan'
  );

  if (pulangPerms.length === 0) {
    return { isEligible: true, daysRemaining: 0, lastDate: null };
  }

  // Ambil izin terakhir berdasarkan tanggal mulai
  const sorted = [...pulangPerms].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
  
  const lastPerm = sorted[0];
  const lastDate = new Date(lastPerm.startDate);
  const now = new Date();
  
  // Hitung selisih hari
  const diffTime = Math.abs(now.getTime() - lastDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const daysThreshold = 100;
  
  if (diffDays < daysThreshold) {
    return {
      isEligible: false,
      daysRemaining: daysThreshold - diffDays,
      lastDate: lastDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    };
  }

  return { 
    isEligible: true, 
    daysRemaining: 0, 
    lastDate: lastDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) 
  };
};
