import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { adminService, type AdminProductQuery } from '../../services/adminService';
import { errorMessage } from '../../services/api';
import { clearCatalogCache } from '../../services/catalogService';
import { useToast } from '../../contexts/ToastContext';
import { useStore } from '../../contexts/StoreContext';
import { useAsync, useDebounce, useDocumentTitle } from '../../hooks';
import type { Product } from '../../types';
import { brl } from '../../utils/format';
import { imgUrl } from '../../utils/constants';
import { Button } from '../../components/ui/Button';
import { Badge, ErrorState, Spinner } from '../../components/ui/Feedback';
import { Pagination } from '../../components/ui/Navigation';
import { ConfirmDialog } from '../../components/ui/Overlay';
import s from './Admin.module.css';

const STATUS_TABS: { key: NonNullable<AdminProductQuery['status']>; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Ativos' },
  { key: 'inactive', label: 'Inativos' },
  { key: 'low_stock', label: 'Estoque baixo' },
];

export default function ProductsPage() {
  useDocumentTitle('Produtos');
  const toast = useToast();
  const { categories, config } = useStore();
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') as AdminProductQuery['status']) || 'all';
  const category = params.get('category') || '';
  const page = Number(params.get('page') || 1);
  const [term, setTerm] = useState(params.get('q') || '');
  const q = useDebounce(term, 400);
  const { data, loading, error, reload, setData } = useAsync(
    () => adminService.products({ page, page_size: 20, q: q || undefined, status, category: category || undefined }),
    [page, q, status, category],
  );
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    if ((params.get('q') || '') !== q) setParam({ q: q || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function setParam(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next, { replace: true });
  }

  const replace = (p: Product) => setData((d) => (d ? { ...d, items: d.items.map((x) => (x.id === p.id ? p : x)) } : d));

  const toggleActive = async (p: Product) => {
    try {
      replace(await adminService.updateProduct(p.id, { active: !p.active }));
      clearCatalogCache();
      toast.success(p.active ? 'Produto desativado.' : 'Produto ativado.');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const saveStock = async (p: Product) => {
    const raw = stockEdits[p.id];
    if (raw === undefined) return;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0) {
      toast.error('Estoque inválido.');
      return;
    }
    if (n === p.stock) return;
    try {
      replace(await adminService.setStock(p.id, { stock: n }));
      setStockEdits((x) => {
        const next = { ...x };
        delete next[p.id];
        return next;
      });
      toast.success('Estoque atualizado.');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await adminService.deleteProduct(deleting.id);
      clearCatalogCache();
      toast.success('Produto excluído.');
      setDeleting(null);
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>Produtos</h1>
          <p>{data ? `${data.total} produtos` : 'Gerencie o catálogo'}</p>
        </div>
        <Button to="/admin/produtos/novo" icon={<Plus size={18} />}>
          Novo produto
        </Button>
      </div>

      <div className={s.tabs}>
        {STATUS_TABS.map((t) => (
          <button key={t.key} className={status === t.key ? s.tabActive : undefined} onClick={() => setParam({ status: t.key === 'all' ? undefined : t.key })}>
            {t.label}
          </button>
        ))}
      </div>
      <div className={s.toolbar}>
        <label className={s.search}>
          <Search size={18} />
          <input placeholder="Buscar por nome, marca ou SKU" value={term} onChange={(e) => setTerm(e.target.value)} aria-label="Buscar produtos" />
        </label>
        <select className={s.filterSelect} value={category} onChange={(e) => setParam({ category: e.target.value || undefined })} aria-label="Categoria">
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <Spinner />
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th className={s.right}>Preço</th>
                <th>Estoque</th>
                <th>Ativo</th>
                <th className={s.right}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((p) => (
                <tr key={p.id} style={{ opacity: p.active ? 1 : 0.6 }}>
                  <td>
                    <div className={s.prodCell}>
                      <img src={imgUrl(p.images[0])} alt="" />
                      <div>
                        <Link to={`/admin/produtos/${p.id}`}>{p.name}</Link>
                        <small>
                          {p.brand} {p.sku && `· ${p.sku}`} {p.featured && '· ★ Destaque'} {p.is_demo && '· demo'}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>{p.category_name}</td>
                  <td className={s.right}>
                    {p.promo_price ? (
                      <>
                        <s style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>{brl(p.price)}</s>
                        <br />
                        <b>{brl(p.final_price)}</b> <Badge tone="orange">-{p.discount_percent}%</Badge>
                      </>
                    ) : (
                      <b>{brl(p.price)}</b>
                    )}
                  </td>
                  <td>
                    <input
                      className={`${s.stockInput} ${p.stock <= config.low_stock_threshold ? s.stockLow : ''}`}
                      type="number"
                      min={0}
                      value={stockEdits[p.id] ?? p.stock}
                      onChange={(e) => setStockEdits((x) => ({ ...x, [p.id]: e.target.value }))}
                      onBlur={() => saveStock(p)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                      aria-label={`Estoque de ${p.name}`}
                    />
                  </td>
                  <td>
                    <button
                      className={`${s.switch} ${p.active ? s.switchOn : ''}`}
                      onClick={() => toggleActive(p)}
                      role="switch"
                      aria-checked={p.active}
                      aria-label={p.active ? 'Desativar produto' : 'Ativar produto'}
                    />
                  </td>
                  <td>
                    <div className={s.rowActions}>
                      <Link className={s.iconAction} to={`/produto/${p.slug}`} target="_blank" rel="noreferrer" title="Ver na loja" aria-label="Ver na loja">
                        <ExternalLink size={16} />
                      </Link>
                      <Link className={s.iconAction} to={`/admin/produtos/${p.id}`} title="Editar" aria-label="Editar">
                        <Pencil size={16} />
                      </Link>
                      <button className={`${s.iconAction} ${s.iconDanger}`} onClick={() => setDeleting(p)} title="Excluir" aria-label="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && !data.items.length && <p className={s.empty}>Nenhum produto encontrado.</p>}
        </div>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={(p) => setParam({ page: String(p) })} />}

      <ConfirmDialog
        open={!!deleting}
        title="Excluir produto"
        message={
          <>
            Excluir <b>{deleting?.name}</b> definitivamente? Produtos com pedidos não podem ser excluídos — desative-os.
          </>
        }
        confirmLabel="Excluir"
        danger
        loading={busy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
