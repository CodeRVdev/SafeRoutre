import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../api/auth';
import { connectSocket, disconnectSocket } from '../socket/socketClient';

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthorized: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('saferoute_jwt_token'));
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('saferoute_user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const ALLOWED_ROLES = ['admin', 'coordinator'];
  const isAuthorized = !!user && ALLOWED_ROLES.includes(user.role.toLowerCase());

  useEffect(() => {
    if (token && isAuthorized) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }
  }, [token, isAuthorized]);

  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };
    window.addEventListener('saferoute:auth_expired', handleAuthExpired);
    return () => window.removeEventListener('saferoute:auth_expired', handleAuthExpired);
  }, []);

  const login = (newToken: string, newUser: UserProfile) => {
    localStorage.setItem('saferoute_jwt_token', newToken);
    localStorage.setItem('saferoute_user_profile', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('saferoute_jwt_token');
    localStorage.removeItem('saferoute_user_profile');
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token && !!user,
        isAuthorized,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
