import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import type { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useStore } from '../../contexts/StoreContext';
import { Price, Rating } from '../ui/Commerce';
import { Badge } from '../ui/Feedback';
import { PLACEHOLDER_IMG } from '../../utils/constants';
import s from './ProductCard.module.css';

function ProductCardBase({ product }: { product: Product }) {
  const { add } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const { config } = useStore();
  const fav = isFavorite(product.id);
  const img = product.images[0] || PLACEHOLDER_IMG;
  const hover = product.images[1];
  const lowStock = product.in_stock && product.stock <= config.low_stock_threshold;
  const url = `/produto/${product.slug}`;

  return (
    <article className={s.card}>
      <div className={s.media}>
        <Link to={url} className={s.imgLink} tabIndex={-1} aria-hidden>
          <img src={img} alt="" loading="lazy" className={s.img} />
          {hover && <img src={hover} alt="" loading="lazy" className={`${s.img} ${s.imgHover}`} />}
        </Link>
        <div className={s.badges}>
          {product.discount_percent > 0 && <Badge tone="orange">-{product.discount_percent}%</Badge>}
          {!product.in_stock && <Badge tone="dark">Esgotado</Badge>}
          {lowStock && <Badge tone="warning">Últimas unidades</Badge>}
        </div>
        <button
          className={`${s.fav} ${fav ? s.favOn : ''}`}
          onClick={() => toggle(product.id, product.name)}
          aria-pressed={fav}
          aria-label={fav ? `Remover ${product.name} dos favoritos` : `Adicionar ${product.name} aos favoritos`}
        >
          <Heart size={18} fill={fav ? 'currentColor' : 'none'} />
        </button>
        <button
          className={s.quickAdd}
          onClick={() => add(product)}
          disabled={!product.in_stock}
          aria-label={product.in_stock ? `Adicionar ${product.name} ao carrinho` : 'Produto esgotado'}
        >
          <ShoppingBag size={18} />
          <span>{product.in_stock ? 'Adicionar' : 'Esgotado'}</span>
        </button>
      </div>
      <div className={s.body}>
        <span className={s.brand}>{product.brand}</span>
        <h3 className={s.name}>
          <Link to={url}>{product.name}</Link>
        </h3>
        {product.rating_count > 0 && <Rating value={product.rating_avg} count={product.rating_count} size={13} />}
        <div className={s.price}>
          <Price price={product.price} finalPrice={product.final_price} />
        </div>
      </div>
    </article>
  );
}

export const ProductCard = memo(ProductCardBase);

export function ProductCardSkeleton() {
  return (
    <div className={s.card} aria-hidden>
      <div className={`${s.media} ${s.skel}`} />
      <div className={s.body}>
        <span className={s.skelLine} style={{ width: '35%' }} />
        <span className={s.skelLine} style={{ width: '90%' }} />
        <span className={s.skelLine} style={{ width: '60%' }} />
        <span className={s.skelLine} style={{ width: '45%', height: 22, marginTop: 8 }} />
      </div>
    </div>
  );
}
