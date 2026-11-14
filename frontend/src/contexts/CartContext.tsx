import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cartService } from '../services/accountService';
import { errorMessage } from '../services/api';
import type { CartItem, CartLine, CartQuote, CartWarning, Product, Totals } from '../types';
import { storage } from '../utils/storage';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const ITEMS_KEY = 'sanka.cart';
const SNAPSHOT_KEY = 'sanka.cart.quote';

const EMPTY_TOTALS: Totals = { subtotal: 0, discount: 0, items_total: 0, shipping_price: 0, total: 0, items_count: 0 };

interface CartState {
  items: CartItem[];
  lines: CartLine[];
  totals: Totals;
  warnings: CartWarning[];
  count: number;
  syncing: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  add: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  refresh: () => Promise<CartQuote | null>;
}

const CartContext = createContext<CartState | null>(null);

const sameItems = (a: CartItem[], b: CartItem[]) =>
  a.length === b.length && a.every((x, i) => x.product_id === b[i].product_id && x.quantity === b[i].quantity);

/**
 * Carrinho persistente (localStorage) com preços SEMPRE validados pelo backend.
 * - Visitante: POST /cart/quote
 * - Logado:   PUT /cart (salva na conta e devolve a cotação) — 1 requisição por alteração
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<CartItem[]>(() => storage.get<CartItem[]>(ITEMS_KEY, []));
  const [quote, setQuote] = useState<CartQuote | null>(() => storage.get<CartQuote | null>(SNAPSHOT_KEY, null));
  const [syncing, setSyncing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mergedFor = useRef<string | null>(null);
  const reqId = useRef(0);

  useEffect(() => storage.set(ITEMS_KEY, items), [items]);

  const applyQuote = useCallback((q: CartQuote) => {
    setQuote(q);
    storage.set(SNAPSHOT_KEY, q);
    const normalized = q.items.map((l) => ({ product_id: l.product_id, quantity: l.quantity }));
    setItems((cur) => (sameItems(cur, normalized) ? cur : normalized));
  }, []);

  const fetchQuote = useCallback(
    async (list: CartItem[], merge = false): Promise<CartQuote | null> => {
      const id = ++reqId.current;
      if (!list.length && !user) {
        const empty = { items: [], warnings: [], totals: EMPTY_TOTALS };
        setQuote(empty);
        storage.set(SNAPSHOT_KEY, empty);
        return empty;
      }
      setSyncing(true);
      try {
        const q = user ? await cartService.save(list, merge) : await cartService.quote(list);
        if (id === reqId.current) applyQuote(q);
        return q;
      } catch (e) {
        if (id === reqId.current) toast.error(errorMessage(e));
        return null;
      } finally {
        if (id === reqId.current) setSyncing(false);
      }
    },
    [user, applyQuote, toast],
  );

  // Ao entrar: mescla o carrinho local com o da conta
  useEffect(() => {
    if (!user) {
      mergedFor.current = null;
      return;
    }
    if (mergedFor.current === user.id) return;
    mergedFor.current = user.id;
    fetchQuote(storage.get<CartItem[]>(ITEMS_KEY, []), true);
  }, [user, fetchQuote]);

  // Recalcula (debounce) quando os itens mudam
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      if (!user) fetchQuote(items);
      return;
    }
    const t = setTimeout(() => fetchQuote(items), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const add = useCallback(
    (product: Product, quantity = 1) => {
      if (!product.in_stock) {
        toast.error('Produto sem estoque no momento.');
        return;
      }
      let limited = false;
      setItems((cur) => {
        const existing = cur.find((i) => i.product_id === product.id);
        const desired = (existing?.quantity || 0) + quantity;
        const qty = Math.min(desired, product.stock, 99);
        limited = qty < desired;
        return existing
          ? cur.map((i) => (i.product_id === product.id ? { ...i, quantity: qty } : i))
          : [...cur, { product_id: product.id, quantity: qty }];
      });
      // atualização otimista da linha para feedback imediato
      setQuote((q) => {
        const base = q || { items: [], warnings: [], totals: EMPTY_TOTALS };
        if (base.items.some((l) => l.product_id === product.id)) return base;
        const line: CartLine = {
          product_id: product.id, name: product.name, slug: product.slug, brand: product.brand, sku: product.sku,
          image: product.images[0], list_price: product.price, unit_price: product.final_price,
          quantity, stock: product.stock, line_total: product.final_price * quantity,
        };
        return { ...base, items: [...base.items, line] };
      });
      if (limited) toast.info(`Quantidade limitada ao estoque disponível (${product.stock}).`);
      setDrawerOpen(true);
    },
    [toast],
  );

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((cur) =>
      quantity <= 0
        ? cur.filter((i) => i.product_id !== productId)
        : cur.map((i) => (i.product_id === productId ? { ...i, quantity: Math.min(quantity, 99) } : i)),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((cur) => cur.filter((i) => i.product_id !== productId));
    setQuote((q) => (q ? { ...q, items: q.items.filter((l) => l.product_id !== productId) } : q));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    const empty = { items: [], warnings: [], totals: EMPTY_TOTALS };
    setQuote(empty);
    storage.set(SNAPSHOT_KEY, empty);
  }, []);

  const value = useMemo<CartState>(() => {
    const lines = (quote?.items || []).map((l) => {
      const it = items.find((i) => i.product_id === l.product_id);
      return it && it.quantity !== l.quantity ? { ...l, quantity: it.quantity, line_total: l.unit_price * it.quantity } : l;
    }).filter((l) => items.some((i) => i.product_id === l.product_id));
    return {
      items,
      lines,
      totals: quote?.totals || EMPTY_TOTALS,
      warnings: quote?.warnings || [],
      count: items.reduce((s, i) => s + i.quantity, 0),
      syncing,
      drawerOpen,
      setDrawerOpen,
      add,
      setQuantity,
      remove,
      clear,
      refresh: () => fetchQuote(items),
    };
  }, [items, quote, syncing, drawerOpen, add, setQuantity, remove, clear, fetchQuote]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider');
  return ctx;
}
