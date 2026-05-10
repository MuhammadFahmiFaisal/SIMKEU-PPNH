import { useMemo } from 'react';
import { Student, Notification, Arrear } from '../../../types';

interface UseNotificationLogicProps {
  students: Student[];
  notifications: Notification[];
  activeTab: 'pending' | 'history';
  searchQuery: string;
  filterClass: string;
  filterResidence: string;
  filterStatus: string;
  sortBy: any;
}

export const useNotificationLogic = ({
  students,
  notifications,
  activeTab,
  searchQuery,
  filterClass,
  filterResidence,
  filterStatus,
  sortBy
}: UseNotificationLogicProps) => {
  
  const filteredPending = useMemo(() => {
    return students
      .filter(s => s.totalArrears > 0)
      .filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             s.parentName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesClass = filterClass === 'Semua' || s.class === filterClass;
        const matchesResidence = filterResidence === 'Semua' || s.residenceStatus === filterResidence;
        return matchesSearch && matchesClass && matchesResidence;
      })
      .sort((a, b) => {
        if (sortBy === 'amount_desc') return b.totalArrears - a.totalArrears;
        if (sortBy === 'amount_asc') return a.totalArrears - b.totalArrears;
        if (sortBy === 'class') return a.class.localeCompare(b.class);
        return a.name.localeCompare(b.name);
      });
  }, [students, searchQuery, filterClass, filterResidence, sortBy]);

  const filteredHistory = useMemo(() => {
    return notifications
      .filter(n => {
        const matchesSearch = n.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             n.parentName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'Semua' || n.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (sortBy === 'date_asc') return dateA - dateB;
        if (sortBy === 'date_desc') return dateB - dateA;
        return a.studentName.localeCompare(b.studentName);
      });
  }, [notifications, searchQuery, filterStatus, sortBy]);

  const classes = useMemo(() => {
    return Array.from(new Set(students.map(s => s.class))).sort();
  }, [students]);

  const stats = useMemo(() => {
    return {
      pendingCount: students.filter(s => s.totalArrears > 0).length,
      successCount: notifications.filter(n => n.status === 'Berhasil').length,
      failedCount: notifications.filter(n => n.status === 'Gagal').length,
      totalCount: notifications.length
    };
  }, [students, notifications]);

  return {
    filteredPending,
    filteredHistory,
    classes,
    stats
  };
};
