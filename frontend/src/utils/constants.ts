import type { OrderStatus } from '../types';

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: 'warning' | 'success' | 'info' | 'neutral' | 'danger' }> = {
  awaiting_payment: { label: 'Aguardando pagamento', tone: 'warning' },
  payment_approved: { label: 'Pagamento aprovado', tone: 'success' },
  preparing: { label: 'Em preparação', tone: 'info' },
  shipped: { label: 'Enviado', tone: 'info' },
  delivered: { label: 'Entregue', tone: 'success' },
  canceled: { label: 'Cancelado', tone: 'danger' },
};

/** Transições permitidas (espelha o backend) */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  awaiting_payment: ['payment_approved', 'canceled'],
  payment_approved: ['preparing', 'canceled'],
  preparing: ['shipped', 'canceled'],
  shipped: ['delivered'],
  delivered: [],
  canceled: [],
};

export const PAYMENT_STATUS: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  in_process: 'Em análise',
  rejected: 'Recusado',
  canceled: 'Cancelado',
  refunded: 'Estornado',
};

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'newest', label: 'Novidades' },
  { value: 'best_sellers', label: 'Mais vendidos' },
  { value: 'rating', label: 'Melhor avaliados' },
] as const;

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export const DEMO_MODE = (import.meta.env.VITE_DEMO_MODE ?? 'true') !== 'false';

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

/** Resolve URLs de imagens locais respeitando o caminho base do site (subpasta). */
export function imgUrl(url?: string | null): string {
  if (!url) return `${BASE}/brand/logo-mark.svg`;
  if (/^(https?:)?\/\//.test(url) || url.startsWith('data:')) return url;
  return `${BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

export const PLACEHOLDER_IMG = imgUrl(null);
