import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAsync, useDebounce, useDocumentTitle } from '../../hooks';
import type { OrderStatus } from '../../types';
import { ORDER_STATUS, PAYMENT_STATUS } from '../../utils/constants';
import { brl, formatDate } from '../../utils/format';
import { StatusBadge } from '../../components/order/OrderParts';
import { ErrorState, Spinner } from '../../components/ui/Feedback';
import { Pagination } from '../../components/ui/Navigation';
import s from './Admin.module.css';

export default function OrdersPage() {
  useDocumentTitle('Pedidos');
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') as OrderStatus) || '';
  const page = Number(params.get('page') || 1);
  const [term, setTerm] = useState('');
  const q = useDebounce(term, 400);
  const { data, loading, error, reload } = useAsync(() => adminService.orders({ page, status, q: q || undefined }), [page, status, q]);

  const setParam = (k: string, v?: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>Pedidos</h1>
          <p>{data ? `${data.total} pedidos` : 'Acompanhe e atualize os pedidos'}</p>
        </div>
      </div>
      <div className={s.tabs}>
        <button className={!status ? s.tabActive : undefined} onClick={() => setParam('status')}>
          Todos
        </button>
        {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((st) => (
          <button key={st} className={status === st ? s.tabActive : undefined} onClick={() => setParam('status', st)}>
            {ORDER_STATUS[st].label}
          </button>
        ))}
      </div>
      <div className={s.toolbar}>
        <label className={s.search}>
          <Search size={18} />
          <input placeholder="Nº do pedido, nome ou e-mail do cliente" value={term} onChange={(e) => setTerm(e.target.value)} aria-label="Buscar pedidos" />
        </label>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <Spinner />
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Itens</th>
                <th>Pagamento</th>
                <th>Status</th>
                <th className={s.right}>Total</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to={`/admin/pedidos/${o.id}`} style={{ color: 'var(--orange-600)', fontWeight: 700 }}>
                      #{o.number}
                    </Link>
                  </td>
                  <td>{formatDate(o.created_at, true)}</td>
                  <td>
                    <b>{o.customer.name}</b>
                    <br />
                    <small className="muted">{o.customer.email}</small>
                  </td>
                  <td>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                  <td>{PAYMENT_STATUS[o.payment.status] || o.payment.status}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className={s.right}>
                    <b>{brl(o.total)}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && !data.items.length && <p className={s.empty}>Nenhum pedido encontrado.</p>}
        </div>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={(p) => setParam('page', String(p))} />}
    </>
  );
}
