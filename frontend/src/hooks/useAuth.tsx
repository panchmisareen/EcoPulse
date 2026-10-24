import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User } from '../types';
import { authService } from '../services/auth.service';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  updatePoints: (newPoints: number) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(authService.getUser());
  const [token, setToken] = useState<string | null>(authService.getToken());

  const login = useCallback((newToken: string, newUser: User) => {
    authService.setToken(newToken);
    authService.setUser(newUser);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    authService.setUser(updatedUser);
    setUser(updatedUser);
  }, []);

  const updatePoints = useCallback((newPoints: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, total_points: newPoints };
      authService.setUser(updated);
      return updated;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/profile');
      if (data) {
        authService.setUser(data);
        setUser(data);
      }
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      login,
      logout,
      updateUser,
      updatePoints,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
