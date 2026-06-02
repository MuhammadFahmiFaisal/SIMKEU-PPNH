import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseService } from '../services/database.service';
import { StudentPermission } from '../types';

export function usePermissions() {
  const queryClient = useQueryClient();

  const permissionsQuery = useQuery({
    queryKey: ['permissions'],
    queryFn: () => databaseService.getPermissions(),
  });

  const addPermissionMutation = useMutation({
    mutationFn: async (data: Omit<StudentPermission, 'id' | 'startDate' | 'status'>) => {
      return await databaseService.addPermission(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const checkInPermissionMutation = useMutation({
    mutationFn: async ({ permissionId, studentId, status, notes }: { permissionId: string; studentId: string; status: 'Kembali' | 'Terlambat'; notes?: string }) => {
      await databaseService.checkInPermission(permissionId, studentId, status, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async ({ permissionId, data }: { permissionId: string; data: Partial<StudentPermission> }) => {
      await databaseService.updatePermission(permissionId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });

  return {
    permissions: permissionsQuery.data || [],
    isLoading: permissionsQuery.isLoading,
    addPermission: async (data: Omit<StudentPermission, 'id' | 'startDate' | 'status'>) => await addPermissionMutation.mutateAsync(data),
    checkInPermission: async (permissionId: string, studentId: string, status: 'Kembali' | 'Terlambat', notes?: string) => await checkInPermissionMutation.mutateAsync({ permissionId, studentId, status, notes }),
    updatePermission: async (permissionId: string, data: Partial<StudentPermission>) => await updatePermissionMutation.mutateAsync({ permissionId, data }),
  };
}
