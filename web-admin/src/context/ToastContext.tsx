import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSocket } from '../socket/socketClient';

export type ToastType = 'info' | 'success' | 'warning' | 'critical';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  timestamp: Date;
  read?: boolean;
}

interface ToastContextType {
  toasts: ToastMessage[];
  notifications: ToastMessage[];
  unreadCount: number;
  isMuted: boolean;
  toggleMute: () => void;
  showToast: (type: ToastType, title: string, message: string) => void;
  removeToast: (id: string) => void;
  clearUnread: () => void;
  clearAllNotifications: () => void;
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
  closeDrawer: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [notifications, setNotifications] = useState<ToastMessage[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Web Audio API Programmatic Sound Generator (Dual-Tone Chime)
  const playCriticalAlertSound = useCallback(() => {
    if (isMuted) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();

      // Osc 1 (High tone 880Hz - A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      // Osc 2 (Low tone 587.33Hz - D5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(587.33, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.6);

      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.75);
    } catch (err) {
      console.warn('Web Audio API playback prevented or unsupported:', err);
    }
  }, [isMuted]);

  const showToast = useCallback(
    (type: ToastType, title: string, message: string) => {
      const newToast: ToastMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type,
        title,
        message,
        timestamp: new Date(),
        read: false,
      };

      setToasts((prev) => [newToast, ...prev]);
      setNotifications((prev) => [newToast, ...prev]);

      if (type === 'critical') {
        playCriticalAlertSound();
      }
    },
    [playCriticalAlertSound]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const clearUnread = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => {
      const next = !prev;
      if (next) clearUnread();
      return next;
    });
  }, [clearUnread]);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  // Listen to Socket.IO real-time events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleAlertBroadcast = (data: any) => {
      showToast(
        'critical',
        '🚨 Emergency Alert Broadcast',
        data.title ? `New Alert: ${data.title}` : 'A new emergency alert has been broadcasted!'
      );
    };

    const handleCheckinNew = (data: any) => {
      const status = data.status || 'safe';
      const name = data.full_name || 'Personnel';
      const zone = data.zone_name || 'Assembly Zone';

      if (status === 'safe') {
        showToast('success', '✅ Personnel Safe', `${name} checked in safe at ${zone}`);
      } else if (status === 'need_help') {
        showToast('warning', '⚠️ Assistance Requested', `${name} needs help! ${data.message ? `"${data.message}"` : ''}`);
      } else if (status === 'injured') {
        showToast('critical', '🆘 Personnel INJURED', `${name} reported INJURED! ${data.message ? `"${data.message}"` : ''}`);
      }
    };

    const handleHazardNew = (data: any) => {
      showToast('warning', '⚠️ New Hazard Reported', `${data.type || 'Hazard'} reported at campus`);
    };

    const handleHazardResolved = (data: any) => {
      showToast('info', '✅ Hazard Resolved', `${data.type || 'Hazard'} has been marked as resolved`);
    };

    socket.on('alert:broadcast', handleAlertBroadcast);
    socket.on('checkin:new', handleCheckinNew);
    socket.on('hazard:new', handleHazardNew);
    socket.on('hazard:resolved', handleHazardResolved);

    return () => {
      socket.off('alert:broadcast', handleAlertBroadcast);
      socket.off('checkin:new', handleCheckinNew);
      socket.off('hazard:new', handleHazardNew);
      socket.off('hazard:resolved', handleHazardResolved);
    };
  }, [showToast]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ToastContext.Provider
      value={{
        toasts,
        notifications,
        unreadCount,
        isMuted,
        toggleMute,
        showToast,
        removeToast,
        clearUnread,
        clearAllNotifications,
        isDrawerOpen,
        toggleDrawer,
        closeDrawer,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
