import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Category } from '../../types';
import { Checkbox } from '../ui/Field';
import s from './ProductFilters.module.css';

export interface FilterValues {
  brand: string[];
  min_price?: number;
  max_price?: number;
  in_stock: boolean;
  min_rating?: number;
  on_sale: boolean;
}

interface Props {
  values: FilterValues;
  brands: string[];
  priceRange: { min: number; max: number };
  categories: Category[];
  currentCategory?: string;
  hideCategories?: boolean;
  onChange: (v: Partial<FilterValues>) => void;
  onClear: () => void;
}

export function ProductFilters({ values, brands, priceRange, categories, currentCategory, hideCategories, onChange, onClear }: Props) {
  const [min, setMin] = useState(values.min_price?.toString() || '');
  const [max, setMax] = useState(values.max_price?.toString() || '');

  useEffect(() => {
    setMin(values.min_price?.toString() || '');
    setMax(values.max_price?.toString() || '');
  }, [values.min_price, values.max_price]);

  const toggleBrand = (b: string) =>
    onChange({ brand: values.brand.includes(b) ? values.brand.filter((x) => x !== b) : [...values.brand, b] });

  const applyPrice = () => {
    const mn = min ? Number(min) : undefined;
    const mx = max ? Number(max) : undefined;
    onChange({ min_price: mn, max_price: mx && mn && mx < mn ? mn : mx });
  };

  const active =
    values.brand.length > 0 || values.min_price || values.max_price || values.in_stock || values.min_rating || values.on_sale;

  return (
    <div className={s.filters}>
      <div className={s.head}>
        <h2>Filtros</h2>
        {active && (
          <button className={s.clear} onClick={onClear}>
            Limpar tudo
          </button>
        )}
      </div>

      {!hideCategories && (
        <fieldset className={s.group}>
          <legend>Categorias</legend>
          <ul className={s.cats}>
            <li>
              <Link to="/produtos" className={!currentCategory ? s.catActive : undefined}>
                Todas
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link to={`/categoria/${c.slug}`} className={currentCategory === c.slug ? s.catActive : undefined}>
                  {c.name}
                  <span>{c.product_count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      {brands.length > 0 && (
        <fieldset className={s.group}>
          <legend>Marca</legend>
          <div className={s.options}>
            {brands.map((b) => (
              <Checkbox key={b} label={b} checked={values.brand.includes(b)} onChange={() => toggleBrand(b)} />
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className={s.group}>
        <legend>Faixa de preço</legend>
        <div className={s.price}>
          <label>
            <span className="sr-only">Preço mínimo</span>
            <input
              type="number"
              min={0}
              placeholder={`Mín. ${Math.floor(priceRange.min || 0)}`}
              value={min}
              onChange={(e) => setMin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
            />
          </label>
          <span aria-hidden>—</span>
          <label>
            <span className="sr-only">Preço máximo</span>
            <input
              type="number"
              min={0}
              placeholder={`Máx. ${Math.ceil(priceRange.max || 0)}`}
              value={max}
              onChange={(e) => setMax(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
            />
          </label>
          <button onClick={applyPrice} aria-label="Aplicar faixa de preço">
            OK
          </button>
        </div>
      </fieldset>

      <fieldset className={s.group}>
        <legend>Disponibilidade</legend>
        <div className={s.options}>
          <Checkbox label="Somente em estoque" checked={values.in_stock} onChange={(e) => onChange({ in_stock: e.target.checked })} />
          <Checkbox label="Em oferta" checked={values.on_sale} onChange={(e) => onChange({ on_sale: e.target.checked })} />
        </div>
      </fieldset>

      <fieldset className={s.group}>
        <legend>Avaliação</legend>
        <div className={s.ratings}>
          {[4, 3, 2].map((r) => (
            <button
              key={r}
              className={values.min_rating === r ? s.ratingActive : undefined}
              onClick={() => onChange({ min_rating: values.min_rating === r ? undefined : r })}
              aria-pressed={values.min_rating === r}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={14} fill={i <= r ? 'currentColor' : 'none'} />
              ))}
              <span>ou mais</span>
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
