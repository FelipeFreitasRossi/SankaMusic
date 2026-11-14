import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import s from './ui.module.css';

interface Base {
  label?: string;
  error?: string | null;
  hint?: ReactNode;
  className?: string;
}

function Wrap({ id, label, error, hint, required, className, children }: Base & { id: string; required?: boolean; children: ReactNode }) {
  return (
    <div className={`${s.field} ${className || ''}`}>
      {label && (
        <label htmlFor={id} className={s.label}>
          {label} {required && <span className={s.required}>*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span id={`${id}-err`} className={s.error} role="alert">
          {error}
        </span>
      ) : (
        hint && <span className={s.hint}>{hint}</span>
      )}
    </div>
  );
}

export function Input({ label, error, hint, className, id, ...rest }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const fid = id || auto;
  return (
    <Wrap id={fid} label={label} error={error} hint={hint} required={rest.required} className={className}>
      <input
        id={fid}
        className={`${s.control} ${error ? s.invalid : ''}`}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${fid}-err` : undefined}
        {...rest}
      />
    </Wrap>
  );
}

export function Select({ label, error, hint, className, id, children, ...rest }: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const fid = id || auto;
  return (
    <Wrap id={fid} label={label} error={error} hint={hint} required={rest.required} className={className}>
      <select id={fid} className={`${s.control} ${error ? s.invalid : ''}`} aria-invalid={!!error || undefined} {...rest}>
        {children}
      </select>
    </Wrap>
  );
}

export function Textarea({ label, error, hint, className, id, ...rest }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const fid = id || auto;
  return (
    <Wrap id={fid} label={label} error={error} hint={hint} required={rest.required} className={className}>
      <textarea id={fid} className={`${s.control} ${error ? s.invalid : ''}`} aria-invalid={!!error || undefined} {...rest} />
    </Wrap>
  );
}

export function Checkbox({ label, ...rest }: { label: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={s.check}>
      <input type="checkbox" {...rest} />
      <span>{label}</span>
    </label>
  );
}
