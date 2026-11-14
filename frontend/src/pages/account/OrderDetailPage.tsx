import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, PackageSearch, CircleX } from 'lucide-react';
import { orderService } from '../../services/accountService';
import { errorMessage } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useAsync, useDocumentTitle } from '../../hooks';
import { formatDate } from '../../utils/format';
import { PAYMENT_STATUS } from '../../utils/constants';
import { OrderItems, OrderTimeline, OrderTotals, StatusBadge } from '../../components/order/OrderParts';
import { AddressText } from '../../components/address/AddressCard';
import { Button } from '../../components/ui/Button';
import { Alert, ErrorState, Spinner } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Overlay';
import s from './Account.module.css';

export default function OrderDetailPage() {
  const { id = '' } = useParams();
  const toast = useToast();
  const { data: order, loading, error, reload, setData } = useAsync(() => orderService.get(id), [id]);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [canceling, setCanceling] = useState(false);
  useDocumentTitle(order ? `Pedido #${order.number}` : 'Pedido');

  if (loading) return <Spinner />;
  if (error || !order) return <ErrorState message={error || 'Pedido não encontrado.'} onRetry={reload} />;

  const pay = async () => {
    setPaying(true);
    setPayError(null);
    try {
      const r = await orderService.startPayment(order.id);
      window.location.href = r.redirect_url;
    } catch (err) {
      setPayError(errorMessage(err));
      setPaying(false);
    }
  };

  const cancel = async () => {
    setCanceling(true);
    try {
      setData(await orderService.cancel(order.id));
      toast.success('Pedido cancelado.');
      setConfirmCancel(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className={s.stack}>
      <Link to="/conta/pedidos" className={s.back}>
        <ArrowLeft size={16} /> Voltar para pedidos
      </Link>
      <header className={s.headRow}>
        <div>
          <h1 className="page-title">Pedido #{order.number}</h1>
          <p className="muted">Realizado em {formatDate(order.created_at, true)}</p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      <section className={`card ${s.panel}`}>
        <OrderTimeline order={order} />
        {order.tracking_code && (
          <p className={s.tracking}>
            <PackageSearch size={18} /> Código de rastreio: <b>{order.tracking_code}</b>
          </p>
        )}
      </section>

      {order.status === 'awaiting_payment' && (
        <section className={`card ${s.panel} ${s.payBox}`}>
          <div>
            <h2>Pagamento pendente</h2>
            <p className="muted">
              Status no provedor: <b>{PAYMENT_STATUS[order.payment.status] || order.payment.status}</b>. O pedido só será confirmado após a aprovação do pagamento.
            </p>
            {payError && <Alert>{payError}</Alert>}
          </div>
          <div className={s.payActions}>
            <Button onClick={pay} loading={paying} icon={<CreditCard size={18} />}>
              Pagar agora
            </Button>
            <Button variant="ghost" onClick={() => setConfirmCancel(true)} icon={<CircleX size={16} />}>
              Cancelar pedido
            </Button>
          </div>
        </section>
      )}

      <div className={s.detailGrid}>
        <section className={`card ${s.panel}`}>
          <h2>Itens</h2>
          <OrderItems items={order.items} />
        </section>
        <div className={s.stack}>
          <section className={`card ${s.panel}`}>
            <h2>Resumo</h2>
            <OrderTotals order={order} />
          </section>
          <section className={`card ${s.panel}`}>
            <h2>Entrega</h2>
            <AddressText a={order.shipping_address} />
            <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
              {order.shipping.name}
              {order.shipping.code !== 'pickup' && ` · prazo estimado de ${order.shipping.days} dias úteis após a confirmação do pagamento`}
            </p>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancelar pedido"
        message="Deseja realmente cancelar este pedido? Os itens voltarão ao estoque."
        confirmLabel="Cancelar pedido"
        danger
        loading={canceling}
        onConfirm={cancel}
        onClose={() => setConfirmCancel(false)}
      />
    </div>
  );
}
