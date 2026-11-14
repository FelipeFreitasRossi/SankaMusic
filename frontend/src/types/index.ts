// Tipos compartilhados — espelham os schemas do backend (FastAPI)

export type Role = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  cpf?: string | null;
  role: Role;
  active?: boolean;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  order: number;
  active: boolean;
  product_count?: number;
}

export interface Spec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  brand: string;
  category_id: string;
  category_slug?: string | null;
  category_name?: string | null;
  price: number;
  promo_price?: number | null;
  final_price: number;
  discount_percent: number;
  stock: number;
  in_stock: boolean;
  description: string;
  specs: Spec[];
  images: string[];
  rating_avg: number;
  rating_count: number;
  sold_count: number;
  featured: boolean;
  active: boolean;
  is_demo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ProductListResponse extends Paginated<Product> {
  facets: { brands: string[]; price_min: number; price_max: number };
}

export interface Showcase {
  featured: Product[];
  offers: Product[];
  best_sellers: Product[];
  newest: Product[];
  brands: string[];
  categories: Category[];
}

export interface Review {
  id: string;
  product_id: string;
  user_name: string;
  rating: number;
  title?: string | null;
  comment: string;
  created_at?: string;
}

export interface StoreConfig {
  max_installments: number;
  min_installment_value: number;
  free_shipping_threshold: number;
  payments_enabled: boolean;
  low_stock_threshold: number;
}

// ---------------------------------------------------------------- carrinho
export interface CartItem {
  product_id: string;
  quantity: number;
}

/** Linha do carrinho com preços validados pelo backend */
export interface CartLine {
  product_id: string;
  name: string;
  slug: string;
  brand?: string;
  sku?: string | null;
  image?: string | null;
  list_price: number;
  unit_price: number;
  quantity: number;
  stock: number;
  line_total: number;
}

export interface Totals {
  subtotal: number;
  discount: number;
  items_total: number;
  shipping_price: number;
  total: number;
  items_count: number;
}

export interface CartWarning {
  product_id: string;
  type: 'unavailable' | 'out_of_stock' | 'quantity_adjusted';
  message: string;
}

export interface CartQuote {
  items: CartLine[];
  warnings: CartWarning[];
  totals: Totals;
}

// --------------------------------------------------------------- endereços
export interface AddressInput {
  label: string;
  recipient: string;
  cep: string;
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
  phone?: string | null;
  is_default: boolean;
}

export interface Address extends AddressInput {
  id: string;
  user_id: string;
  created_at?: string;
}

export interface ShippingOption {
  code: string;
  name: string;
  price: number;
  days: number;
  description?: string;
}

// ----------------------------------------------------------------- pedidos
export type OrderStatus =
  | 'awaiting_payment'
  | 'payment_approved'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'canceled';

export interface OrderItem {
  product_id: string;
  name: string;
  slug: string;
  brand?: string;
  sku?: string | null;
  image?: string | null;
  list_price: number;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface StatusHistory {
  status: OrderStatus;
  label: string;
  at: string;
  note?: string;
}

export interface Payment {
  id: string;
  provider: string;
  provider_payment_id?: string | null;
  preference_id?: string | null;
  status: string;
  raw_status?: string;
  status_detail?: string;
  amount: number;
  method?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  number: number;
  user_id: string;
  customer: { name: string; email: string; phone?: string | null; cpf?: string | null };
  items: OrderItem[];
  shipping_address: Omit<AddressInput, 'label' | 'is_default'>;
  shipping: { code: string; name: string; price: number; days: number };
  subtotal: number;
  discount: number;
  shipping_price: number;
  total: number;
  notes?: string | null;
  status: OrderStatus;
  status_label: string;
  status_history: StatusHistory[];
  payment: { method: string; status: string; payment_id?: string };
  tracking_code?: string | null;
  created_at: string;
  updated_at: string;
  // somente admin
  payments?: Payment[];
  customer_account?: User | null;
}

// ------------------------------------------------------------------- admin
export interface DashboardData {
  period_days: number;
  total_sales: number;
  orders_count: number;
  revenue_total: number;
  revenue_period: number;
  sales_period: number;
  average_ticket: number;
  products_count: number;
  active_products: number;
  customers_count: number;
  low_stock_count: number;
  low_stock_threshold: number;
  status_counts: Record<OrderStatus, number>;
  daily: { date: string; total: number; orders: number }[];
  low_stock: Product[];
  best_sellers: Product[];
  recent_orders: Order[];
}

export interface Customer extends User {
  orders_count?: number;
  total_spent?: number;
  addresses?: Address[];
}

export interface ProductInput {
  name: string;
  slug?: string;
  sku?: string | null;
  brand: string;
  category_id: string;
  price: number;
  promo_price?: number | null;
  stock: number;
  description: string;
  specs: Spec[];
  images: string[];
  featured: boolean;
  active: boolean;
}
