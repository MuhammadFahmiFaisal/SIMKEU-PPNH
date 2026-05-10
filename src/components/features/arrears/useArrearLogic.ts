import { useState, useMemo } from 'react';
import { Student, Arrear } from '../../../types';

interface UseArrearLogicProps {
  students: Student[];
  arrears: Arrear[];
  showPaid: boolean;
  searchQuery: string;
  filterClass: string;
  filterResidence: string;
  sortBy: 'highest' | 'lowest' | 'name';
}

export const useArrearLogic = ({
  students,
  arrears,
  showPaid,
  searchQuery,
  filterClass,
  filterResidence,
  sortBy
}: UseArrearLogicProps) => {
  const classes = useMemo(() => 
    Array.from(new Set(students.map(s => s.class))).sort(), 
  [students]);

  const groupedData = useMemo(() => {
    return students.map(student => {
      const studentArrears = arrears.filter(a => a.studentId === student.id);
      const unpaid = studentArrears.filter(a => a.status !== 'Lunas');
      const totalUnpaid = unpaid.reduce((sum, a) => sum + a.amount, 0);
      
      return {
        student,
        allArrears: studentArrears,
        unpaidArrears: unpaid,
        totalUnpaid,
        count: unpaid.length
      };
    }).filter(group => {
      // Search Filter
      const matchesSearch = group.student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            group.student.class.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Class Filter
      if (filterClass !== 'Semua' && group.student.class !== filterClass) return false;

      // Residence Filter
      if (filterResidence !== 'Semua' && group.student.residenceStatus !== filterResidence) return false;

      // Paid status filter
      return showPaid ? true : group.count > 0;
    }).sort((a, b) => {
      if (sortBy === 'highest') return b.totalUnpaid - a.totalUnpaid;
      if (sortBy === 'lowest') return a.totalUnpaid - b.totalUnpaid;
      return a.student.name.localeCompare(b.student.name);
    });
  }, [students, arrears, showPaid, searchQuery, filterClass, filterResidence, sortBy]);

  const stats = useMemo(() => {
    const totalUnpaidAll = arrears.filter(a => a.status !== 'Lunas').reduce((sum, a) => sum + a.amount, 0);
    const totalItemsUnpaid = arrears.filter(a => a.status !== 'Lunas').length;
    return { totalUnpaidAll, totalItemsUnpaid };
  }, [arrears]);

  return { groupedData, classes, stats };
};
