import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseService } from '../services/database.service';
import { useAuth } from '../context/AuthContext';

export function useTransactions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const transactionsQuery = useQuery({
    queryKey: ['transactions'],
    queryFn: () => databaseService.getTransactions(),
  });

  const addDepositMutation = useMutation({
    mutationFn: async ({ amount, category, recipient, notes }: { amount: number; category: string; recipient: string; notes: string }) => {
      await databaseService.logTransaction({
        studentId: null,
        studentName: 'Sistem (Setoran)',
        type: 'Setoran',
        amount: amount,
        paymentCategory: category,
        description: `Setor ke ${recipient}: ${notes}`,
        performedBy: user?.name || 'Sistem'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async ({ amount, category, notes }: { amount: number; category: string; notes: string }) => {
      await databaseService.logTransaction({
        studentId: null,
        studentName: 'Sistem (Pengeluaran)',
        type: 'Pengeluaran',
        amount: amount,
        paymentCategory: category,
        description: notes,
        performedBy: user?.name || 'Sistem'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  return {
    transactions: transactionsQuery.data || [],
    isLoading: transactionsQuery.isLoading,
    addDeposit: async (amount: number, category: string, recipient: string, notes: string) => await addDepositMutation.mutateAsync({ amount, category, recipient, notes }),
    addExpense: async (amount: number, category: string, notes: string) => await addExpenseMutation.mutateAsync({ amount, category, notes }),
  };
}
