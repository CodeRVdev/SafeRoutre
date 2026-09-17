import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  Map,
  ShieldAlert,
  Radio,
  FileText,
  LogOut,
  User,
  School,
  Activity,
  Wifi,
  WifiOff,
  Users,
  BarChart3,
  ScrollText,
  PhoneCall,
  Calendar,
  X,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavTab =
  | 'map'
  | 'dashboard'
  | 'analytics'
  | 'alerts'
  | 'reports'
  | 'users'
  | 'activity-logs'
  | 'contacts'
  | 'drills';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  socketConnected: boolean;
}

interface NavItemConfig {
  id: NavTab;
  labelKey?: string;
  fallbackLabel: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
}

interface NavSectionConfig {
  title: string;
  items: NavItemConfig[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  setIsMobileOpen,
  socketConnected,
}) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const navSections: NavSectionConfig[] = [
    {
      title: 'Live Operations',
      items: [
        {
          id: 'map',
          labelKey: 'nav.map',
          fallbackLabel: 'Campus GIS Map',
          icon: Map,
        },
        {
          id: 'dashboard',
          labelKey: 'nav.dashboard',
          fallbackLabel: 'Emergency Monitor',
          icon: Activity,
          badge: 'Live',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        },
        {
          id: 'analytics',
          labelKey: 'nav.analytics',
          fallbackLabel: 'Evacuation Analytics',
          icon: BarChart3,
        },
      ],
    },
    {
      title: 'Incident & Response',
      items: [
        {
          id: 'alerts',
          labelKey: 'nav.alerts',
          fallbackLabel: 'Emergency Alerts',
          icon: Radio,
          badge: 'Broadcast',
          badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        },
        {
          id: 'drills',
          fallbackLabel: 'Drill Calendar',
          icon: Calendar,
        },
        {
          id: 'contacts',
          fallbackLabel: 'Emergency Hotlines',
          icon: PhoneCall,
        },
      ],
    },
    {
      title: 'Campus Administration',
      items: [
        {
          id: 'users',
          labelKey: 'nav.users',
          fallbackLabel: 'Users & Roles',
          icon: Users,
        },
        {
          id: 'reports',
          labelKey: 'nav.reports',
          fallbackLabel: 'Evacuation Reports',
          icon: FileText,
        },
        {
          id: 'activity-logs',
          labelKey: 'nav.activityLogs',
          fallbackLabel: 'Audit Logs',
          icon: ScrollText,
        },
      ],
    },
  ];

  const handleTabClick = (tab: NavTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/80 text-slate-100 select-none">
      {/* Top Branding Section */}
      <div>
        <div className="p-5 pb-4 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/20">
                <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white">SafeRoute</span>
                  <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    {user?.role?.toLowerCase() === 'coordinator' ? 'Coordinator' : (user?.role || 'Admin')}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                  <School className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate max-w-[150px]">Polonoling NHS (9505)</span>
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-230px)] custom-scrollbar">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold tracking-wider text-slate-300 uppercase">
                {section.title}
              </div>
              <div className="space-y-0.5 pt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const label = item.labelKey ? t(item.labelKey) : item.fallbackLabel;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-transparent text-white border-l-4 border-cyan-400 shadow-sm shadow-cyan-500/10'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 hover:translate-x-0.5'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-1.5 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                              : 'bg-slate-900 text-slate-400 group-hover:text-cyan-400 group-hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="truncate">{label}</span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        {item.badge && (
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Bottom Footer: Status + User Profile + Logout */}
      <div className="p-3 border-t border-slate-800/80 space-y-3 bg-slate-950/90">
        {/* Real-time Socket Indicator */}
        <div
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-medium border ${
            socketConnected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              {socketConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  socketConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
            </span>
            <span className="font-semibold">{socketConnected ? 'Socket.IO Online' : 'Connecting...'}</span>
          </div>
          {socketConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
        </div>

        {/* User Card with Quick Logout */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800/80">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/30 to-blue-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {user?.full_name || 'Safety Coordinator'}
              </p>
              <p className="text-[10px] text-cyan-400/80 font-medium capitalize truncate">
                {user?.role || 'Coordinator'} • {user?.department || 'DRRM'}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl animate-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
