import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, MapPin, RefreshCw, User } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { errorMessage } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useAsync, useDocumentTitle } from '../../hooks';
import type { OrderStatus } from '../../types';
import { ORDER_STATUS, ORDER_TRANSITIONS, PAYMENT_STATUS } from '../../utils/constants';
import { brl, formatDate, maskCpf, maskPhone } from '../../utils/format';
import { OrderItems, OrderTimeline, OrderTotals, StatusBadge } from '../../components/order/OrderParts';
import { AddressText } from '../../components/address/AddressCard';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { Alert, ErrorState, Spinner } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Overlay';
import s from './Admin.module.css';

export default function OrderDetailPage() {
  const { id = '' } = useParams();
  const toast = useToast();
  const { data: order, loading, error, reload } = useAsync(() => adminService.order(id), [id]);
  const [next, setNext] = useState<OrderStatus | ''>('');
  const [note, setNote] = useState('');
  const [tracking, setTracking] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  useDocumentTitle(order ? `Pedido #${order.number}` : 'Pedido');

  if (loading && !order) return <Spinner />;
  if (error || !order) return <ErrorState message={error || 'Pedido não encontrado.'} onRetry={reload} />;

  const options = ORDER_TRANSITIONS[order.status];

  const apply = async () => {
    if (!next) return;
    setSaving(true);
    try {
      await adminService.updateOrderStatus(order.id, { status: next, note: note || undefined, tracking_code: tracking || undefined });
      toast.success(`Status alterado para "${ORDER_STATUS[next].label}".`);
      setNext('');
      setNote('');
      setTracking('');
      setConfirm(false);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
      setConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <Link to="/admin/pedidos" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', color: 'var(--gray-500)', fontWeight: 600, fontSize: '0.85rem' }}>
            <ArrowLeft size={16} /> Pedidos
          </Link>
          <h1>
            Pedido #{order.number} <StatusBadge status={order.status} />
          </h1>
          <p>Criado em {formatDate(order.created_at, true)}</p>
        </div>
        <Button variant="outline" onClick={reload} icon={<RefreshCw size={16} />}>
          Atualizar
        </Button>
      </div>

      <section className={s.panel} style={{ marginBottom: 20 }}>
        <OrderTimeline order={order} />
      </section>

      <div className={s.detailGrid}>
        <div className={s.stack}>
          <section className={s.panel}>
            <h2>Produtos comprados</h2>
            <OrderItems items={order.items} />
            <div style={{ marginTop: 16 }}>
              <OrderTotals order={order} />
            </div>
          </section>

          <section className={s.panel}>
            <h2>
              <CreditCard size={18} /> Pagamentos
            </h2>
            <dl className={s.kv} style={{ marginBottom: 12 }}>
              <dt>Método</dt>
              <dd>{order.payment.method}</dd>
              <dt>Status</dt>
              <dd>{PAYMENT_STATUS[order.payment.status] || order.payment.status}</dd>
              {order.payment.payment_id && (
                <>
                  <dt>ID no provedor</dt>
                  <dd>{order.payment.payment_id}</dd>
                </>
              )}
            </dl>
            {order.payments?.length ? (
              <ul className={s.payments}>
                {order.payments.map((p) => (
                  <li key={p.id}>
                    <span>
                      <b>{p.provider}</b> {p.provider_payment_id ? `#${p.provider_payment_id}` : `(preferência ${p.preference_id || '—'})`}
                    </span>
                    <span>
                      {PAYMENT_STATUS[p.status] || p.status} · {brl(p.amount)} · {formatDate(p.updated_at || p.created_at, true)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                Nenhuma tentativa de pagamento registrada.
              </p>
            )}
          </section>
        </div>

        <div className={s.stack}>
          <section className={s.panel}>
            <h2>Atualizar status</h2>
            {options.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Select label="Novo status" value={next} onChange={(e) => setNext(e.target.value as OrderStatus)}>
                  <option value="">Selecione</option>
                  {options.map((st) => (
                    <option key={st} value={st}>
                      {ORDER_STATUS[st].label}
                    </option>
                  ))}
                </Select>
                {next === 'payment_approved' && (
                  <Alert tone="notice">
                    Use somente após conferir o recebimento no painel do provedor. Pagamentos online são aprovados automaticamente pelo webhook.
                  </Alert>
                )}
                {next === 'shipped' && <Input label="Código de rastreio" value={tracking} onChange={(e) => setTracking(e.target.value)} required maxLength={60} />}
                {next === 'canceled' && <Alert tone="notice">O cancelamento devolve os itens ao estoque. Estornos devem ser feitos no painel do provedor.</Alert>}
                <Input label="Observação (opcional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
                <Button onClick={() => setConfirm(true)} disabled={!next || (next === 'shipped' && !tracking.trim())}>
                  Aplicar
                </Button>
              </div>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                Este pedido está finalizado ({order.status_label}).
              </p>
            )}
            {order.tracking_code && (
              <p style={{ marginTop: 12, marginBottom: 0 }}>
                Rastreio: <b>{order.tracking_code}</b>
              </p>
            )}
          </section>

          <section className={s.panel}>
            <h2>
              <User size={18} /> Cliente
            </h2>
            <dl className={s.kv}>
              <dt>Nome</dt>
              <dd>
                {order.customer_account ? <Link to={`/admin/clientes/${order.user_id}`}>{order.customer.name}</Link> : order.customer.name}
              </dd>
              <dt>E-mail</dt>
              <dd>{order.customer.email}</dd>
              <dt>Telefone</dt>
              <dd>{order.customer.phone ? maskPhone(order.customer.phone) : '—'}</dd>
              <dt>CPF</dt>
              <dd>{order.customer.cpf ? maskCpf(order.customer.cpf) : '—'}</dd>
            </dl>
          </section>

          <section className={s.panel}>
            <h2>
              <MapPin size={18} /> Entrega
            </h2>
            <AddressText a={order.shipping_address} />
            <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 0 }}>
              {order.shipping.name} · {order.shipping_price ? brl(order.shipping_price) : 'Grátis'}
            </p>
            {order.shipping_address.phone && <p style={{ fontSize: '0.85rem', margin: 0 }}>Tel.: {maskPhone(order.shipping_address.phone)}</p>}
            {order.notes && (
              <p style={{ fontSize: '0.85rem', marginBottom: 0 }}>
                <b>Observações:</b> {order.notes}
              </p>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        title="Confirmar alteração"
        message={next ? `Alterar o pedido #${order.number} para "${ORDER_STATUS[next].label}"?` : ''}
        loading={saving}
        onConfirm={apply}
        onClose={() => setConfirm(false)}
      />
    </>
  );
}
