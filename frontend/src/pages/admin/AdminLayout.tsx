import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { FolderTree, LayoutDashboard, LogOut, Menu, Package, ShoppingBag, Store, Users, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LogoMark } from '../../components/brand/Logo';
import { Spinner } from '../../components/ui/Feedback';
import { ScrollToTop } from '../../layouts/StoreLayout';
import s from './Admin.module.css';

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { to: '/admin/produtos', label: 'Produtos', icon: Package },
  { to: '/admin/categorias', label: 'Categorias', icon: FolderTree },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className={s.shell}>
      <ScrollToTop />
      <aside className={`${s.sidebar} ${open ? s.sidebarOpen : ''}`}>
        <div className={s.sideHead}>
          <Link to="/admin" className={s.sideBrand}>
            <LogoMark size={34} />
            <span>
              <b>SANKA</b>
              <small>Painel administrativo</small>
            </span>
          </Link>
          <button className={s.sideClose} onClick={() => setOpen(false)} aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>
        <nav className={s.sideNav} aria-label="Administração">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? s.navActive : undefined)}>
              <Icon size={19} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className={s.sideFoot}>
          <Link to="/">
            <Store size={18} /> Ver loja
          </Link>
          <button onClick={logout}>
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>
      {open && <div className={s.backdrop} onClick={() => setOpen(false)} />}

      <div className={s.mainCol}>
        <header className={s.topbar}>
          <button className={s.menuBtn} onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu size={22} />
          </button>
          <span className={s.topTitle}>Administração</span>
          <span className={s.topUser}>
            <span className={s.avatar}>{user?.name.charAt(0)}</span>
            <span className={s.topUserName}>{user?.name}</span>
          </span>
        </header>
        <main className={s.content} id="conteudo">
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
