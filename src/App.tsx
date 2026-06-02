import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import { ConfirmProvider } from './context/ConfirmContext';
import { Toaster } from 'react-hot-toast';


import { RoleGuard } from './components/auth/RoleGuard';

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Login />;
  }

  const defaultRoute = user?.role === 'Keamanan' ? '/scan' : '/dashboard';

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onNotificationClick={() => navigate('/notifications')}
        />
        <main className="lg:pl-64 pt-20 px-4 md:px-8 pb-12 flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/dashboard" element={
                  <RoleGuard allowedRoles={['Super Admin', 'Bendahara', 'Auditor']}>
                    <Dashboard onNavigate={(path) => navigate(`/${path}`)} />
                  </RoleGuard>
                } />
                <Route path="/scan" element={
                  <RoleGuard allowedRoles={['Super Admin', 'Keamanan']}>
                    <PermissionScanner />
                  </RoleGuard>
                } />
                <Route path="/permissions" element={
                  <RoleGuard allowedRoles={['Super Admin', 'Keamanan']}>
                    <StudentPermissions />
                  </RoleGuard>
                } />
                <Route path="/users" element={
                  <RoleGuard allowedRoles={['Super Admin']}>
                    <UserManagement />
                  </RoleGuard>
                } />
                <Route path="/notifications" element={
                  <RoleGuard allowedRoles={['Super Admin', 'Bendahara']}>
                    <Notifications />
                  </RoleGuard>
                } />
                <Route path="/arrears" element={
                  <RoleGuard allowedRoles={['Super Admin', 'Bendahara', 'Auditor']}>
                    <ArrearsManagement />
                  </RoleGuard>
                } />
                <Route path="/students" element={
                  <RoleGuard allowedRoles={['Super Admin', 'Bendahara', 'Auditor', 'Keamanan']}>
                    <StudentManagement />
                  </RoleGuard>
                } />
                <Route path="/history" element={
                  <RoleGuard allowedRoles={['Super Admin', 'Auditor', 'Bendahara']}>
                    <FinanceHistory />
                  </RoleGuard>
                } />
                <Route path="/settings" element={
                  <RoleGuard allowedRoles={['Super Admin']}>
                    <Settings />
                  </RoleGuard>
                } />
                <Route path="/reports" element={
                  <RoleGuard allowedRoles={['Super Admin', 'Bendahara', 'Auditor']}>
                    <Reports />
                  </RoleGuard>
                } />
                <Route path="/" element={<Navigate to={defaultRoute} replace />} />
                <Route path="*" element={<Navigate to={defaultRoute} replace />} />
              </Routes>
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
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'text-sm font-bold',
          duration: 4000,
          style: {
            background: '#fff',
            color: '#0f172a',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            borderRadius: '1rem',
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
          },
          success: {
            iconTheme: {
              primary: '#059669',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#e11d48',
              secondary: '#fff',
            },
          },
        }}
      />
      <ConfirmProvider>
        <AppContent />
      </ConfirmProvider>
    </AuthProvider>
  );
}
