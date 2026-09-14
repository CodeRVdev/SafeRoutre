import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { MapPage } from './pages/MapPage';
import { DashboardPage } from './pages/DashboardPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { EmergencyContactsPage } from './pages/EmergencyContactsPage';
import { DrillCalendarPage } from './pages/DrillCalendarPage';
import { ShieldAlert, LogOut } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, isAuthorized, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'map' | 'dashboard' | 'alerts' | 'reports' | 'users' | 'analytics' | 'activity-logs' | 'contacts' | 'drills'>('map');

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Permission boundary: Reject student, faculty, staff roles attempting to access web admin
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl border border-rose-500/40 text-center max-w-md space-y-4">
          <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Forbidden</h2>
          <p className="text-xs text-slate-300">
            Web Admin Portal access is restricted to Administrators and Safety Coordinators. Your account role is{' '}
            <strong className="text-rose-400 uppercase font-bold">{user?.role}</strong>.
          </p>
          <button
            onClick={logout}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl mx-auto shadow-lg shadow-rose-600/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Return to Login</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'map' && <MapPage />}
      {activeTab === 'dashboard' && <DashboardPage />}
      {activeTab === 'analytics' && <AnalyticsPage />}
      {activeTab === 'alerts' && <AlertsPage />}
      {activeTab === 'reports' && <ReportsPage />}
      {activeTab === 'users' && <UsersPage />}
      {activeTab === 'activity-logs' && <ActivityLogPage />}
      {activeTab === 'contacts' && <EmergencyContactsPage />}
      {activeTab === 'drills' && <DrillCalendarPage />}
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
