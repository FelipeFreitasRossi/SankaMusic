import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, ChevronRight as Sep } from 'lucide-react';
import s from './ui.module.css';

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Você está em" className={s.crumbs}>
      {items.map((it, i) => (
        <Fragment key={i}>
          {i > 0 && <Sep size={14} aria-hidden />}
          {it.to && i < items.length - 1 ? <Link to={it.to}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
        </Fragment>
      ))}
    </nav>
  );
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  const nums: (number | '…')[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  return (
    <nav className={s.pagination} aria-label="Paginação">
      <button className={s.pageBtn} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Página anterior">
        <ChevronLeft size={18} />
      </button>
      {nums.map((n, i) =>
        n === '…' ? (
          <span key={`e${i}`} style={{ padding: '0 4px', color: 'var(--gray-400)' }}>
            …
          </span>
        ) : (
          <button
            key={n}
            className={`${s.pageBtn} ${n === page ? s.pageActive : ''}`}
            aria-current={n === page ? 'page' : undefined}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ),
      )}
      <button className={s.pageBtn} disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Próxima página">
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}

export function SectionHeader({ eyebrow, title, link, actions }: { eyebrow?: string; title: string; link?: { to: string; label: string }; actions?: ReactNode }) {
  return (
    <div className={s.sectionHead}>
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 className={s.sectionTitle}>{title}</h2>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {actions}
        {link && (
          <Link to={link.to} className={s.sectionLink}>
            {link.label} <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
