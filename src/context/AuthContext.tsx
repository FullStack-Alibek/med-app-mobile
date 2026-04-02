import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AuthUser,
  login as doLogin,
  register as doRegister,
  getMe,
  logout as doLogout,
  getToken,
} from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { name: string; surname: string; phone: string; username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // App ochilganda tokenni tekshirish
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getToken();
      if (token) {
        const userData = await getMe();
        setUser(userData);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (username: string, password: string) => {
    const data = await doLogin({ username, password });
    setUser(data.user);
  }, []);

  const register = useCallback(async (body: { name: string; surname: string; phone: string; username: string; password: string }) => {
    const data = await doRegister(body);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await doLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
