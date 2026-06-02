import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseService } from '../services/database.service';
import { useStudents } from './useStudents';
import { useArrears } from './useArrears';
import { generateArrearNotificationMessage, formatPhoneNumber } from '../lib/whatsapp';

export function useNotifications() {
  const queryClient = useQueryClient();
  const { students } = useStudents();
  const { arrears } = useArrears();

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => databaseService.getNotifications(),
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const s = students.find(x => x.id === studentId);
      if (!s) return;

      const studentArrears = arrears.filter(a => a.studentId === studentId && a.status !== 'Lunas');
      const details = studentArrears.map(a => `- ${a.type} (${a.month}): Rp ${a.amount.toLocaleString('id-ID')}`).join('\n') || '- Rincian tunggakan berjalan';

      const phone = formatPhoneNumber(s.whatsapp);
      const message = generateArrearNotificationMessage(s.name, s.class, details, s.totalArrears);
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');

      await databaseService.logNotification({
        studentId: s.id,
        studentName: s.name,
        parentName: s.parentName,
        whatsapp: s.whatsapp,
        status: 'Berhasil'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const sendBroadcastNotificationMutation = useMutation({
    mutationFn: async (targetIds: string[]) => {
      const targetStudents = students.filter(s => targetIds.includes(s.id));
      let count = 0;
      for (const s of targetStudents) {
        if (s.totalArrears > 0) {
          const studentArrears = arrears.filter(a => a.studentId === s.id && a.status !== 'Lunas');
          const details = studentArrears.map(a => `- ${a.type} (${a.month}): Rp ${a.amount.toLocaleString('id-ID')}`).join('\n') || '- Rincian tunggakan berjalan';

          const phone = formatPhoneNumber(s.whatsapp);
          const message = generateArrearNotificationMessage(s.name, s.class, details, s.totalArrears);
          const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
          window.open(waUrl, '_blank');

          await databaseService.logNotification({
            studentId: s.id,
            studentName: s.name,
            parentName: s.parentName,
            whatsapp: s.whatsapp,
            status: 'Berhasil'
          });
          count++;
          // Delay to prevent browser blocking multiple popups
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      return count;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications: notificationsQuery.data || [],
    isLoading: notificationsQuery.isLoading,
    sendNotification: async (studentId: string) => await sendNotificationMutation.mutateAsync(studentId),
    sendBroadcastNotification: async (targetIds: string[]) => await sendBroadcastNotificationMutation.mutateAsync(targetIds),
  };
}
