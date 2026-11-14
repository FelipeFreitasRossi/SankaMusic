import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { SearchX, SlidersHorizontal, X } from 'lucide-react';
import { catalogService, type SortKey } from '../services/catalogService';
import { errorMessage } from '../services/api';
import { useStore } from '../contexts/StoreContext';
import { useDocumentTitle } from '../hooks';
import type { ProductListResponse } from '../types';
import { ProductGrid } from '../components/product/ProductCollections';
import { ProductFilters, type FilterValues } from '../components/product/ProductFilters';
import { Breadcrumbs, Pagination } from '../components/ui/Navigation';
import { EmptyState, ErrorState } from '../components/ui/Feedback';
import { Drawer } from '../components/ui/Overlay';
import { Button } from '../components/ui/Button';
import { CategoryIcon } from '../components/brand/CategoryIcon';
import { SORT_OPTIONS, imgUrl } from '../utils/constants';
import { pluralize } from '../utils/format';
import s from './CatalogPage.module.css';

type Mode = 'all' | 'category' | 'search' | 'offers';
const PAGE_SIZE = 24;

const num = (v: string | null) => (v && !Number.isNaN(Number(v)) ? Number(v) : undefined);

export default function CatalogPage({ mode }: { mode: Mode }) {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const { categories } = useStore();
  const [data, setData] = useState<ProductListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [retry, setRetry] = useState(0);

  const category = categories.find((c) => c.slug === slug);
  const q = params.get('q') || '';
  const sort = (params.get('sort') as SortKey) || 'relevance';
  const page = num(params.get('page')) || 1;

  const values: FilterValues = useMemo(
    () => ({
      brand: params.getAll('brand'),
      min_price: num(params.get('min_price')),
      max_price: num(params.get('max_price')),
      in_stock: params.get('in_stock') === 'true',
      min_rating: num(params.get('min_rating')),
      on_sale: mode === 'offers' || params.get('on_sale') === 'true',
    }),
    [params, mode],
  );

  const title =
    mode === 'category' ? category?.name || 'Categoria' : mode === 'search' ? `Resultados para “${q}”` : mode === 'offers' ? 'Ofertas' : 'Todos os produtos';
  useDocumentTitle(title);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    catalogService
      .products(
        {
          q: mode === 'search' ? q : undefined,
          category: mode === 'category' ? slug : undefined,
          brand: values.brand,
          min_price: values.min_price,
          max_price: values.max_price,
          in_stock: values.in_stock || undefined,
          min_rating: values.min_rating,
          on_sale: values.on_sale || undefined,
          sort,
          page,
          page_size: PAGE_SIZE,
        },
        ctrl.signal,
      )
      .then(setData)
      .catch((e) => {
        if ((e as Error).name !== 'AbortError') setError(errorMessage(e));
      })
      .finally(() => !ctrl.signal.aborted && setLoading(false));
    return () => ctrl.abort();
  }, [mode, slug, q, sort, page, values, retry]);

  const update = (changes: Record<string, string | string[] | number | boolean | undefined>, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => {
      next.delete(k);
      if (Array.isArray(v)) v.forEach((x) => next.append(k, x));
      else if (v !== undefined && v !== false && v !== '') next.set(k, String(v));
    });
    if (resetPage) next.delete('page');
    setParams(next);
    if (!resetPage) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (sort !== 'relevance') next.set('sort', sort);
    setParams(next);
  };

  const filters = (
    <ProductFilters
      values={values}
      brands={data?.facets.brands || []}
      priceRange={{ min: data?.facets.price_min || 0, max: data?.facets.price_max || 0 }}
      categories={categories}
      currentCategory={slug}
      onChange={(v) => update(v as Record<string, string[] | number | boolean | undefined>)}
      onClear={clearFilters}
    />
  );

  const chips = [
    ...values.brand.map((b) => ({ label: b, remove: () => update({ brand: values.brand.filter((x) => x !== b) }) })),
    ...(values.min_price || values.max_price
      ? [{ label: `R$ ${values.min_price ?? 0} – ${values.max_price ?? '∞'}`, remove: () => update({ min_price: undefined, max_price: undefined }) }]
      : []),
    ...(values.in_stock ? [{ label: 'Em estoque', remove: () => update({ in_stock: undefined }) }] : []),
    ...(values.on_sale && mode !== 'offers' ? [{ label: 'Em oferta', remove: () => update({ on_sale: undefined }) }] : []),
    ...(values.min_rating ? [{ label: `${values.min_rating}★ ou mais`, remove: () => update({ min_rating: undefined }) }] : []),
  ];

  return (
    <div className="page">
      {mode === 'category' && category ? (
        <section className={s.catHero}>
          <img src={imgUrl(category.image || `/demo/categories/${category.slug}.svg`)} alt="" />
          <div className={`container ${s.catHeroInner}`}>
            <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Categorias', to: '/categorias' }, { label: category.name }]} />
            <span className={s.catIcon}>
              <CategoryIcon name={category.icon} size={26} />
            </span>
            <h1 className="page-title">{category.name}</h1>
            {category.description && <p>{category.description}</p>}
          </div>
        </section>
      ) : (
        <div className="container">
          <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: title }]} />
          <h1 className="page-title">{title}</h1>
        </div>
      )}

      <div className={`container ${s.layout}`}>
        <aside className={s.sidebar} aria-label="Filtros">
          {filters}
        </aside>

        <section className={s.results} aria-live="polite" aria-busy={loading}>
          <div className={s.toolbar}>
            <span className={s.count}>{data && !loading ? pluralize(data.total, 'produto encontrado', 'produtos encontrados') : 'Carregando…'}</span>
            <div className={s.toolbarRight}>
              <Button variant="outline" size="sm" className={s.filterBtn} onClick={() => setFiltersOpen(true)} icon={<SlidersHorizontal size={16} />}>
                Filtros {chips.length > 0 && `(${chips.length})`}
              </Button>
              <label className={s.sort}>
                <span>Ordenar por</span>
                <select value={sort} onChange={(e) => update({ sort: e.target.value === 'relevance' ? undefined : e.target.value })}>
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {chips.length > 0 && (
            <div className={s.chips}>
              {chips.map((c) => (
                <button key={c.label} className={s.chip} onClick={c.remove} aria-label={`Remover filtro ${c.label}`}>
                  {c.label} <X size={14} />
                </button>
              ))}
              <button className={s.clearAll} onClick={clearFilters}>
                Limpar filtros
              </button>
            </div>
          )}

          {error ? (
            <ErrorState message={error} onRetry={() => setRetry((r) => r + 1)} />
          ) : !loading && data && data.items.length === 0 ? (
            <EmptyState
              icon={<SearchX size={36} />}
              title="Nenhum produto encontrado"
              text={
                mode === 'search'
                  ? 'Tente outras palavras-chave ou verifique a ortografia.'
                  : 'Ajuste ou remova alguns filtros para ver mais resultados.'
              }
              action={chips.length ? { label: 'Limpar filtros', onClick: clearFilters } : { label: 'Ver todos os produtos', to: '/produtos' }}
            />
          ) : (
            <>
              <ProductGrid products={data?.items || []} loading={loading} skeletons={8} />
              {data && <Pagination page={data.page} pages={data.pages} onChange={(p) => update({ page: p > 1 ? p : undefined }, false)} />}
            </>
          )}
        </section>
      </div>

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} side="left" label="Filtros">
        <div className={s.drawerBody}>{filters}</div>
        <div className={s.drawerFoot}>
          <Button block onClick={() => setFiltersOpen(false)}>
            Ver {data ? pluralize(data.total, 'produto', 'produtos') : 'produtos'}
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
