import type { CSSProperties, ReactNode } from 'react';
import { CircleAlert, Info, PackageOpen } from 'lucide-react';
import { Button } from './Button';
import s from './ui.module.css';

export function Spinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className={s.spinnerWrap} role="status" aria-live="polite">
      <span className={s.spinner} aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function Skeleton({ width = '100%', height = 16, radius, style }: { width?: number | string; height?: number | string; radius?: number; style?: CSSProperties }) {
  return <span className={s.skeleton} style={{ display: 'block', width, height, borderRadius: radius, ...style }} aria-hidden />;
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon?: ReactNode;
  title: string;
  text?: ReactNode;
  action?: { label: string; to?: string; onClick?: () => void };
}) {
  return (
    <div className={`${s.empty} fade-in`}>
      <div className={s.emptyIcon}>{icon || <PackageOpen size={38} />}</div>
      <h2 className={s.emptyTitle}>{title}</h2>
      {text && <p className={s.emptyText}>{text}</p>}
      {action && (
        <Button to={action.to} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className={s.empty}>
      <div className={s.emptyIcon} style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
        <CircleAlert size={36} />
      </div>
      <h2 className={s.emptyTitle}>Algo deu errado</h2>
      <p className={s.emptyText}>{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function Alert({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'notice' }) {
  return (
    <div className={tone === 'error' ? s.errorBox : s.notice} role={tone === 'error' ? 'alert' : 'note'}>
      {tone === 'error' ? <CircleAlert size={20} style={{ flexShrink: 0 }} /> : <Info size={20} style={{ flexShrink: 0 }} />}
      <div>{children}</div>
    </div>
  );
}

type Tone = 'orange' | 'dark' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
export function Badge({ tone = 'neutral', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={`${s.badge} ${s[`b-${tone}`]} ${className}`}>{children}</span>;
}
