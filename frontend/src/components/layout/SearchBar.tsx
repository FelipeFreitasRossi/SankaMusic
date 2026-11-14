import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { catalogService } from '../../services/catalogService';
import { useClickOutside, useDebounce } from '../../hooks';
import type { Product } from '../../types';
import { brl } from '../../utils/format';
import s from './SearchBar.module.css';

/** Busca com sugestões instantâneas (debounce para economizar requisições). */
export function SearchBar({ autoFocus, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [term, setTerm] = useState(location.pathname === '/busca' ? params.get('q') || '' : '');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(term.trim(), 300);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside<HTMLFormElement>(close);
  const inputId = useId();

  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    catalogService
      .products({ q: debounced, page_size: 5 }, ctrl.signal)
      .then((r) => setResults(r.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [debounced]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    setOpen(false);
    onDone?.();
    navigate(`/busca?q=${encodeURIComponent(q)}`);
  };

  const showPanel = open && debounced.length >= 2;

  return (
    <form className={s.form} onSubmit={submit} role="search" ref={ref}>
      <label htmlFor={inputId} className="sr-only">
        Buscar produtos
      </label>
      <input
        id={inputId}
        className={s.input}
        type="search"
        placeholder="O que você quer tocar hoje? Busque guitarras, baterias, microfones..."
        value={term}
        autoComplete="off"
        autoFocus={autoFocus}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        maxLength={80}
      />
      {term && (
        <button type="button" className={s.clear} onClick={() => setTerm('')} aria-label="Limpar busca">
          <X size={16} />
        </button>
      )}
      <button type="submit" className={s.submit} aria-label="Buscar">
        <Search size={20} />
      </button>

      {showPanel && (
        <div className={s.panel}>
          {loading && !results.length && <p className={s.info}>Buscando…</p>}
          {!loading && !results.length && <p className={s.info}>Nenhum produto encontrado para “{debounced}”.</p>}
          {results.map((p) => (
            <Link
              key={p.id}
              to={`/produto/${p.slug}`}
              className={s.item}
              onClick={() => {
                setOpen(false);
                onDone?.();
              }}
            >
              <img src={p.images[0]} alt="" width={48} height={48} />
              <span className={s.itemName}>
                <small>{p.brand}</small>
                {p.name}
              </span>
              <strong>{brl(p.final_price)}</strong>
            </Link>
          ))}
          {results.length > 0 && (
            <button type="submit" className={s.all}>
              Ver todos os resultados para “{debounced}”
            </button>
          )}
        </div>
      )}
    </form>
  );
}
