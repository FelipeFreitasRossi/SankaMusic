import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import s from './ui.module.css';

type Variant = 'primary' | 'dark' | 'outline' | 'ghost' | 'danger' | 'light';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  to?: string;
}

export function Button({ variant = 'primary', size = 'md', block, loading, icon, to, className = '', children, disabled, ...rest }: Props) {
  const cls = [s.btn, s[variant], size !== 'md' ? s[size] : '', block ? s.block : '', className].filter(Boolean).join(' ');
  if (to) {
    return (
      <Link to={to} className={cls}>
        {icon}
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <span className={s.btnSpinner} aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function IconButton({ label, children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button className={`${s.iconBtn} ${className}`} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}
