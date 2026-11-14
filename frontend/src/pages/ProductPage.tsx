import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, CircleAlert, Heart, PackageX, RotateCcw, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { useAsync, useDocumentTitle } from '../hooks';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useStore } from '../contexts/StoreContext';
import { ProductGallery } from '../components/product/ProductGallery';
import { ShippingCalculator } from '../components/product/ShippingCalculator';
import { Reviews } from '../components/product/Reviews';
import { ProductShelf } from '../components/product/ProductCollections';
import { Price, QuantitySelector, Rating } from '../components/ui/Commerce';
import { Badge, EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback';
import { Breadcrumbs } from '../components/ui/Navigation';
import { Button } from '../components/ui/Button';
import { brl } from '../utils/format';
import s from '../components/product/ProductDetail.module.css';

type Tab = 'description' | 'specs' | 'reviews';

export default function ProductPage() {
  const { slug = '' } = useParams();
  const { data, loading, error, reload } = useAsync(() => catalogService.product(slug), [slug]);
  const { add } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const { config } = useStore();
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<Tab>('description');
  const product = data?.product;
  useDocumentTitle(product?.name);

  useEffect(() => {
    setQty(1);
    setTab('description');
  }, [slug]);

  if (error) {
    return (
      <div className="container page">
        {error.includes('não encontrado') ? (
          <EmptyState icon={<PackageX size={36} />} title="Produto não encontrado" text="Ele pode ter sido removido ou o link está incorreto." action={{ label: 'Ver produtos', to: '/produtos' }} />
        ) : (
          <ErrorState message={error} onRetry={reload} />
        )}
      </div>
    );
  }

  if (loading || !product) {
    return (
      <div className={`container page ${s.top}`}>
        <Skeleton height={520} radius={20} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Skeleton width="30%" height={14} />
          <Skeleton width="90%" height={34} />
          <Skeleton width="50%" height={18} />
          <Skeleton width="60%" height={60} style={{ marginTop: 20 }} />
          <Skeleton height={54} radius={30} style={{ marginTop: 20 }} />
        </div>
      </div>
    );
  }

  const fav = isFavorite(product.id);
  const low = product.in_stock && product.stock <= config.low_stock_threshold;
  const savings = product.price - product.final_price;

  return (
    <div className="page">
      <div className="container">
        <Breadcrumbs
          items={[
            { label: 'Início', to: '/' },
            ...(product.category_slug ? [{ label: product.category_name || 'Categoria', to: `/categoria/${product.category_slug}` }] : []),
            { label: product.name },
          ]}
        />

        <div className={s.top}>
          <ProductGallery images={product.images} name={product.name} />

          <div className={s.info}>
            <div className={s.metaTop}>
              <span className={s.brand}>{product.brand}</span>
              {product.sku && <span className={s.sku}>Cód. {product.sku}</span>}
            </div>
            <h1 className={s.title}>{product.name}</h1>
            <button className={s.ratingLink} onClick={() => setTab('reviews')}>
              <Rating value={product.rating_avg} count={product.rating_count} />
            </button>

            {product.is_demo && (
              <p className={s.demoNote}>
                <CircleAlert size={16} /> Produto fictício de demonstração — não está à venda.
              </p>
            )}

            <div className={s.priceBox}>
              {product.discount_percent > 0 && (
                <div className={s.saveRow}>
                  <Badge tone="orange">-{product.discount_percent}%</Badge>
                  <span>Economize {brl(savings)}</span>
                </div>
              )}
              <Price price={product.price} finalPrice={product.final_price} size="lg" />
            </div>

            <div className={s.stock}>
              {product.in_stock ? (
                <>
                  <span className={s.stockOk}>
                    <Check size={16} /> Em estoque
                  </span>
                  {low && <span className={s.stockLow}>Restam apenas {product.stock} unidades</span>}
                </>
              ) : (
                <span className={s.stockOut}>
                  <PackageX size={16} /> Produto esgotado no momento
                </span>
              )}
            </div>

            <div className={s.buy}>
              {product.in_stock && <QuantitySelector value={qty} max={product.stock} onChange={setQty} />}
              <Button size="lg" className={s.buyBtn} disabled={!product.in_stock} onClick={() => add(product, qty)} icon={<ShoppingBag size={20} />}>
                {product.in_stock ? 'Adicionar ao carrinho' : 'Indisponível'}
              </Button>
              <button
                className={`${s.favBtn} ${fav ? s.favOn : ''}`}
                onClick={() => toggle(product.id, product.name)}
                aria-pressed={fav}
                aria-label={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Heart size={22} fill={fav ? 'currentColor' : 'none'} />
              </button>
            </div>

            <ShippingCalculator items={[{ product_id: product.id, quantity: qty }]} />

            <ul className={s.assurances}>
              <li>
                <ShieldCheck size={18} /> Pagamento seguro via provedor
              </li>
              <li>
                <RotateCcw size={18} /> Arrependimento em até 7 dias (CDC)
              </li>
              <li>
                <Truck size={18} /> Envio para todo o Brasil
              </li>
            </ul>
          </div>
        </div>

        <section className={s.tabs}>
          <div className={s.tabList} role="tablist">
            {(
              [
                ['description', 'Descrição'],
                ['specs', 'Especificações técnicas'],
                ['reviews', `Avaliações (${product.rating_count})`],
              ] as [Tab, string][]
            ).map(([key, label]) => (
              <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? s.tabActive : undefined} onClick={() => setTab(key)}>
                {label}
              </button>
            ))}
          </div>
          <div className={s.tabPanel} role="tabpanel">
            {tab === 'description' &&
              (product.description ? (
                <div className={s.description}>
                  {product.description.split('\n').filter(Boolean).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              ) : (
                <p className="muted">Descrição não informada.</p>
              ))}
            {tab === 'specs' &&
              (product.specs.length ? (
                <table className={s.specs}>
                  <tbody>
                    {product.specs.map((sp, i) => (
                      <tr key={i}>
                        <th scope="row">{sp.label}</th>
                        <td>{sp.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="muted">Especificações não informadas.</p>
              ))}
            {tab === 'reviews' && <Reviews product={product} onReviewed={reload} />}
          </div>
        </section>

        <ProductShelf eyebrow="Você também pode gostar" title="Produtos relacionados" products={data.related} />
      </div>

      {product.in_stock && (
        <div className={s.stickyBuy}>
          <div>
            <small>{product.name}</small>
            <b>{brl(product.final_price)}</b>
          </div>
          <Button onClick={() => add(product, qty)} icon={<ShoppingBag size={18} />}>
            Comprar
          </Button>
        </div>
      )}
    </div>
  );
}
