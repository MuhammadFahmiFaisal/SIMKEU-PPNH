import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Login } from './screens/Login';
import { Dashboard } from './screens/Dashboard';
import { UserManagement } from './screens/UserManagement';
import { Notifications } from './screens/Notifications';
import { ArrearsManagement } from './screens/ArrearsManagement';
import { StudentManagement } from './screens/StudentManagement';
import { FinanceHistory } from './screens/FinanceHistory';
import { Settings } from './screens/Settings';
import { Reports } from './screens/Reports';
import { PermissionScanner } from './screens/PermissionScanner';
import { StudentPermissions } from './screens/StudentPermissions';
import { AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import { RoleGuard } from './components/auth/RoleGuard';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Redirect if insufficient permissions
  useEffect(() => {
    if (user?.role === 'Bendahara' && activeTab === 'users') {
      setActiveTab('dashboard');
    }
    if (user?.role === 'Keamanan' && (activeTab === 'dashboard' || activeTab === 'users' || activeTab === 'arrears' || activeTab === 'history' || activeTab === 'reports' || activeTab === 'notifications' || activeTab === 'settings')) {
      setActiveTab('scan');
    }
  }, [user?.role, activeTab]);

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <RoleGuard allowedRoles={['Super Admin', 'Bendahara', 'Auditor']}>
            <Dashboard onNavigate={setActiveTab} />
          </RoleGuard>
        );
      case 'scan':
        return (
          <RoleGuard allowedRoles={['Super Admin', 'Keamanan']}>
            <PermissionScanner />
          </RoleGuard>
        );
      case 'permissions':
        return (
          <RoleGuard allowedRoles={['Super Admin', 'Keamanan']}>
            <StudentPermissions />
          </RoleGuard>
        );
      case 'users':
        return (
          <RoleGuard allowedRoles={['Super Admin']}>
            <UserManagement />
          </RoleGuard>
        );
      case 'notifications':
        return (
          <RoleGuard allowedRoles={['Super Admin', 'Bendahara']}>
            <Notifications />
          </RoleGuard>
        );
      case 'arrears':
        return (
          <RoleGuard allowedRoles={['Super Admin', 'Bendahara', 'Auditor']}>
            <ArrearsManagement />
          </RoleGuard>
        );
      case 'students':
        return (
          <RoleGuard allowedRoles={['Super Admin', 'Bendahara', 'Auditor']}>
            <StudentManagement />
          </RoleGuard>
        );
      case 'history':
        return (
          <RoleGuard allowedRoles={['Super Admin', 'Auditor', 'Bendahara']}>
            <FinanceHistory />
          </RoleGuard>
        );
      case 'settings':
        return (
          <RoleGuard allowedRoles={['Super Admin']}>
            <Settings />
          </RoleGuard>
        );
      case 'reports':
        return (
          <RoleGuard allowedRoles={['Super Admin', 'Bendahara', 'Auditor']}>
            <Reports />
          </RoleGuard>
        );
      default:
        return user?.role === 'Keamanan' ? <PermissionScanner /> : <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onNotificationClick={() => setActiveTab('notifications')}
        />
        <main className="lg:pl-64 pt-20 px-4 md:px-8 pb-12 flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              {renderScreen()}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
