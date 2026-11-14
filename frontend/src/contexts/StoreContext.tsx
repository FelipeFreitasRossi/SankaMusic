import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { catalogService } from '../services/catalogService';
import type { Category, StoreConfig } from '../types';

interface StoreState {
  config: StoreConfig;
  categories: Category[];
  categoriesLoaded: boolean;
}

const DEFAULT_CONFIG: StoreConfig = {
  max_installments: 0,
  min_installment_value: 50,
  free_shipping_threshold: 0,
  payments_enabled: false,
  low_stock_threshold: 5,
};

const StoreContext = createContext<StoreState>({ config: DEFAULT_CONFIG, categories: [], categoriesLoaded: false });

/** Configurações públicas + categorias, carregadas uma única vez. */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>({ config: DEFAULT_CONFIG, categories: [], categoriesLoaded: false });

  useEffect(() => {
    Promise.allSettled([catalogService.config(), catalogService.categories()]).then(([cfg, cats]) => {
      setState({
        config: cfg.status === 'fulfilled' ? cfg.value : DEFAULT_CONFIG,
        categories: cats.status === 'fulfilled' ? cats.value : [],
        categoriesLoaded: true,
      });
    });
  }, []);

  return <StoreContext.Provider value={state}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
