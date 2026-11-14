import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ScrollToTop, StoreLayout } from './layouts/StoreLayout';
import { AccountLayout } from './layouts/AccountLayout';
import { RequireAdmin, RequireAuth } from './layouts/Guards';
import { Spinner } from './components/ui/Feedback';
import HomePage from './pages/HomePage';

// Páginas carregadas sob demanda (code splitting) — menos JS na primeira visita
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const CheckoutPage = lazy(() => import('./pages/checkout/CheckoutPage'));
const PaymentReturnPage = lazy(() => import('./pages/checkout/PaymentReturnPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const ProfilePage = lazy(() => import('./pages/account/ProfilePage'));
const OrdersPage = lazy(() => import('./pages/account/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/account/OrderDetailPage'));
const AddressesPage = lazy(() => import('./pages/account/AddressesPage'));
const InfoPage = lazy(() => import('./pages/InfoPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/DashboardPage'));
const AdminProducts = lazy(() => import('./pages/admin/ProductsPage'));
const AdminProductForm = lazy(() => import('./pages/admin/ProductFormPage'));
const AdminCategories = lazy(() => import('./pages/admin/CategoriesPage'));
const AdminOrders = lazy(() => import('./pages/admin/OrdersPage'));
const AdminOrderDetail = lazy(() => import('./pages/admin/OrderDetailPage'));
const AdminCustomers = lazy(() => import('./pages/admin/CustomersPage'));
const AdminCustomerDetail = lazy(() => import('./pages/admin/CustomerDetailPage'));

export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<HomePage />} />
        <Route path="produtos" element={<CatalogPage mode="all" />} />
        <Route path="categoria/:slug" element={<CatalogPage mode="category" />} />
        <Route path="busca" element={<CatalogPage mode="search" />} />
        <Route path="ofertas" element={<CatalogPage mode="offers" />} />
        <Route path="categorias" element={<CategoriesPage />} />
        <Route path="produto/:slug" element={<ProductPage />} />
        <Route path="carrinho" element={<CartPage />} />
        <Route path="favoritos" element={<FavoritesPage />} />
        <Route
          path="pedido/:id/retorno"
          element={
            <RequireAuth>
              <PaymentReturnPage />
            </RequireAuth>
          }
        />
        <Route path="entrar" element={<LoginPage />} />
        <Route path="cadastro" element={<RegisterPage />} />
        <Route path="esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="conta" element={<AccountLayout />}>
          <Route index element={<ProfilePage />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route path="pedidos/:id" element={<OrderDetailPage />} />
          <Route path="enderecos" element={<AddressesPage />} />
        </Route>
        <Route path="info/:slug" element={<InfoPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Checkout com layout enxuto (sem distrações) */}
      <Route
        path="checkout"
        element={
          <Suspense fallback={<Spinner />}>
            <ScrollToTop />
            <main id="conteudo">
              <CheckoutPage />
            </main>
          </Suspense>
        }
      />

      <Route
        path="admin"
        element={
          <Suspense fallback={<Spinner />}>
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          </Suspense>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="produtos" element={<AdminProducts />} />
        <Route path="produtos/novo" element={<AdminProductForm />} />
        <Route path="produtos/:id" element={<AdminProductForm />} />
        <Route path="categorias" element={<AdminCategories />} />
        <Route path="pedidos" element={<AdminOrders />} />
        <Route path="pedidos/:id" element={<AdminOrderDetail />} />
        <Route path="clientes" element={<AdminCustomers />} />
        <Route path="clientes/:id" element={<AdminCustomerDetail />} />
      </Route>
    </Routes>
  );
}
