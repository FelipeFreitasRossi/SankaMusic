import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onUnauthorized, tokenStore } from '../services/api';
import { authService } from '../services/accountService';
import type { AuthResponse, User } from '../types';

interface AuthState {
  user: User | null;
  initializing: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<User>;
  logout: () => void;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  const logout = useCallback(() => {
    const had = tokenStore.get();
    tokenStore.clear();
    setUser(null);
    if (had) authService.logout().catch(() => undefined);
  }, []);

  useEffect(() => {
    onUnauthorized(() => {
      tokenStore.clear();
      setUser(null);
    });
    if (!tokenStore.get()) {
      setInitializing(false);
      return;
    }
    authService
      .me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setInitializing(false));
  }, []);

  const handleAuth = (res: AuthResponse) => {
    tokenStore.set(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const value = useMemo<AuthState>(
    () => ({
      user,
      initializing,
      isAdmin: user?.role === 'admin',
      login: async (email, password) => handleAuth(await authService.login(email, password)),
      register: async (data) => handleAuth(await authService.register(data)),
      logout,
      setUser,
    }),
    [user, initializing, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
