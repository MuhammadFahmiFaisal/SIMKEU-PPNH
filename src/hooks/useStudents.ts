import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseService } from '../services/database.service';
import { Student } from '../types';

export function useStudents() {
  const queryClient = useQueryClient();

  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: () => databaseService.getStudents(),
  });

  const addStudentMutation = useMutation({
    mutationFn: (data: Omit<Student, 'id' | 'totalArrears'>) => databaseService.addStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Student> }) => databaseService.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: (id: string) => databaseService.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['arrears'] });
    },
  });

  const batchAddStudentsMutation = useMutation({
    mutationFn: (students: Omit<Student, 'id' | 'totalArrears'>[]) => databaseService.batchAddStudents(students),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  return {
    students: studentsQuery.data || [],
    isLoading: studentsQuery.isLoading,
    error: studentsQuery.error,
    addStudent: async (data: Omit<Student, 'id' | 'totalArrears'>) => await addStudentMutation.mutateAsync(data),
    updateStudent: async (id: string, data: Partial<Student>) => await updateStudentMutation.mutateAsync({ id, data }),
    deleteStudent: async (id: string) => await deleteStudentMutation.mutateAsync(id),
    batchAddStudents: async (students: Omit<Student, 'id' | 'totalArrears'>[]) => await batchAddStudentsMutation.mutateAsync(students),
  };
}
