import { Link } from 'react-router-dom';
import s from './Logo.module.css';

/** Logotipo provisório: palheta laranja com um "S" em forma de onda sonora. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.066} viewBox="0 0 120 128" aria-hidden className={s.mark}>
      <defs>
        <linearGradient id="sankaPick" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF8A24" />
          <stop offset="1" stopColor="#E85A00" />
        </linearGradient>
      </defs>
      <path d="M60 4C95 4 116 18 114 44C112 74 82 108 60 124C38 108 8 74 6 44C4 18 25 4 60 4Z" fill="url(#sankaPick)" />
      <path
        d="M80 36C70 26 44 26 41 41C38 56 79 52 79 70C79 88 50 92 38 80"
        fill="none"
        stroke="#111"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <rect x="88" y="62" width="6" height="16" rx="3" fill="#111" />
      <rect x="26" y="44" width="6" height="16" rx="3" fill="#111" />
    </svg>
  );
}

export function Logo({ tone = 'light', compact, to = '/' }: { tone?: 'light' | 'dark'; compact?: boolean; to?: string }) {
  return (
    <Link to={to} className={`${s.logo} ${tone === 'dark' ? s.onLight : s.onDark}`} aria-label="Sanka Music — página inicial">
      <LogoMark size={compact ? 32 : 40} />
      <span className={s.word}>
        <span className={s.name}>SANKA</span>
        <span className={s.sub}>MUSIC</span>
      </span>
    </Link>
  );
}
