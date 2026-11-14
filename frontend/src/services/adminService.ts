import { api, request } from './api';
import type {
  Category,
  Customer,
  DashboardData,
  Order,
  OrderStatus,
  Paginated,
  Product,
  ProductInput,
} from '../types';

export interface AdminProductQuery {
  page?: number;
  page_size?: number;
  q?: string;
  category?: string;
  status?: 'all' | 'active' | 'inactive' | 'low_stock';
  sort?: string;
}

export const adminService = {
  dashboard: (days = 30) => api.get<DashboardData>('/admin/dashboard', { days }),

  products: (q: AdminProductQuery) => api.get<Paginated<Product>>('/admin/products', { ...q }),
  product: (id: string) => api.get<Product>(`/admin/products/${id}`),
  createProduct: (data: ProductInput) => api.post<Product>('/admin/products', data),
  updateProduct: (id: string, data: Partial<ProductInput>) => api.patch<Product>(`/admin/products/${id}`, data),
  setStock: (id: string, body: { delta?: number; stock?: number }) =>
    api.post<Product>(`/admin/products/${id}/stock`, body),
  deleteProduct: (id: string) => api.del(`/admin/products/${id}`),
  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<{ url: string }>('/admin/uploads/image', { method: 'POST', body: fd });
  },

  categories: () => api.get<Category[]>('/admin/categories'),
  createCategory: (data: Partial<Category>) => api.post<Category>('/admin/categories', data),
  updateCategory: (id: string, data: Partial<Category>) => api.patch<Category>(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.del(`/admin/categories/${id}`),

  orders: (q: { page?: number; status?: OrderStatus | ''; q?: string; user_id?: string }) =>
    api.get<Paginated<Order>>('/admin/orders', { ...q, page_size: 20 }),
  order: (id: string) => api.get<Order>(`/admin/orders/${id}`),
  updateOrderStatus: (id: string, body: { status: OrderStatus; note?: string; tracking_code?: string }) =>
    api.patch<Order>(`/admin/orders/${id}/status`, body),

  customers: (q: { page?: number; q?: string }) => api.get<Paginated<Customer>>('/admin/customers', { ...q, page_size: 20 }),
  customer: (id: string) => api.get<Customer>(`/admin/customers/${id}`),
  setCustomerActive: (id: string, active: boolean) => api.patch<Customer>(`/admin/customers/${id}/active`, { active }),
};
