import { NavLink, Outlet } from 'react-router-dom';
import { Heart, LogOut, MapPin, Package, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RequireAuth } from './Guards';
import s from './AccountLayout.module.css';

export function AccountLayout() {
  const { user, logout } = useAuth();
  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? s.active : undefined);
  return (
    <RequireAuth>
      <div className={`container page ${s.wrap}`}>
        <aside className={s.side}>
          <div className={s.hello}>
            <span className={s.avatar}>{user?.name.charAt(0).toUpperCase()}</span>
            <div>
              <small>Olá,</small>
              <b>{user?.name}</b>
            </div>
          </div>
          <nav className={s.nav} aria-label="Minha conta">
            <NavLink to="/conta" end className={cls}>
              <User size={18} /> Meus dados
            </NavLink>
            <NavLink to="/conta/pedidos" className={cls}>
              <Package size={18} /> Pedidos
            </NavLink>
            <NavLink to="/conta/enderecos" className={cls}>
              <MapPin size={18} /> Endereços
            </NavLink>
            <NavLink to="/favoritos" className={cls}>
              <Heart size={18} /> Favoritos
            </NavLink>
            <button onClick={logout}>
              <LogOut size={18} /> Sair
            </button>
          </nav>
        </aside>
        <section className={s.content}>
          <Outlet />
        </section>
      </div>
    </RequireAuth>
  );
}
