import { Minus, Plus, Star } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { brl, installments } from '../../utils/format';
import s from './ui.module.css';

export function Rating({ value, count, size = 15 }: { value: number; count?: number; size?: number }) {
  const rounded = Math.round(value);
  return (
    <span className={s.rating} aria-label={`Avaliação ${value.toFixed(1)} de 5${count !== undefined ? `, ${count} avaliações` : ''}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= rounded ? undefined : s.starEmpty}
          fill={i <= rounded ? 'currentColor' : 'none'}
          strokeWidth={1.8}
          aria-hidden
        />
      ))}
      {count !== undefined && <span className={s.ratingCount}>({count})</span>}
    </span>
  );
}

export function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Sua nota" style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          type="button"
          key={i}
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} estrela${i > 1 ? 's' : ''}`}
          className={`${s.starButton} ${i <= value ? s.starOn : ''}`}
          onClick={() => onChange(i)}
        >
          <Star size={26} fill={i <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

export function Price({ price, finalPrice, size = 'md' }: { price: number; finalPrice: number; size?: 'md' | 'lg' }) {
  const { config } = useStore();
  const inst = installments(finalPrice, config.max_installments, config.min_installment_value);
  const hasPromo = finalPrice < price;
  return (
    <div className={`${s.price} ${size === 'lg' ? s.priceLg : ''}`}>
      {hasPromo && (
        <span className={s.priceOld}>
          <span className="sr-only">De </span>
          {brl(price)}
        </span>
      )}
      <div className={s.priceRow}>
        <span className={s.priceFinal}>
          {hasPromo && <span className="sr-only">Por </span>}
          {brl(finalPrice)}
        </span>
      </div>
      {inst && (
        <span className={s.priceInst}>
          ou <b>{inst.count}x de {brl(inst.value)}</b> sem juros
        </span>
      )}
    </div>
  );
}

export function QuantitySelector({
  value,
  max,
  onChange,
  small,
  disabled,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  small?: boolean;
  disabled?: boolean;
}) {
  const limit = Math.max(1, Math.min(max, 99));
  return (
    <div className={`${s.qty} ${small ? s.qtySm : ''}`}>
      <button type="button" aria-label="Diminuir quantidade" disabled={disabled || value <= 1} onClick={() => onChange(value - 1)}>
        <Minus size={16} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={limit}
        value={value}
        disabled={disabled}
        aria-label="Quantidade"
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(Math.max(1, Math.min(limit, n)));
        }}
      />
      <button type="button" aria-label="Aumentar quantidade" disabled={disabled || value >= limit} onClick={() => onChange(value + 1)}>
        <Plus size={16} />
      </button>
    </div>
  );
}
