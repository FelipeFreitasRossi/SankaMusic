import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '../components/ui/Feedback';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth();
  const location = useLocation();
  if (initializing) return <Spinner label="Verificando sua sessão..." />;
  if (!user) return <Navigate to={`/entrar?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <>{children}</>;
}

/** A verificação real de permissão acontece no backend; aqui apenas evitamos exibir a área. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAdmin, initializing } = useAuth();
  const location = useLocation();
  if (initializing) return <Spinner label="Verificando permissões..." />;
  if (!user) return <Navigate to={`/entrar?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
