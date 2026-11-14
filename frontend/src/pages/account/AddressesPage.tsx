import { useState } from 'react';
import { MapPinPlus, Pencil, Star, Trash2 } from 'lucide-react';
import { addressService } from '../../services/accountService';
import { errorMessage } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useAsync, useDocumentTitle } from '../../hooks';
import type { Address, AddressInput } from '../../types';
import { AddressCard } from '../../components/address/AddressCard';
import { AddressForm } from '../../components/address/AddressForm';
import { Button } from '../../components/ui/Button';
import { Badge, EmptyState, ErrorState, Spinner } from '../../components/ui/Feedback';
import { ConfirmDialog, Modal } from '../../components/ui/Overlay';
import s from './Account.module.css';

export default function AddressesPage() {
  useDocumentTitle('Endereços');
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => addressService.list(), []);
  const [editing, setEditing] = useState<Address | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<Address | null>(null);

  const save = async (a: AddressInput) => {
    setSaving(true);
    try {
      if (editing === 'new') await addressService.create(a);
      else if (editing) await addressService.update(editing.id, a);
      toast.success('Endereço salvo.');
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!removing) return;
    setSaving(true);
    try {
      await addressService.remove(removing.id);
      toast.success('Endereço removido.');
      setRemoving(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (a: Address) => {
    try {
      await addressService.update(a.id, { ...a, is_default: true });
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className={s.stack}>
      <header className={s.headRow}>
        <div>
          <h1 className="page-title">Endereços</h1>
          <p className="muted">Gerencie os endereços de entrega.</p>
        </div>
        <Button onClick={() => setEditing('new')} icon={<MapPinPlus size={18} />}>
          Novo endereço
        </Button>
      </header>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data?.length ? (
        <EmptyState title="Nenhum endereço cadastrado" text="Cadastre um endereço para agilizar suas compras." action={{ label: 'Cadastrar endereço', onClick: () => setEditing('new') }} />
      ) : (
        <div className={s.addressGrid}>
          {data.map((a) => (
            <AddressCard
              key={a.id}
              address={a}
              badge={a.is_default ? <Badge tone="orange">Principal</Badge> : undefined}
              actions={
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditing(a)} icon={<Pencil size={14} />}>
                    Editar
                  </Button>
                  {!a.is_default && (
                    <Button size="sm" variant="ghost" onClick={() => makeDefault(a)} icon={<Star size={14} />}>
                      Tornar principal
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setRemoving(a)} icon={<Trash2 size={14} />}>
                    Excluir
                  </Button>
                </>
              }
            />
          ))}
        </div>
      )}

      <Modal open={!!editing} title={editing === 'new' ? 'Novo endereço' : 'Editar endereço'} onClose={() => setEditing(null)}>
        {editing && (
          <AddressForm initial={editing === 'new' ? undefined : editing} loading={saving} onSubmit={save} onCancel={() => setEditing(null)} />
        )}
      </Modal>

      <ConfirmDialog
        open={!!removing}
        title="Excluir endereço"
        message="Tem certeza que deseja excluir este endereço?"
        confirmLabel="Excluir"
        danger
        loading={saving}
        onConfirm={remove}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}
