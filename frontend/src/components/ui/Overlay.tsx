import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useEscape, useLockBody } from '../../hooks';
import s from './ui.module.css';

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useLockBody(open);
  useEscape(onClose, open);
  if (!open) return null;
  return createPortal(
    <div className={s.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modal} role="dialog" aria-modal="true" aria-label={title}>
        <div className={s.modalHead}>
          <h2>{title}</h2>
          <button className={s.iconBtn} onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className={s.modalBody}>{children}</div>
        {footer && <div className={s.modalFoot}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({
  open,
  onClose,
  side = 'right',
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  label: string;
  children: ReactNode;
}) {
  useLockBody(open);
  useEscape(onClose, open);
  if (!open) return null;
  return createPortal(
    <div
      className={`${s.overlay} ${s.drawerOverlay} ${side === 'left' ? s.drawerLeft : ''}`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <aside className={s.drawer} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </aside>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  danger,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className={`${s.btn} ${s.outline} ${s.sm}`} onClick={onClose}>
            Cancelar
          </button>
          <button className={`${s.btn} ${danger ? s.danger : s.primary} ${s.sm}`} onClick={onConfirm} disabled={loading}>
            {loading && <span className={s.btnSpinner} aria-hidden />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ color: 'var(--gray-700)' }}>{message}</div>
    </Modal>
  );
}
