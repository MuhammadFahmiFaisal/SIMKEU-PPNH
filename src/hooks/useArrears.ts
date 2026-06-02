import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseService } from '../services/database.service';
import { Arrear } from '../types';
import { useAuth } from '../context/AuthContext';
import { useStudents } from './useStudents';

export function useArrears() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { students } = useStudents();

  const arrearsQuery = useQuery({
    queryKey: ['arrears'],
    queryFn: () => databaseService.getArrears(),
  });

  const batchAddArrearsMutation = useMutation({
    mutationFn: async (newArrears: Omit<Arrear, 'id' | 'status'>[]) => {
      if (newArrears.length === 0) return;
      await databaseService.batchAddArrears(newArrears);
      await databaseService.logTransaction({
        studentId: null,
        studentName: 'Sistem (Massal)',
        type: 'Penambahan',
        amount: newArrears.reduce((sum, a) => sum + a.amount, 0),
        paymentCategory: newArrears[0]?.type || '',
        description: `Penambahan tagihan massal ${newArrears[0]?.type || ''} untuk ${newArrears.length} siswa`,
        performedBy: user?.name || 'Sistem'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arrears'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const updateArrearMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Arrear> }) => {
      await databaseService.updateArrear(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arrears'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const deleteArrearMutation = useMutation({
    mutationFn: async (id: string) => {
      const arrears = queryClient.getQueryData<Arrear[]>(['arrears']) || [];
      const existing = arrears.find(a => a.id === id);
      await databaseService.deleteArrear(id);
      if (existing) {
        const student = students.find(s => s.id === existing.studentId);
        await databaseService.logTransaction({
          studentId: existing.studentId,
          studentName: student?.name || 'Unknown',
          type: 'Penghapusan',
          amount: -existing.amount,
          paymentCategory: existing.type,
          description: `Hapus: ${existing.type} (${existing.month})`,
          performedBy: user?.name || 'Sistem'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arrears'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: async ({ id, paidAmount }: { id: string; paidAmount: number }) => {
      const arrears = queryClient.getQueryData<Arrear[]>(['arrears']) || [];
      const existing = arrears.find(a => a.id === id);
      if (!existing) throw new Error("Arrear not found");

      const newAmount = Math.max(0, existing.amount - paidAmount);
      const isLunas = newAmount === 0;
      const updates: Partial<Arrear> = {
        amount: newAmount,
        status: isLunas ? 'Lunas' : existing.status
      };

      await databaseService.updateArrear(id, updates);

      const student = students.find(s => s.id === existing.studentId);
      await databaseService.logTransaction({
        studentId: existing.studentId,
        studentName: student?.name || 'Unknown',
        type: isLunas ? 'Pelunasan' : 'Penyesuaian',
        amount: paidAmount,
        paymentCategory: existing.type,
        description: `${isLunas ? 'Lunas' : 'Cicilan'}: ${existing.type} (${existing.month})`,
        performedBy: user?.name || 'Sistem'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arrears'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  return {
    arrears: arrearsQuery.data || [],
    isLoading: arrearsQuery.isLoading,
    batchAddArrears: async (arrears: Omit<Arrear, 'id' | 'status'>[]) => await batchAddArrearsMutation.mutateAsync(arrears),
    updateArrear: async (id: string, data: Partial<Arrear>) => await updateArrearMutation.mutateAsync({ id, data }),
    deleteArrear: async (id: string) => await deleteArrearMutation.mutateAsync(id),
    processPayment: async (id: string, paidAmount: number) => await processPaymentMutation.mutateAsync({ id, paidAmount }),
  };
}
