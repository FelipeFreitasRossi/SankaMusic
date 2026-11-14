import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAsync, useDebounce, useDocumentTitle } from '../../hooks';
import { brl, formatDate, maskPhone } from '../../utils/format';
import { Badge, ErrorState, Spinner } from '../../components/ui/Feedback';
import { Pagination } from '../../components/ui/Navigation';
import s from './Admin.module.css';

export default function CustomersPage() {
  useDocumentTitle('Clientes');
  const [page, setPage] = useState(1);
  const [term, setTerm] = useState('');
  const q = useDebounce(term, 400);
  const { data, loading, error, reload } = useAsync(() => adminService.customers({ page, q: q || undefined }), [page, q]);

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>Clientes</h1>
          <p>{data ? `${data.total} clientes cadastrados` : 'Clientes da loja'}</p>
        </div>
      </div>
      <div className={s.toolbar}>
        <label className={s.search}>
          <Search size={18} />
          <input
            placeholder="Buscar por nome ou e-mail"
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setPage(1);
            }}
            aria-label="Buscar clientes"
          />
        </label>
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
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Cadastro</th>
                <th>Pedidos</th>
                <th className={s.right}>Total gasto</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/admin/clientes/${c.id}`} style={{ fontWeight: 700 }}>
                      {c.name}
                    </Link>
                    <br />
                    <small className="muted">{c.email}</small>
                  </td>
                  <td>{c.phone ? maskPhone(c.phone) : '—'}</td>
                  <td>{formatDate(c.created_at)}</td>
                  <td>{c.orders_count}</td>
                  <td className={s.right}>{brl(c.total_spent)}</td>
                  <td>{c.active ? <Badge tone="success">Ativo</Badge> : <Badge tone="danger">Bloqueado</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && !data.items.length && <p className={s.empty}>Nenhum cliente encontrado.</p>}
        </div>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
    </>
  );
}
