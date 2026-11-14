import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { favoriteService } from '../services/accountService';
import { storage } from '../utils/storage';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { errorMessage } from '../services/api';

const KEY = 'sanka.favorites';

interface FavoritesState {
  ids: string[];
  count: number;
  isFavorite: (id: string) => boolean;
  toggle: (id: string, name?: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesState | null>(null);

/**
 * Favoritos funcionam sem login (localStorage). Ao entrar, a lista local é
 * mesclada com a conta e passa a ser sincronizada com o servidor.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const [ids, setIds] = useState<string[]>(() => storage.get<string[]>(KEY, []));
  const syncedFor = useRef<string | null>(null);

  useEffect(() => storage.set(KEY, ids), [ids]);

  useEffect(() => {
    if (!user) {
      syncedFor.current = null;
      return;
    }
    if (syncedFor.current === user.id) return;
    syncedFor.current = user.id;
    favoriteService
      .sync(storage.get<string[]>(KEY, []))
      .then((products) => setIds(products.map((p) => p.id)))
      .catch(() => undefined);
  }, [user]);

  const toggle = useCallback(
    async (id: string, name?: string) => {
      const was = ids.includes(id);
      setIds((cur) => (was ? cur.filter((x) => x !== id) : [id, ...cur]));
      try {
        if (user) await (was ? favoriteService.remove(id) : favoriteService.add(id));
        toast.success(was ? 'Removido dos favoritos.' : `${name ? `"${name}" adicionado` : 'Adicionado'} aos favoritos.`);
      } catch (e) {
        setIds((cur) => (was ? [id, ...cur] : cur.filter((x) => x !== id)));
        toast.error(errorMessage(e));
      }
    },
    [ids, user, toast],
  );

  const value = useMemo<FavoritesState>(
    () => ({ ids, count: ids.length, isFavorite: (id) => ids.includes(id), toggle }),
    [ids, toggle],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites deve ser usado dentro de FavoritesProvider');
  return ctx;
}
