import { useState, type FormEvent } from 'react';
import { Truck } from 'lucide-react';
import { catalogService } from '../../services/catalogService';
import { errorMessage } from '../../services/api';
import type { CartItem, ShippingOption } from '../../types';
import { brl, maskCep, onlyDigits } from '../../utils/format';
import { storage } from '../../utils/storage';
import s from './ProductDetail.module.css';

export function ShippingCalculator({ items }: { items: CartItem[] }) {
  const [cep, setCep] = useState(() => maskCep(storage.get<string>('sanka.cep', '')));
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const digits = onlyDigits(cep);
    if (digits.length !== 8) {
      setError('Informe um CEP válido com 8 dígitos.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await catalogService.shippingQuote(digits, items);
      setOptions(r.options);
      storage.set('sanka.cep', digits);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.shipping}>
      <form onSubmit={submit} className={s.shipForm}>
        <label htmlFor="cep-calc">
          <Truck size={18} /> Calcular frete e prazo
        </label>
        <div>
          <input
            id="cep-calc"
            inputMode="numeric"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => setCep(maskCep(e.target.value))}
            aria-invalid={!!error}
          />
          <button type="submit" disabled={loading}>
            {loading ? '...' : 'Calcular'}
          </button>
        </div>
        <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer">
          Não sei meu CEP
        </a>
      </form>
      {error && <p className={s.shipError} role="alert">{error}</p>}
      {options && (
        <ul className={s.shipOptions}>
          {options.map((o) => (
            <li key={o.code}>
              <span>
                <b>{o.name}</b>
                <small>{o.code === 'pickup' ? o.description : `até ${o.days} dias úteis`}</small>
              </span>
              <strong>{o.price === 0 ? 'Grátis' : brl(o.price)}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
