import { useState, type FormEvent } from 'react';
import { lookupCep } from '../../services/accountService';
import type { AddressInput } from '../../types';
import { maskCep, maskPhone, onlyDigits } from '../../utils/format';
import { UFS } from '../../utils/constants';
import { Checkbox, Input, Select } from '../ui/Field';
import { Button } from '../ui/Button';
import s from './Address.module.css';

export const EMPTY_ADDRESS: AddressInput = {
  label: 'Casa',
  recipient: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
  phone: '',
  is_default: false,
};

type Errors = Partial<Record<keyof AddressInput, string>>;

export function validateAddress(a: AddressInput): Errors {
  const e: Errors = {};
  if (a.recipient.trim().length < 3) e.recipient = 'Informe o destinatário.';
  if (onlyDigits(a.cep).length !== 8) e.cep = 'CEP inválido.';
  if (a.street.trim().length < 2) e.street = 'Informe a rua.';
  if (!a.number.trim()) e.number = 'Informe o número (ou S/N).';
  if (a.district.trim().length < 2) e.district = 'Informe o bairro.';
  if (a.city.trim().length < 2) e.city = 'Informe a cidade.';
  if (!UFS.includes(a.state)) e.state = 'Selecione a UF.';
  if (a.phone && ![10, 11].includes(onlyDigits(a.phone).length)) e.phone = 'Telefone inválido.';
  return e;
}

export function AddressForm({
  initial,
  submitLabel = 'Salvar endereço',
  loading,
  onSubmit,
  onCancel,
  showDefault = true,
}: {
  initial?: AddressInput;
  submitLabel?: string;
  loading?: boolean;
  onSubmit: (a: AddressInput) => void;
  onCancel?: () => void;
  showDefault?: boolean;
}) {
  const [a, setA] = useState<AddressInput>({ ...EMPTY_ADDRESS, ...initial, cep: maskCep(initial?.cep || ''), phone: maskPhone(initial?.phone || '') });
  const [errors, setErrors] = useState<Errors>({});
  const [cepLoading, setCepLoading] = useState(false);
  const set = <K extends keyof AddressInput>(k: K, v: AddressInput[K]) => setA((x) => ({ ...x, [k]: v }));

  const onCep = async (value: string) => {
    const masked = maskCep(value);
    set('cep', masked);
    if (onlyDigits(masked).length === 8) {
      setCepLoading(true);
      const found = await lookupCep(masked);
      setCepLoading(false);
      if (found) setA((x) => ({ ...x, ...Object.fromEntries(Object.entries(found).filter(([, v]) => v)) }));
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateAddress(a);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit({ ...a, cep: onlyDigits(a.cep), phone: a.phone ? onlyDigits(a.phone) : null, complement: a.complement || null });
  };

  return (
    <form className={s.form} onSubmit={submit} noValidate>
      <div className={s.grid}>
        <Input className={s.span2} label="Destinatário" value={a.recipient} onChange={(e) => set('recipient', e.target.value)} error={errors.recipient} required autoComplete="name" />
        <Input label="Identificação" value={a.label} onChange={(e) => set('label', e.target.value)} placeholder="Casa, Trabalho..." maxLength={40} />
        <Input
          label="CEP"
          inputMode="numeric"
          value={a.cep}
          onChange={(e) => onCep(e.target.value)}
          error={errors.cep}
          hint={cepLoading ? 'Buscando endereço…' : undefined}
          required
          autoComplete="postal-code"
        />
        <Input className={s.span2} label="Rua / Avenida" value={a.street} onChange={(e) => set('street', e.target.value)} error={errors.street} required autoComplete="address-line1" />
        <Input label="Número" value={a.number} onChange={(e) => set('number', e.target.value)} error={errors.number} required />
        <Input label="Complemento" value={a.complement || ''} onChange={(e) => set('complement', e.target.value)} placeholder="Apto, bloco..." />
        <Input label="Bairro" value={a.district} onChange={(e) => set('district', e.target.value)} error={errors.district} required />
        <Input label="Cidade" value={a.city} onChange={(e) => set('city', e.target.value)} error={errors.city} required autoComplete="address-level2" />
        <Select label="UF" value={a.state} onChange={(e) => set('state', e.target.value)} error={errors.state} required>
          <option value="">Selecione</option>
          {UFS.map((uf) => (
            <option key={uf}>{uf}</option>
          ))}
        </Select>
        <Input label="Telefone para contato" type="tel" value={a.phone || ''} onChange={(e) => set('phone', maskPhone(e.target.value))} error={errors.phone} placeholder="(00) 00000-0000" />
      </div>
      {showDefault && <Checkbox label="Usar como endereço principal" checked={a.is_default} onChange={(e) => set('is_default', e.target.checked)} />}
      <div className={s.actions}>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
