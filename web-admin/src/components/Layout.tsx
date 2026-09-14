import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import { getSocket } from '../socket/socketClient';
import { ToastContainer } from './Toast/ToastContainer';
import { NotificationDrawer } from './Toast/NotificationDrawer';
import { Sidebar } from './Sidebar';
import type { NavTab } from './Sidebar';
import {
  Menu,
  Bell,
  Volume2,
  VolumeX,
  Globe,
  MapPin,
} from 'lucide-react';

interface LayoutProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const { unreadCount, isMuted, toggleMute, toggleDrawer } = useToast();
  const { i18n } = useTranslation();
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('saferoute_lang', lang);
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    setSocketConnected(socket.connected);

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  // Title and subtitle helper for top bar
  const getHeaderDetails = () => {
    switch (activeTab) {
      case 'map':
        return {
          title: 'Campus GIS Evacuation Map',
          subtitle: 'Interactive Polonoling NHS spatial hazard layers & safe zones',
          badge: 'GIS Live',
        };
      case 'dashboard':
        return {
          title: 'Live Emergency Monitoring Dashboard',
          subtitle: 'Real-time safety roster & personnel accountability',
          badge: 'Live Feed',
        };
      case 'analytics':
        return {
          title: 'Evacuation Analytics & Insights',
          subtitle: 'Statistical evaluation of campus evacuation response metrics',
          badge: 'Analytics',
        };
      case 'alerts':
        return {
          title: 'Emergency Alert Broadcast Center',
          subtitle: 'Instant multi-hazard siren & notification dispatch',
          badge: 'High Priority',
        };
      case 'drills':
        return {
          title: 'Scheduled Evacuation Drills',
          subtitle: 'Institutional disaster preparedness calendar & simulation tests',
          badge: 'Drills',
        };
      case 'contacts':
        return {
          title: 'Emergency Hotlines & Services',
          subtitle: 'Direct coordination directory with PNP, BFP, and MDRRMO',
          badge: 'Directory',
        };
      case 'reports':
        return {
          title: 'Evacuation Reports & Logs',
          subtitle: 'Historical incident audit records & PDF export generation',
          badge: 'Audit Ready',
        };
      case 'users':
        return {
          title: 'Campus Personnel & Role Directory',
          subtitle: 'Student, faculty, staff and coordinator credential administration',
          badge: 'Access Control',
        };
      case 'activity-logs':
        return {
          title: 'System Activity & Audit Logs',
          subtitle: 'Tamper-resistant audit trail of all safety coordinator and system operations',
          badge: 'System Log',
        };
      default:
        return {
          title: 'SafeRoute Control Center',
          subtitle: 'Polonoling National High School Disaster Response',
          badge: 'Admin',
        };
    }
  };

  const header = getHeaderDetails();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-cyan-500 selection:text-white">
      {/* Toast Notification Container Overlay */}
      <ToastContainer />
      <NotificationDrawer />

      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        socketConnected={socketConnected}
      />

      {/* Main Content Area Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Control & Breadcrumb Header Bar */}
        <header className="h-16 flex-shrink-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-6 flex items-center justify-between z-20">
          {/* Left: Mobile Hamburger + Current View Title */}
          <div className="flex items-center space-x-3.5 min-w-0">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate">
                  {header.title}
                </h2>
                <span className="hidden sm:inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {header.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block truncate">
                {header.subtitle}
              </p>
            </div>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Campus Coordinates Badge */}
            <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-mono">6.2882° N, 124.9676° E</span>
            </div>

            {/* Language Switcher Selector */}
            <div className="flex items-center space-x-1 bg-slate-900/90 border border-slate-800 px-2 py-1.5 rounded-xl">
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <select
                value={i18n.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
                aria-label="Select System Language"
              >
                <option value="en" className="bg-slate-900 text-white">EN</option>
                <option value="fil" className="bg-slate-900 text-white">FIL</option>
              </select>
            </div>

            {/* Siren / Notification Audio Mute Toggle Button */}
            <button
              onClick={toggleMute}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-sm shadow-rose-500/10'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
              title={isMuted ? 'Unmute Critical Audio Siren' : 'Mute Notifications & Siren Audio'}
              aria-label="Toggle Siren Audio"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Notification Bell Button with Real-Time Badge */}
            <button
              onClick={toggleDrawer}
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all relative cursor-pointer"
              title="Recent Incident & Check-In Events"
              aria-label="View notifications drawer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center animate-pulse shadow-md shadow-rose-500/40">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Page Viewport */}
        <main className="flex-1 overflow-y-auto relative bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
};
