import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ShoppingCart, Trash2, TriangleAlert } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useStore } from '../contexts/StoreContext';
import { useDocumentTitle } from '../hooks';
import { Button } from '../components/ui/Button';
import { QuantitySelector } from '../components/ui/Commerce';
import { EmptyState } from '../components/ui/Feedback';
import { Breadcrumbs } from '../components/ui/Navigation';
import { ShippingCalculator } from '../components/product/ShippingCalculator';
import { brl, installments, pluralize } from '../utils/format';
import { imgUrl } from '../utils/constants';
import s from './Pages.module.css';

export default function CartPage() {
  useDocumentTitle('Carrinho');
  const { lines, totals, warnings, count, items, setQuantity, remove, clear, syncing } = useCart();
  const { config } = useStore();
  const navigate = useNavigate();
  const inst = installments(totals.items_total, config.max_installments, config.min_installment_value);

  if (!lines.length && !syncing) {
    return (
      <div className="container page">
        <EmptyState
          icon={<ShoppingCart size={38} />}
          title="Seu carrinho está vazio"
          text="Que tal começar pelos destaques da loja? Temos instrumentos e equipamentos para todos os estilos."
          action={{ label: 'Continuar comprando', to: '/' }}
        />
      </div>
    );
  }

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Carrinho' }]} />
      <h1 className="page-title">Meu carrinho</h1>
      <p className="muted">{pluralize(count, 'item', 'itens')}</p>

      {warnings.length > 0 && (
        <div className={s.warnings} role="alert">
          {warnings.map((w) => (
            <p key={w.product_id + w.type}>
              <TriangleAlert size={16} /> {w.message}
            </p>
          ))}
        </div>
      )}

      <div className={s.cartLayout}>
        <section className={`card ${s.cartList}`} aria-label="Itens do carrinho">
          <div className={s.cartHead}>
            <span>Produto</span>
            <span>Quantidade</span>
            <span>Total</span>
          </div>
          {lines.map((l) => (
            <article key={l.product_id} className={s.cartItem}>
              <Link to={`/produto/${l.slug}`} className={s.cartThumb}>
                <img src={imgUrl(l.image)} alt="" />
              </Link>
              <div className={s.cartInfo}>
                {l.brand && <span className={s.cartBrand}>{l.brand}</span>}
                <Link to={`/produto/${l.slug}`} className={s.cartName}>
                  {l.name}
                </Link>
                <span className={s.cartUnit}>
                  {l.unit_price < l.list_price && <s>{brl(l.list_price)}</s>}
                  <b>{brl(l.unit_price)}</b> /un.
                </span>
                {l.quantity >= l.stock && <small className={s.cartStock}>Quantidade máxima em estoque</small>}
              </div>
              <div className={s.cartQty}>
                <QuantitySelector value={items.find((i) => i.product_id === l.product_id)?.quantity || l.quantity} max={l.stock} onChange={(q) => setQuantity(l.product_id, q)} />
                <button className={s.cartRemove} onClick={() => remove(l.product_id)}>
                  <Trash2 size={15} /> Remover
                </button>
              </div>
              <strong className={s.cartTotal}>{brl(l.unit_price * l.quantity)}</strong>
            </article>
          ))}
          <div className={s.cartActions}>
            <Button variant="ghost" to="/produtos" icon={<ArrowLeft size={16} />}>
              Continuar comprando
            </Button>
            <Button variant="ghost" onClick={clear} icon={<Trash2 size={16} />}>
              Esvaziar carrinho
            </Button>
          </div>
        </section>

        <aside className={s.summary}>
          <div className={`card ${s.summaryCard}`}>
            <h2>Resumo do pedido</h2>
            <dl className={s.totals}>
              <div>
                <dt>Subtotal ({pluralize(totals.items_count, 'item', 'itens')})</dt>
                <dd>{brl(totals.subtotal)}</dd>
              </div>
              {totals.discount > 0 && (
                <div className={s.discount}>
                  <dt>Descontos</dt>
                  <dd>- {brl(totals.discount)}</dd>
                </div>
              )}
              <div>
                <dt>Frete</dt>
                <dd className="muted">Calculado no checkout</dd>
              </div>
              <div className={s.grand}>
                <dt>Total</dt>
                <dd>{syncing ? 'Atualizando…' : brl(totals.items_total)}</dd>
              </div>
            </dl>
            {inst && (
              <p className={s.installments}>
                ou em até <b>{inst.count}x de {brl(inst.value)}</b> sem juros
              </p>
            )}
            <Button block size="lg" onClick={() => navigate('/checkout')} disabled={syncing || !lines.length} icon={<Lock size={18} />}>
              Finalizar compra
            </Button>
            <p className={s.secure}>Valores conferidos pelo servidor a cada alteração.</p>
          </div>
          <ShippingCalculator items={items} />
        </aside>
      </div>
    </div>
  );
}
