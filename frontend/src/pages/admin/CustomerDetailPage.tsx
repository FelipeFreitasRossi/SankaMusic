import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, CircleCheck } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { errorMessage } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useAsync, useDocumentTitle } from '../../hooks';
import { brl, formatDate, maskCpf, maskPhone } from '../../utils/format';
import { AddressCard } from '../../components/address/AddressCard';
import { StatusBadge } from '../../components/order/OrderParts';
import { Button } from '../../components/ui/Button';
import { Badge, ErrorState, Spinner } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Overlay';
import s from './Admin.module.css';

export default function CustomerDetailPage() {
  const { id = '' } = useParams();
  const toast = useToast();
  const { data: customer, loading, error, reload, setData } = useAsync(() => adminService.customer(id), [id]);
  const orders = useAsync(() => adminService.orders({ user_id: id }), [id]);
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  useDocumentTitle(customer?.name || 'Cliente');

  if (loading) return <Spinner />;
  if (error || !customer) return <ErrorState message={error || 'Cliente não encontrado.'} onRetry={reload} />;

  const toggle = async () => {
    setSaving(true);
    try {
      const u = await adminService.setCustomerActive(customer.id, !customer.active);
      setData({ ...customer, ...u });
      toast.success(u.active ? 'Cliente reativado.' : 'Cliente bloqueado.');
      setConfirm(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <Link to="/admin/clientes" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', color: 'var(--gray-500)', fontWeight: 600, fontSize: '0.85rem' }}>
            <ArrowLeft size={16} /> Clientes
          </Link>
          <h1>
            {customer.name} {customer.active ? <Badge tone="success">Ativo</Badge> : <Badge tone="danger">Bloqueado</Badge>}
          </h1>
          <p>Cliente desde {formatDate(customer.created_at)}</p>
        </div>
        <Button variant={customer.active ? 'outline' : 'primary'} onClick={() => setConfirm(true)} icon={customer.active ? <Ban size={16} /> : <CircleCheck size={16} />}>
          {customer.active ? 'Bloquear acesso' : 'Reativar acesso'}
        </Button>
      </div>

      <div className={s.detailGrid}>
        <section className={s.panel}>
          <h2>Pedidos</h2>
          {orders.loading ? (
            <Spinner />
          ) : orders.data?.items.length ? (
            <div className={s.tableWrap} style={{ border: 0 }}>
              <table className={s.table} style={{ minWidth: 480 }}>
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th className={s.right}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.data.items.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link to={`/admin/pedidos/${o.id}`} style={{ color: 'var(--orange-600)', fontWeight: 700 }}>
                          #{o.number}
                        </Link>
                      </td>
                      <td>{formatDate(o.created_at)}</td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                      <td className={s.right}>{brl(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={s.empty}>Nenhum pedido.</p>
          )}
        </section>

        <div className={s.stack}>
          <section className={s.panel}>
            <h2>Dados</h2>
            <dl className={s.kv}>
              <dt>E-mail</dt>
              <dd>{customer.email}</dd>
              <dt>Telefone</dt>
              <dd>{customer.phone ? maskPhone(customer.phone) : '—'}</dd>
              <dt>CPF</dt>
              <dd>{customer.cpf ? maskCpf(customer.cpf) : '—'}</dd>
            </dl>
          </section>
          <section className={s.panel}>
            <h2>Endereços</h2>
            {customer.addresses?.length ? (
              <div className={s.stack} style={{ gap: 10 }}>
                {customer.addresses.map((a) => (
                  <AddressCard key={a.id} address={a} badge={a.is_default ? <Badge tone="orange">Principal</Badge> : undefined} />
                ))}
              </div>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                Nenhum endereço cadastrado.
              </p>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        title={customer.active ? 'Bloquear cliente' : 'Reativar cliente'}
        message={customer.active ? 'O cliente não conseguirá entrar na conta até ser reativado.' : 'O cliente voltará a ter acesso à conta.'}
        confirmLabel={customer.active ? 'Bloquear' : 'Reativar'}
        danger={customer.active}
        loading={saving}
        onConfirm={toggle}
        onClose={() => setConfirm(false)}
      />
    </>
  );
}
