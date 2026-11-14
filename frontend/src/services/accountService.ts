import { api } from './api';
import type {
  Address,
  AddressInput,
  AuthResponse,
  CartItem,
  CartQuote,
  Order,
  Paginated,
  Product,
  User,
} from '../types';

export const authService = {
  login: (email: string, password: string) => api.post<AuthResponse>('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post<AuthResponse>('/auth/register', data),
  me: () => api.get<User>('/auth/me'),
  logout: () => api.post<{ detail: string }>('/auth/logout'),
  forgotPassword: (email: string) => api.post<{ detail: string }>('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post<{ detail: string }>('/auth/reset-password', { token, password }),
  changePassword: (current_password: string, new_password: string) =>
    api.post<{ detail: string }>('/auth/change-password', { current_password, new_password }),
};

export const userService = {
  updateProfile: (data: Partial<Pick<User, 'name' | 'phone' | 'cpf'>>) => api.patch<User>('/users/me', data),
};

export const cartService = {
  quote: (items: CartItem[]) => api.post<CartQuote>('/cart/quote', { items }),
  get: () => api.get<CartQuote>('/cart'),
  save: (items: CartItem[], merge = false) => api.put<CartQuote>('/cart', { items }, { merge }),
};

export const favoriteService = {
  list: () => api.get<Product[]>('/favorites'),
  add: (productId: string) => api.post<void>(`/favorites/${productId}`),
  remove: (productId: string) => api.del(`/favorites/${productId}`),
  sync: (productIds: string[]) => api.post<Product[]>('/favorites/sync', { product_ids: productIds }),
};

export const addressService = {
  list: () => api.get<Address[]>('/addresses'),
  create: (data: AddressInput) => api.post<Address>('/addresses', data),
  update: (id: string, data: AddressInput) => api.put<Address>(`/addresses/${id}`, data),
  remove: (id: string) => api.del(`/addresses/${id}`),
};

export interface CreateOrderInput {
  items: CartItem[];
  address_id?: string;
  address?: AddressInput;
  shipping_code: string;
  payment_method: 'mercadopago';
  notes?: string;
}

export const orderService = {
  create: (data: CreateOrderInput) => api.post<Order>('/orders', data),
  list: (page = 1) => api.get<Paginated<Order>>('/orders', { page, page_size: 10 }),
  get: (id: string) => api.get<Order>(`/orders/${id}`),
  cancel: (id: string) => api.post<Order>(`/orders/${id}/cancel`),
  startPayment: (id: string) => api.post<{ redirect_url: string; provider: string }>(`/payments/${id}/checkout`),
  syncPayment: (id: string) => api.post<Order>(`/payments/${id}/sync`),
};

/** Consulta pública de CEP (ViaCEP) — apenas para preencher o formulário. */
export async function lookupCep(cep: string): Promise<Partial<AddressInput> | null> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!res.ok) return null;
    const d = await res.json();
    if (d.erro) return null;
    return { street: d.logradouro || '', district: d.bairro || '', city: d.localidade || '', state: d.uf || '' };
  } catch {
    return null;
  }
}
