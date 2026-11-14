import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { Drawer } from '../ui/Overlay';
import { Button } from '../ui/Button';
import { QuantitySelector } from '../ui/Commerce';
import { EmptyState } from '../ui/Feedback';
import { brl } from '../../utils/format';
import s from './CartDrawer.module.css';

/** Mini carrinho lateral, aberto ao adicionar um produto. */
export function CartDrawer() {
  const { drawerOpen, setDrawerOpen, lines, totals, count, setQuantity, remove, syncing } = useCart();
  const navigate = useNavigate();
  const close = () => setDrawerOpen(false);
  const go = (path: string) => {
    close();
    navigate(path);
  };

  return (
    <Drawer open={drawerOpen} onClose={close} label="Carrinho">
      <div className={s.head}>
        <h2>
          <ShoppingBag size={22} /> Seu carrinho <span>({count})</span>
        </h2>
        <button onClick={close} aria-label="Fechar carrinho" className={s.close}>
          <X size={22} />
        </button>
      </div>

      {lines.length === 0 ? (
        <div className={s.empty}>
          <EmptyState
            title="Seu carrinho está vazio"
            text="Explore nossas categorias e encontre o equipamento ideal para o seu som."
            action={{ label: 'Explorar produtos', onClick: () => go('/produtos') }}
          />
        </div>
      ) : (
        <>
          <ul className={s.list}>
            {lines.map((l) => (
              <li key={l.product_id} className={s.item}>
                <Link to={`/produto/${l.slug}`} onClick={close} className={s.thumb}>
                  {l.image && <img src={l.image} alt="" />}
                </Link>
                <div className={s.info}>
                  <Link to={`/produto/${l.slug}`} onClick={close} className={s.name}>
                    {l.name}
                  </Link>
                  <span className={s.unit}>
                    {l.unit_price < l.list_price && <s>{brl(l.list_price)}</s>} {brl(l.unit_price)}
                  </span>
                  <div className={s.row}>
                    <QuantitySelector small value={l.quantity} max={l.stock} onChange={(q) => setQuantity(l.product_id, q)} />
                    <button className={s.remove} onClick={() => remove(l.product_id)} aria-label={`Remover ${l.name}`}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className={s.foot}>
            {totals.discount > 0 && (
              <div className={s.line}>
                <span>Descontos</span>
                <span className={s.discount}>- {brl(totals.discount)}</span>
              </div>
            )}
            <div className={`${s.line} ${s.total}`}>
              <span>Subtotal</span>
              <strong aria-live="polite">{syncing ? 'Atualizando…' : brl(totals.items_total)}</strong>
            </div>
            <p className={s.note}>Frete calculado no checkout.</p>
            <Button block size="lg" onClick={() => go('/checkout')} disabled={syncing}>
              Finalizar compra
            </Button>
            <Button block variant="outline" onClick={() => go('/carrinho')}>
              Ver carrinho completo
            </Button>
          </div>
        </>
      )}
    </Drawer>
  );
}
