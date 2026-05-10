import { useMemo } from 'react';
import { Student } from '../../../types';

interface UseStudentLogicProps {
  students: Student[];
  searchQuery: string;
  selectedClass?: string;
}

export const useStudentLogic = ({ students, searchQuery, selectedClass }: UseStudentLogicProps) => {
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.class.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClass = selectedClass && selectedClass !== 'Semua Kelas' ? s.class === selectedClass : true;
      return matchSearch && matchClass;
    });
  }, [students, searchQuery, selectedClass]);

  return {
    filteredStudents
  };
};
