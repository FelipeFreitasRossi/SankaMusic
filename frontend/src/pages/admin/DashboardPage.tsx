import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TriangleAlert, DollarSign, Package, Receipt, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAsync, useDocumentTitle } from '../../hooks';
import type { OrderStatus } from '../../types';
import { ORDER_STATUS, imgUrl } from '../../utils/constants';
import { brl, formatDate } from '../../utils/format';
import { StatusBadge } from '../../components/order/OrderParts';
import { ErrorState, Spinner } from '../../components/ui/Feedback';
import s from './Admin.module.css';

export default function DashboardPage() {
  useDocumentTitle('Dashboard');
  const [days, setDays] = useState(30);
  const { data, loading, error, reload } = useAsync(() => adminService.dashboard(days), [days]);

  if (loading && !data) return <Spinner />;
  if (error || !data) return <ErrorState message={error || 'Erro ao carregar.'} onRetry={reload} />;

  const max = Math.max(1, ...data.daily.map((d) => d.total));

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral da loja</p>
        </div>
        <select className={s.filterSelect} value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Período">
          <option value={7}>Últimos 7 dias</option>
          <option value={30}>Últimos 30 dias</option>
          <option value={90}>Últimos 90 dias</option>
          <option value={365}>Últimos 12 meses</option>
        </select>
      </div>

      <div className={s.kpis}>
        <div className={`${s.kpi} ${s.kpiDark}`}>
          <span className={s.kpiIcon}><DollarSign size={20} /></span>
          <small>Faturamento confirmado</small>
          <strong>{brl(data.revenue_total)}</strong>
          <span>{brl(data.revenue_period)} no período</span>
        </div>
        <div className={s.kpi}>
          <span className={s.kpiIcon}><TrendingUp size={20} /></span>
          <small>Total de vendas (pagas)</small>
          <strong>{data.total_sales}</strong>
          <span>{data.sales_period} no período · ticket médio {brl(data.average_ticket)}</span>
        </div>
        <div className={s.kpi}>
          <span className={s.kpiIcon}><Receipt size={20} /></span>
          <small>Pedidos (todos os status)</small>
          <strong>{data.orders_count}</strong>
          <span>{data.status_counts.awaiting_payment} aguardando pagamento</span>
        </div>
        <div className={`${s.kpi} ${data.low_stock_count ? s.kpiWarn : ''}`}>
          <span className={s.kpiIcon}><Package size={20} /></span>
          <small>Produtos cadastrados</small>
          <strong>{data.products_count}</strong>
          <span>
            {data.active_products} ativos · {data.low_stock_count} com estoque baixo · <Users size={12} /> {data.customers_count} clientes
          </span>
        </div>
      </div>

      <div className={s.dashGrid}>
        <section className={s.panel}>
          <h2>
            <TrendingUp size={18} /> Faturamento diário (pedidos pagos)
          </h2>
          {data.daily.length ? (
            <>
              <div className={s.chart} role="img" aria-label="Gráfico de faturamento diário">
                {data.daily.map((d) => (
                  <div key={d.date} className={s.bar} data-tip={`${d.date.split('-').reverse().join('/')}: ${brl(d.total)} (${d.orders})`}>
                    <span style={{ height: `${(d.total / max) * 100}%` }} />
                  </div>
                ))}
              </div>
              <div className={s.chartAxis}>
                <span>{data.daily[0].date.split('-').reverse().join('/')}</span>
                <span>{data.daily[data.daily.length - 1].date.split('-').reverse().join('/')}</span>
              </div>
            </>
          ) : (
            <p className={s.empty}>Nenhuma venda paga no período.</p>
          )}
        </section>
        <section className={s.panel}>
          <h2>
            <ShoppingBag size={18} /> Pedidos por status
          </h2>
          <ul className={s.statusList}>
            {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((st) => (
              <li key={st}>
                <Link to={`/admin/pedidos?status=${st}`}>
                  <StatusBadge status={st} />
                </Link>
                <b>{data.status_counts[st] || 0}</b>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={s.panel} style={{ marginBottom: 20 }}>
        <div className={s.panelHead}>
          <h2>Pedidos recentes</h2>
          <Link to="/admin/pedidos">Ver todos</Link>
        </div>
        {data.recent_orders.length ? (
          <div className={s.tableWrap} style={{ border: 0 }}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th className={s.right}>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link to={`/admin/pedidos/${o.id}`}>
                        <b>#{o.number}</b>
                      </Link>
                    </td>
                    <td>{o.customer.name}</td>
                    <td>{formatDate(o.created_at, true)}</td>
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
          </div>
        ) : (
          <p className={s.empty}>Nenhum pedido ainda.</p>
        )}
      </section>

      <div className={s.grid2}>
        <section className={s.panel}>
          <div className={s.panelHead}>
            <h2>
              <TriangleAlert size={18} color="#b36b00" /> Estoque baixo (≤ {data.low_stock_threshold})
            </h2>
            <Link to="/admin/produtos?status=low_stock">Ver todos</Link>
          </div>
          {data.low_stock.length ? (
            <ul className={s.miniList}>
              {data.low_stock.map((p) => (
                <li key={p.id}>
                  <img src={imgUrl(p.images[0])} alt="" />
                  <Link to={`/admin/produtos/${p.id}`}>{p.name}</Link>
                  <b style={{ color: p.stock === 0 ? 'var(--danger)' : '#b36b00' }}>{p.stock} un.</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className={s.empty}>Nenhum produto com estoque baixo.</p>
          )}
        </section>
        <section className={s.panel}>
          <h2>
            <TrendingUp size={18} /> Mais vendidos
          </h2>
          {data.best_sellers.length ? (
            <ul className={s.miniList}>
              {data.best_sellers.map((p, i) => (
                <li key={p.id}>
                  <img src={imgUrl(p.images[0])} alt="" />
                  <span>
                    <Link to={`/admin/produtos/${p.id}`}>
                      {i + 1}. {p.name}
                    </Link>
                    {p.is_demo && <small>dado de demonstração</small>}
                  </span>
                  <b>{p.sold_count} vendidos</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className={s.empty}>Sem vendas registradas.</p>
          )}
        </section>
      </div>
    </>
  );
}
