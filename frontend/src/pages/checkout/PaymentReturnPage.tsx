import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CircleCheck, Clock, RefreshCw, CircleX } from 'lucide-react';
import { orderService } from '../../services/accountService';
import { errorMessage } from '../../services/api';
import { useDocumentTitle } from '../../hooks';
import type { Order } from '../../types';
import { brl } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import { ErrorState, Spinner } from '../../components/ui/Feedback';
import { StatusBadge } from '../../components/order/OrderParts';
import s from './Checkout.module.css';

/**
 * Página de retorno do provedor. O status exibido vem SEMPRE do backend,
 * que consulta o provedor — parâmetros da URL de retorno não são confiáveis.
 */
export default function PaymentReturnPage() {
  useDocumentTitle('Status do pagamento');
  const { id = '' } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const check = () => {
    setLoading(true);
    setError(null);
    orderService
      .syncPayment(id)
      .then(setOrder)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(check, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !order) return <Spinner label="Consultando o status do pagamento..." />;
  if (error && !order) return <ErrorState message={error} onRetry={check} />;
  if (!order) return null;

  const approved = ['payment_approved', 'preparing', 'shipped', 'delivered'].includes(order.status);
  const canceled = order.status === 'canceled';

  return (
    <div className="container page" style={{ maxWidth: 720 }}>
      <div className={`card ${s.main}`}>
        <div className={`${s.panel} ${s.confirm}`}>
          <span
            className={s.confirmIcon}
            style={approved ? { background: 'var(--success-bg)', color: 'var(--success)' } : canceled ? { background: 'var(--danger-bg)', color: 'var(--danger)' } : undefined}
          >
            {approved ? <CircleCheck size={36} /> : canceled ? <CircleX size={36} /> : <Clock size={34} />}
          </span>
          <h1 style={{ fontSize: '1.6rem', margin: 0 }}>
            {approved ? 'Pagamento aprovado!' : canceled ? 'Pedido cancelado' : 'Aguardando confirmação do pagamento'}
          </h1>
          <StatusBadge status={order.status} />
          <p className="muted">
            {approved
              ? `Recebemos a confirmação do provedor para o pedido #${order.number} (${brl(order.total)}). Você receberá atualizações por e-mail.`
              : canceled
                ? `O pedido #${order.number} foi cancelado.`
                : `O provedor ainda não confirmou o pagamento do pedido #${order.number}. Pagamentos via Pix e boleto podem levar alguns minutos (ou dias úteis, no caso do boleto). Esta página não aprova pagamentos — apenas consulta o provedor.`}
          </p>
          <div className={s.confirmActions}>
            {!approved && !canceled && (
              <Button variant="outline" onClick={check} loading={loading} icon={<RefreshCw size={16} />}>
                Verificar novamente
              </Button>
            )}
            <Button to={`/conta/pedidos/${order.id}`}>Ver detalhes do pedido</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
