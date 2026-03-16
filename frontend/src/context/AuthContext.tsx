'use client';

import {
  createContext, useContext, useEffect,
  useState, useCallback, ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  AuthUser, saveSession, clearSession,
  getToken, getUser, isAuthenticated,
} from '@/lib/auth';

interface AuthContextType {
  user:     Omit<AuthUser, 'exp'> | null;
  loading:  boolean;
  login:    (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout:   () => void;
  isAdmin:  boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user,    setUser]    = useState<Omit<AuthUser, 'exp'> | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Rehydrate session on mount
 useEffect(() => {
  const checkAuth = () => {
    if (isAuthenticated()) {
      const user = getUser();
      if (user) {
        setUser(user);
      }
    } else {
      clearSession();
      setUser(null);
    }
    setLoading(false);
  };

  checkAuth();
}, []);


  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    saveSession(data.token, data.user);
    setUser(data.user);
    // Use window.location for a hard redirect so the middleware
    // cookie is picked up immediately on the next request
    const dest = data.user.role === 'admin' ? '/admin' : '/dashboard';
    window.location.href = dest;
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/register', { email, password });
    saveSession(data.token, data.user);
    setUser(data.user);
    window.location.href = '/dashboard';
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
 