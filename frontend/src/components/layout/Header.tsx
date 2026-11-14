import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, Heart, LayoutDashboard, LogOut, Menu, Package, ShoppingCart, Tag, User, X } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { CategoryIcon } from '../brand/CategoryIcon';
import { SearchBar } from './SearchBar';
import { Drawer } from '../ui/Overlay';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useStore } from '../../contexts/StoreContext';
import { useClickOutside } from '../../hooks';
import { DEMO_MODE } from '../../utils/constants';
import s from './Header.module.css';

export function Header() {
  const { user, isAdmin, logout } = useAuth();
  const { count, setDrawerOpen } = useCart();
  const { count: favCount } = useFavorites();
  const { categories } = useStore();
  const location = useLocation();
  const [megaOpen, setMegaOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeUser = useCallback(() => setUserOpen(false), []);
  const closeMega = useCallback(() => setMegaOpen(false), []);
  const userRef = useClickOutside<HTMLDivElement>(closeUser);
  const megaRef = useClickOutside<HTMLDivElement>(closeMega);

  useEffect(() => {
    setMegaOpen(false);
    setMenuOpen(false);
    setUserOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const firstName = user?.name.split(' ')[0];

  return (
    <>
      {DEMO_MODE && (
        <div className={s.demoBar} role="note">
          Ambiente de demonstração — produtos, marcas, preços e estoques são fictícios.
        </div>
      )}
      <header className={`${s.header} ${scrolled ? s.scrolled : ''}`}>
        <div className={`container ${s.top}`}>
          <button className={s.menuBtn} onClick={() => setMenuOpen(true)} aria-label="Abrir menu">
            <Menu size={24} />
          </button>
          <Logo />
          <div className={s.searchDesktop}>
            <SearchBar />
          </div>
          <nav className={s.actions} aria-label="Conta e carrinho">
            <div className={s.userWrap} ref={userRef}>
              {user ? (
                <button className={s.action} onClick={() => setUserOpen((v) => !v)} aria-expanded={userOpen} aria-haspopup="menu">
                  <User size={22} />
                  <span className={s.actionText}>
                    <small>Olá, {firstName}</small>
                    <b>
                      Minha conta <ChevronDown size={14} />
                    </b>
                  </span>
                </button>
              ) : (
                <Link to="/entrar" className={s.action}>
                  <User size={22} />
                  <span className={s.actionText}>
                    <small>Bem-vindo(a)</small>
                    <b>Entre ou cadastre-se</b>
                  </span>
                </Link>
              )}
              {userOpen && user && (
                <div className={s.userMenu} role="menu">
                  <Link to="/conta" role="menuitem">
                    <User size={16} /> Meus dados
                  </Link>
                  <Link to="/conta/pedidos" role="menuitem">
                    <Package size={16} /> Meus pedidos
                  </Link>
                  <Link to="/favoritos" role="menuitem">
                    <Heart size={16} /> Favoritos
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" role="menuitem" className={s.adminLink}>
                      <LayoutDashboard size={16} /> Painel administrativo
                    </Link>
                  )}
                  <button role="menuitem" onClick={logout}>
                    <LogOut size={16} /> Sair
                  </button>
                </div>
              )}
            </div>
            <Link to="/favoritos" className={`${s.action} ${s.iconOnly}`} aria-label={`Favoritos (${favCount})`}>
              <Heart size={22} />
              {favCount > 0 && <span className={s.count}>{favCount}</span>}
            </Link>
            <button className={`${s.action} ${s.cartBtn}`} onClick={() => setDrawerOpen(true)} aria-label={`Carrinho (${count} itens)`}>
              <ShoppingCart size={22} />
              {count > 0 && (
                <span className={s.count} key={count}>
                  {count}
                </span>
              )}
            </button>
          </nav>
        </div>
        <div className={`container ${s.searchMobile}`}>
          <SearchBar />
        </div>
        <div className={s.navRow}>
          <div className={`container ${s.nav}`} ref={megaRef}>
            <button className={`${s.dept} ${megaOpen ? s.deptOpen : ''}`} onClick={() => setMegaOpen((v) => !v)} aria-expanded={megaOpen}>
              <Menu size={18} /> Departamentos <ChevronDown size={16} />
            </button>
            <ul className={s.links}>
              {categories.slice(0, 7).map((c) => (
                <li key={c.id}>
                  <NavLink to={`/categoria/${c.slug}`} className={({ isActive }) => (isActive ? s.active : undefined)}>
                    {c.name}
                  </NavLink>
                </li>
              ))}
            </ul>
            <NavLink to="/ofertas" className={s.offers}>
              <Tag size={16} /> Ofertas
            </NavLink>
            {megaOpen && (
              <div className={s.mega}>
                <div className={s.megaGrid}>
                  {categories.map((c) => (
                    <Link key={c.id} to={`/categoria/${c.slug}`} className={s.megaItem}>
                      <span className={s.megaIcon}>
                        <CategoryIcon name={c.icon} size={22} />
                      </span>
                      <span>
                        <b>{c.name}</b>
                        <small>{c.product_count ?? 0} produtos</small>
                      </span>
                    </Link>
                  ))}
                </div>
                <div className={s.megaAside}>
                  <span className="eyebrow">Navegue</span>
                  <Link to="/produtos">Todos os produtos</Link>
                  <Link to="/produtos?sort=newest">Lançamentos</Link>
                  <Link to="/produtos?sort=best_sellers">Mais vendidos</Link>
                  <Link to="/ofertas">Ofertas</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} side="left" label="Menu">
        <div className={s.drawerHead}>
          <Logo tone="dark" compact />
          <button className={s.drawerClose} onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
            <X size={22} />
          </button>
        </div>
        <div className={s.drawerUser}>
          {user ? (
            <>
              <b>Olá, {firstName}!</b>
              <Link to="/conta">Minha conta</Link>
            </>
          ) : (
            <Link to="/entrar">
              <User size={18} /> Entre ou cadastre-se
            </Link>
          )}
        </div>
        <nav className={s.drawerNav} aria-label="Categorias">
          <Link to="/ofertas" className={s.drawerOffer}>
            <Tag size={20} /> Ofertas
          </Link>
          {categories.map((c) => (
            <Link key={c.id} to={`/categoria/${c.slug}`}>
              <CategoryIcon name={c.icon} size={20} /> {c.name}
            </Link>
          ))}
          <Link to="/produtos">Todos os produtos</Link>
        </nav>
        {user && (
          <div className={s.drawerFoot}>
            {isAdmin && (
              <Link to="/admin">
                <LayoutDashboard size={18} /> Painel administrativo
              </Link>
            )}
            <button onClick={logout}>
              <LogOut size={18} /> Sair
            </button>
          </div>
        )}
      </Drawer>
    </>
  );
}
