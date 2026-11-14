import { api } from './api';
import type {
  Category,
  Paginated,
  Product,
  ProductListResponse,
  Review,
  Showcase,
  ShippingOption,
  StoreConfig,
  CartItem,
} from '../types';

export type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'best_sellers' | 'rating';

export interface ProductFilters {
  q?: string;
  category?: string;
  brand?: string[];
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  min_rating?: number;
  on_sale?: boolean;
  sort?: SortKey;
  page?: number;
  page_size?: number;
}

// cache simples em memória para dados que mudam pouco (evita requisições repetidas)
const cache = new Map<string, { at: number; data: unknown }>();
async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data as T;
  const data = await loader();
  cache.set(key, { at: Date.now(), data });
  return data;
}
export function clearCatalogCache() {
  cache.clear();
}

export const catalogService = {
  config: () => cached('config', 10 * 60_000, () => api.get<StoreConfig>('/config')),
  categories: () => cached('categories', 5 * 60_000, () => api.get<Category[]>('/categories')),
  showcase: () => cached('showcase', 60_000, () => api.get<Showcase>('/products/showcase')),
  products: (f: ProductFilters, signal?: AbortSignal) =>
    api.get<ProductListResponse>('/products', { ...f, brand: f.brand }, signal),
  product: (slug: string) => api.get<{ product: Product; related: Product[] }>(`/products/${encodeURIComponent(slug)}`),
  reviews: (slug: string, page = 1) =>
    api.get<Paginated<Review>>(`/products/${encodeURIComponent(slug)}/reviews`, { page, page_size: 10 }),
  addReview: (slug: string, body: { rating: number; title?: string; comment: string }) =>
    api.post<Review>(`/products/${encodeURIComponent(slug)}/reviews`, body),
  shippingQuote: (cep: string, items: CartItem[]) =>
    api.post<{ options: ShippingOption[] }>('/shipping/quote', { cep, items }),
  newsletter: (email: string) => api.post<{ detail: string }>('/newsletter', { email }),
};
