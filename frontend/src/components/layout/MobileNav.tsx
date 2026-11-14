import { NavLink } from 'react-router-dom';
import { Heart, House, LayoutGrid, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import s from './MobileNav.module.css';

/** Navegação inferior flutuante (somente mobile). */
export function MobileNav() {
  const { count } = useCart();
  const { count: favCount } = useFavorites();
  const { user } = useAuth();
  const cls = ({ isActive }: { isActive: boolean }) => `${s.item} ${isActive ? s.active : ''}`;

  return (
    <nav className={s.bar} aria-label="Navegação principal">
      <NavLink to="/" end className={cls}>
        <House size={22} />
        <span>Início</span>
      </NavLink>
      <NavLink to="/categorias" className={cls}>
        <LayoutGrid size={22} />
        <span>Categorias</span>
      </NavLink>
      <NavLink to="/carrinho" className={({ isActive }) => `${s.item} ${s.cart} ${isActive ? s.active : ''}`}>
        <span className={s.cartBubble}>
          <ShoppingCart size={22} />
          {count > 0 && <b className={s.badge}>{count}</b>}
        </span>
        <span>Carrinho</span>
      </NavLink>
      <NavLink to="/favoritos" className={cls}>
        <span className={s.iconWrap}>
          <Heart size={22} />
          {favCount > 0 && <b className={s.badge}>{favCount}</b>}
        </span>
        <span>Favoritos</span>
      </NavLink>
      <NavLink to={user ? '/conta' : '/entrar'} className={cls}>
        <User size={22} />
        <span>{user ? 'Perfil' : 'Entrar'}</span>
      </NavLink>
    </nav>
  );
}
