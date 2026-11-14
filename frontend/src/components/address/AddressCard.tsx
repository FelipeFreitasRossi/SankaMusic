import type { ReactNode } from 'react';
import { MapPin } from 'lucide-react';
import type { AddressInput } from '../../types';
import { maskCep } from '../../utils/format';
import s from './Address.module.css';

export function AddressText({ a }: { a: Omit<AddressInput, 'label' | 'is_default'> & { label?: string } }) {
  return (
    <address className={s.text}>
      <b>{a.recipient}</b>
      <span>
        {a.street}, {a.number}
        {a.complement ? ` — ${a.complement}` : ''}
      </span>
      <span>
        {a.district} · {a.city}/{a.state}
      </span>
      <span>CEP {maskCep(a.cep)}</span>
    </address>
  );
}

export function AddressCard({
  address,
  selected,
  onSelect,
  actions,
  badge,
}: {
  address: AddressInput;
  selected?: boolean;
  onSelect?: () => void;
  actions?: ReactNode;
  badge?: ReactNode;
}) {
  const content = (
    <>
      <div className={s.cardHead}>
        <span className={s.label}>
          <MapPin size={16} /> {address.label || 'Endereço'}
        </span>
        {badge}
      </div>
      <AddressText a={address} />
      {actions && <div className={s.cardActions}>{actions}</div>}
    </>
  );
  if (onSelect) {
    return (
      <button type="button" className={`${s.card} ${s.selectable} ${selected ? s.selected : ''}`} onClick={onSelect} aria-pressed={selected}>
        {content}
      </button>
    );
  }
  return <div className={`${s.card} ${selected ? s.selected : ''}`}>{content}</div>;
}
