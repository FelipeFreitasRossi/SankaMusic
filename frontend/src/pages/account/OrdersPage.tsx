import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import { orderService } from '../../services/accountService';
import { useAsync, useDocumentTitle } from '../../hooks';
import { brl, formatDate, pluralize } from '../../utils/format';
import { imgUrl } from '../../utils/constants';
import { StatusBadge } from '../../components/order/OrderParts';
import { EmptyState, ErrorState, Spinner } from '../../components/ui/Feedback';
import { Pagination } from '../../components/ui/Navigation';
import s from './Account.module.css';

export default function OrdersPage() {
  useDocumentTitle('Meus pedidos');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => orderService.list(page), [page]);

  return (
    <div className={s.stack}>
      <header>
        <h1 className="page-title">Meus pedidos</h1>
        <p className="muted">Acompanhe o status e os detalhes das suas compras.</p>
      </header>
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data?.items.length ? (
        <EmptyState icon={<Package size={36} />} title="Você ainda não fez pedidos" text="Quando você comprar, seus pedidos aparecerão aqui." action={{ label: 'Começar a comprar', to: '/' }} />
      ) : (
        <>
          <ul className={s.orderList}>
            {data.items.map((o) => (
              <li key={o.id}>
                <Link to={`/conta/pedidos/${o.id}`} className={`card ${s.orderRow}`}>
                  <div className={s.orderThumbs}>
                    {o.items.slice(0, 3).map((it) => (
                      <img key={it.product_id} src={imgUrl(it.image)} alt="" />
                    ))}
                  </div>
                  <div className={s.orderMeta}>
                    <b>Pedido #{o.number}</b>
                    <small>
                      {formatDate(o.created_at)} · {pluralize(o.items.reduce((n, i) => n + i.quantity, 0), 'item', 'itens')}
                    </small>
                  </div>
                  <StatusBadge status={o.status} />
                  <strong className={s.orderTotal}>{brl(o.total)}</strong>
                  <ChevronRight size={20} className={s.chev} />
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
