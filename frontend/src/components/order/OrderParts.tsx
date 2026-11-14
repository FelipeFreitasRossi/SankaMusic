import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import type { Order, OrderItem, OrderStatus } from '../../types';
import { ORDER_STATUS } from '../../utils/constants';
import { brl, formatDate } from '../../utils/format';
import { imgUrl } from '../../utils/constants';
import { Badge } from '../ui/Feedback';
import s from './Order.module.css';

export function StatusBadge({ status }: { status: OrderStatus }) {
  const st = ORDER_STATUS[status];
  return <Badge tone={st?.tone || 'neutral'}>{st?.label || status}</Badge>;
}

const FLOW: OrderStatus[] = ['awaiting_payment', 'payment_approved', 'preparing', 'shipped', 'delivered'];

export function OrderTimeline({ order }: { order: Order }) {
  if (order.status === 'canceled') {
    return (
      <ol className={s.history}>
        {order.status_history.map((h, i) => (
          <li key={i}>
            <b>{h.label}</b>
            <small>{formatDate(h.at, true)}{h.note ? ` — ${h.note}` : ''}</small>
          </li>
        ))}
      </ol>
    );
  }
  const current = FLOW.indexOf(order.status);
  return (
    <ol className={s.timeline}>
      {FLOW.map((st, i) => {
        const h = [...order.status_history].reverse().find((x) => x.status === st);
        const done = i <= current;
        return (
          <li key={st} className={`${done ? s.done : ''} ${i === current ? s.current : ''}`}>
            <span className={s.dot}>{done && <Check size={14} />}</span>
            <b>{ORDER_STATUS[st].label}</b>
            {h && <small>{formatDate(h.at, true)}</small>}
          </li>
        );
      })}
    </ol>
  );
}

export function OrderItems({ items, linkable = true }: { items: OrderItem[]; linkable?: boolean }) {
  return (
    <ul className={s.items}>
      {items.map((it) => (
        <li key={it.product_id}>
          <img src={imgUrl(it.image)} alt="" />
          <div>
            {linkable ? <Link to={`/produto/${it.slug}`}>{it.name}</Link> : <span>{it.name}</span>}
            <small>
              {it.quantity} × {brl(it.unit_price)}
              {it.sku ? ` · ${it.sku}` : ''}
            </small>
          </div>
          <strong>{brl(it.line_total)}</strong>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotals({ order }: { order: Pick<Order, 'subtotal' | 'discount' | 'shipping_price' | 'total' | 'shipping'> }) {
  return (
    <dl className={s.totals}>
      <div>
        <dt>Subtotal</dt>
        <dd>{brl(order.subtotal)}</dd>
      </div>
      {order.discount > 0 && (
        <div className={s.discount}>
          <dt>Descontos</dt>
          <dd>- {brl(order.discount)}</dd>
        </div>
      )}
      <div>
        <dt>Frete ({order.shipping.name})</dt>
        <dd>{order.shipping_price ? brl(order.shipping_price) : 'Grátis'}</dd>
      </div>
      <div className={s.grand}>
        <dt>Total</dt>
        <dd>{brl(order.total)}</dd>
      </div>
    </dl>
  );
}
